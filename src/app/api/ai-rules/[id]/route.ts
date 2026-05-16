/**
 * PUT    /api/ai-rules/[id]  — ルール更新（内容変更・有効/無効切替）
 * DELETE /api/ai-rules/[id]  — ルール削除
 *
 * 権限: scrivener のみ
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, getAdminDb } from '@/lib/firebase/admin';
import { getAdminStorage } from '@/lib/firebase/admin';
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

// ─── PUT: ルール更新 ──────────────────────────────────────────────────────────

interface UpdateRuleBody {
  title?: string;
  content?: string;
  enabled?: boolean;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAdminAuth(req);
  if (authResult.error) return authResult.error;

  const { id } = await params;

  let body: UpdateRuleBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '不正なリクエストボディです' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'ルールが見つかりません' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.content !== undefined) updateData.content = body.content.trim();
    if (body.enabled !== undefined) updateData.enabled = body.enabled;

    await docRef.update(updateData);

    const updated = { id, ...doc.data(), ...updateData } as AiDiagnosticRule;

    return NextResponse.json({ rule: updated }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ai-rules] PUT Error:', message);
    return NextResponse.json({ error: `ルールの更新に失敗しました: ${message}` }, { status: 500 });
  }
}

// ─── DELETE: ルール削除 ───────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await verifyAdminAuth(req);
  if (authResult.error) return authResult.error;

  const { id } = await params;

  try {
    const db = getAdminDb();
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'ルールが見つかりません' }, { status: 404 });
    }

    // PDF の場合は Storage からも削除
    const data = doc.data();
    if (data?.type === 'pdf' && data?.pdfStoragePath) {
      try {
        const storage = getAdminStorage();
        const bucket = storage.bucket();
        await bucket.file(data.pdfStoragePath).delete();
      } catch (storageErr) {
        // Storage削除失敗はログのみ（Firestoreレコード削除を優先）
        console.warn('[ai-rules] Storage削除に失敗:', storageErr);
      }
    }

    await docRef.delete();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ai-rules] DELETE Error:', message);
    return NextResponse.json({ error: `ルールの削除に失敗しました: ${message}` }, { status: 500 });
  }
}
