/**
 * GET  /api/admin/organizations  - 組織一覧取得
 * POST /api/admin/organizations  - 新規組織作成
 *
 * どちらも scrivener ロールのみ実行可能。
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { createOrganizationSchema } from '@/lib/schemas/organizationSchema';

/** 共通: Bearer トークンから callerUid を取得し、scrivenerか確認する */
async function requireScrivener(req: NextRequest): Promise<
  { callerUid: string; error?: never } | { callerUid?: never; error: NextResponse }
> {
  const authHeader = req.headers.get('Authorization');
  const idToken = authHeader?.replace('Bearer ', '').trim();

  if (!idToken) {
    return { error: NextResponse.json({ error: '認証トークンがありません' }, { status: 401 }) };
  }

  let callerUid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    callerUid = decoded.uid;
  } catch {
    return { error: NextResponse.json({ error: '無効な認証トークンです' }, { status: 401 }) };
  }

  const callerDoc = await adminDb.collection('users').doc(callerUid).get();
  const callerRole = callerDoc.data()?.role as string;
  if (callerRole !== 'scrivener') {
    return {
      error: NextResponse.json(
        { error: 'この操作は行政書士（scrivener）のみ実行できます' },
        { status: 403 }
      ),
    };
  }

  return { callerUid };
}

// ── GET: 組織一覧取得 ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const result = await requireScrivener(req);
  if (result.error) return result.error;

  try {
    const snapshot = await adminDb
      .collection('organizations')
      .orderBy('createdAt', 'desc')
      .get();

    const organizations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ organizations }, { status: 200 });
  } catch (err) {
    console.error('[organizations GET] error:', err);
    return NextResponse.json({ error: '組織一覧の取得に失敗しました' }, { status: 500 });
  }
}

// ── POST: 新規組織作成 ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const result = await requireScrivener(req);
  if (result.error) return result.error;

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'リクエストボディが不正です' }, { status: 400 });
  }

  const parsed = createOrganizationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'バリデーションエラー', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const now = new Date().toISOString();
    const docRef = await adminDb.collection('organizations').add({
      ...parsed.data,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id: docRef.id }, { status: 200 });
  } catch (err) {
    console.error('[organizations POST] error:', err);
    return NextResponse.json({ error: '組織の作成に失敗しました' }, { status: 500 });
  }
}
