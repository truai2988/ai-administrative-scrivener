/**
 * POST /api/ai-rules/upload-pdf
 *
 * PDFファイルをアップロードし、Document AIでテキストを抽出して
 * AI診断カスタムルールとして登録する。
 *
 * 権限: scrivener のみ
 */

import { NextRequest, NextResponse } from 'next/server';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { adminAuth, getAdminDb } from '@/lib/firebase/admin';
import { getAdminStorage } from '@/lib/firebase/admin';
import type { AiDiagnosticRule } from '@/types/database';

// ─── Document AI 設定 ──────────────────────────────────────────────────────────

const PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID!;
const LOCATION = process.env.DOCUMENT_AI_LOCATION ?? 'us';
const PROCESSOR_ID = process.env.DOCUMENT_AI_PROCESSOR_ID!;

const processorName = `projects/${PROJECT_ID}/locations/${LOCATION}/processors/${PROCESSOR_ID}`;

let _docAiClient: DocumentProcessorServiceClient | null = null;

function getDocAiClient(): DocumentProcessorServiceClient {
  if (_docAiClient) return _docAiClient;

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('[upload-pdf] サービスアカウントの認証情報が設定されていません');
  }

  _docAiClient = new DocumentProcessorServiceClient({
    credentials: { client_email: clientEmail, private_key: privateKey },
    apiEndpoint: LOCATION === 'eu'
      ? 'eu-documentai.googleapis.com'
      : 'us-documentai.googleapis.com',
  });

  return _docAiClient;
}

// ─── 認証＋ロールチェック ───────────────────────────────────────────────────────

async function verifyAdminAuth(req: NextRequest): Promise<
  { uid: string; error?: never } | { uid?: never; error: NextResponse }
> {
  const authHeader = req.headers.get('Authorization');
  const idToken = authHeader?.replace('Bearer ', '').trim();

  if (!idToken) {
    return {
      error: NextResponse.json({ error: '認証トークンがありません' }, { status: 401 }),
    };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return { error: NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 403 }) };
    }

    const role = userDoc.data()?.role as string;
    if (role !== 'scrivener') {
      return { error: NextResponse.json({ error: '権限がありません' }, { status: 403 }) };
    }

    return { uid };
  } catch {
    return {
      error: NextResponse.json({ error: '無効な認証トークンです' }, { status: 401 }),
    };
  }
}

const COLLECTION = 'ai_diagnostic_rules';
const STORAGE_PREFIX = 'ai-rules';

// ─── POST: PDFアップロード＋テキスト抽出 ──────────────────────────────────────

export async function POST(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (authResult.error) return authResult.error;

  // Document AI 環境変数チェック
  if (!PROCESSOR_ID) {
    return NextResponse.json(
      { error: 'DOCUMENT_AI_PROCESSOR_ID が設定されていません' },
      { status: 503 }
    );
  }

  try {
    // ── FormDataからPDFを取得 ──────────────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'PDFファイルが見つかりません' }, { status: 400 });
    }

    if (!title.trim()) {
      return NextResponse.json({ error: 'ルール名は必須です' }, { status: 400 });
    }

    // MIMEタイプチェック
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'PDFファイルのみアップロード可能です' },
        { status: 400 }
      );
    }

    // ファイルサイズ制限（20MB）
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'ファイルサイズが20MBを超えています' },
        { status: 400 }
      );
    }

    // ── Firebase Storageへ保存 ────────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${STORAGE_PREFIX}/${timestamp}_${safeFileName}`;

    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const storageFile = bucket.file(storagePath);

    await storageFile.save(buffer, {
      metadata: {
        contentType: 'application/pdf',
      },
    });

    // 署名付きダウンロードURL取得（365日有効）
    const [downloadUrl] = await storageFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000,
    });

    // ── Document AI でテキスト抽出 ──────────────────────────────────────
    const base64Content = buffer.toString('base64');
    const client = getDocAiClient();

    const [result] = await client.processDocument({
      name: processorName,
      rawDocument: {
        content: base64Content,
        mimeType: 'application/pdf',
      },
    });

    const extractedText = result.document?.text ?? '';

    if (!extractedText.trim()) {
      // テキスト抽出失敗しても登録は続行（抽出テキスト空でルールは無効状態に）
      console.warn('[upload-pdf] PDFからテキストを抽出できませんでした:', file.name);
    }

    // ── Firestoreにルール登録 ──────────────────────────────────────────
    const db = getAdminDb();
    const now = new Date().toISOString();

    const newRule = {
      title: title.trim(),
      type: 'pdf' as const,
      pdfUrl: downloadUrl,
      pdfStoragePath: storagePath,
      pdfFileName: file.name,
      pdfExtractedText: extractedText,
      enabled: !!extractedText.trim(), // テキスト抽出成功時のみ有効
      createdAt: now,
      updatedAt: now,
      createdBy: authResult.uid,
    };

    const docRef = await db.collection(COLLECTION).add(newRule);

    const created: AiDiagnosticRule = {
      id: docRef.id,
      ...newRule,
    };

    return NextResponse.json({
      rule: created,
      extractedTextLength: extractedText.length,
      message: extractedText.trim()
        ? `PDFから ${extractedText.length} 文字のテキストを抽出しました`
        : 'PDFからテキストを抽出できませんでした。スキャン品質を確認してください。',
    }, { status: 201 });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[upload-pdf] Error:', message);
    return NextResponse.json(
      { error: `PDFアップロード中にエラーが発生しました: ${message}` },
      { status: 500 }
    );
  }
}
