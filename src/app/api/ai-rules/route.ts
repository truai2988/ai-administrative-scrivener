/**
 * GET  /api/ai-rules  — カスタム診断ルール一覧取得
 * POST /api/ai-rules  — テキストルール新規作成
 *
 * 権限: scrivener のみ
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, getAdminDb } from '@/lib/firebase/admin';
import type { AiDiagnosticRule } from '@/types/database';

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

    // Firestore からロールを確認
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

// ─── GET: 一覧取得 ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (authResult.error) return authResult.error;

  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    const rules: AiDiagnosticRule[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AiDiagnosticRule[];

    return NextResponse.json({ rules }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ai-rules] GET Error:', message);
    return NextResponse.json({ error: `ルールの取得に失敗しました: ${message}` }, { status: 500 });
  }
}

// ─── POST: テキストルール新規作成 ──────────────────────────────────────────────

interface CreateRuleBody {
  title: string;
  content: string;
}

export async function POST(req: NextRequest) {
  const authResult = await verifyAdminAuth(req);
  if (authResult.error) return authResult.error;

  let body: CreateRuleBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '不正なリクエストボディです' }, { status: 400 });
  }

  const { title, content } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'ルール名は必須です' }, { status: 400 });
  }
  if (!content?.trim()) {
    return NextResponse.json({ error: 'ルール内容は必須です' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const now = new Date().toISOString();

    const newRule = {
      title: title.trim(),
      type: 'text' as const,
      content: content.trim(),
      enabled: true,
      createdAt: now,
      updatedAt: now,
      createdBy: authResult.uid,
    };

    const docRef = await db.collection(COLLECTION).add(newRule);

    const created: AiDiagnosticRule = {
      id: docRef.id,
      ...newRule,
    };

    return NextResponse.json({ rule: created }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ai-rules] POST Error:', message);
    return NextResponse.json({ error: `ルールの作成に失敗しました: ${message}` }, { status: 500 });
  }
}
