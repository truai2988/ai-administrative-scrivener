/**
 * POST /api/ocr/extract
 *
 * Firebase Storage にアップロードされた書類画像を受け取り、
 * Google Cloud Document AI (OCR) で文字を抽出して
 * フォームにマッピング可能な構造化データを返す。
 *
 * ■ MVP フェーズ: 汎用 Document OCR プロセッサを使用
 *   - 将来的に「Custom Extractor (CDE)」に切り替えるために
 *     プロセッサIDを環境変数化し、疎結合に保つ設計とする
 */

import { NextRequest, NextResponse } from 'next/server';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { getAdminStorage } from '@/lib/firebase/admin';
import { mapDocumentAiToFormData } from '@/lib/mappers/aiExtractedToFormData';

// ─── 設定 ─────────────────────────────────────────────────────────────────────

const PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID!;
const LOCATION   = process.env.DOCUMENT_AI_LOCATION ?? 'us';
const PROCESSOR_ID = process.env.DOCUMENT_AI_PROCESSOR_ID!;

// Document AI プロセッサの完全名
const processorName = `projects/${PROJECT_ID}/locations/${LOCATION}/processors/${PROCESSOR_ID}`;

// ─── Document AI クライアントの遅延初期化 ─────────────────────────────────────

let _docAiClient: DocumentProcessorServiceClient | null = null;

function getDocAiClient(): DocumentProcessorServiceClient {
  if (_docAiClient) return _docAiClient;

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('[OCR] サービスアカウントの認証情報が設定されていません');
  }

  _docAiClient = new DocumentProcessorServiceClient({
    credentials: { client_email: clientEmail, private_key: privateKey },
    // Document AI は us または eu のエンドポイントで呼ぶ
    apiEndpoint: LOCATION === 'eu'
      ? 'eu-documentai.googleapis.com'
      : 'us-documentai.googleapis.com',
  });

  return _docAiClient;
}

// ─── ハンドラ ─────────────────────────────────────────────────────────────────

export interface OcrExtractRequest {
  /** Firebase Storage 内のオブジェクトパス（例: attachments/appId/xxx.jpg） */
  storagePath: string;
  /** MIMEタイプ（例: image/jpeg、image/png、application/pdf） */
  mimeType: string;
  /** 書類の種類ヒント（将来的にプロセッサ切り替えに使用） */
  documentType?: 'residence_card' | 'passport' | 'tax_certificate' | 'general';
}

export async function POST(req: NextRequest) {
  // ── 環境変数チェック ─────────────────────────────────────────────────────
  if (!PROCESSOR_ID) {
    return NextResponse.json(
      { error: 'DOCUMENT_AI_PROCESSOR_ID が設定されていません。.env.local を確認してください。' },
      { status: 503 }
    );
  }

  // ── リクエスト解析 ───────────────────────────────────────────────────────
  let body: OcrExtractRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '不正なリクエストボディです' }, { status: 400 });
  }

  const { storagePath, mimeType } = body;

  if (!storagePath || !mimeType) {
    return NextResponse.json(
      { error: 'storagePath と mimeType は必須です' },
      { status: 400 }
    );
  }

  try {
    // ── Firebase Storage からファイルを取得 ──────────────────────────────
    const storage = getAdminStorage();
    const bucket = storage.bucket(); // デフォルトバケット
    const file = bucket.file(storagePath);

    const [fileContents] = await file.download();
    const imageContent = fileContents.toString('base64');

    // ── Document AI へ送信 ───────────────────────────────────────────────
    const client = getDocAiClient();

    const [result] = await client.processDocument({
      name: processorName,
      rawDocument: {
        content: imageContent,
        mimeType,
      },
    });

    const document = result.document;
    if (!document) {
      return NextResponse.json({ error: 'Document AI から空のレスポンスが返されました' }, { status: 502 });
    }

    // ── 抽出テキストをログ（デバッグ用） ────────────────────────────────
    console.log('[OCR] Full text:', document.text?.slice(0, 500));

    // ── マッパーでフォームデータへ変換 ──────────────────────────────────
    const { formData, extractedFields, confidence } = mapDocumentAiToFormData(document);

    return NextResponse.json({
      success: true,
      formData,
      extractedFields,
      confidence,
      rawText: document.text ?? '',
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[OCR] Error:', message);
    return NextResponse.json(
      { error: `OCR 処理中にエラーが発生しました: ${message}` },
      { status: 500 }
    );
  }
}
