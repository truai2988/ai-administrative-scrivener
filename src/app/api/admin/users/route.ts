/**
 * GET /api/admin/users  - ユーザー一覧取得
 *
 * - scrivener ロールのみ実行可能。
 * - 組織（hq/branch/enterprise）関係なくすべてのユーザーを返す。
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, getAdminDb } from '@/lib/firebase/admin';

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

  const db = getAdminDb();
  const callerDoc = await db.collection('users').doc(callerUid).get();
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

export async function GET(req: NextRequest) {
  const result = await requireScrivener(req);
  if (result.error) return result.error;

  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection('users')
      .orderBy('createdAt', 'desc')
      .get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ users }, { status: 200 });
  } catch (err) {
    console.error('[users GET] error:', err);
    return NextResponse.json({ error: 'ユーザー一覧の取得に失敗しました' }, { status: 500 });
  }
}
