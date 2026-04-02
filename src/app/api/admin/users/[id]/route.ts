/**
 * DELETE /api/admin/users/[id]  - ユーザー削除
 *
 * - scrivener ロールのみ実行可能。
 * - 自分自身（ログイン中のアカウント）は削除不可。
 * - Firebase Auth -> Firestore の順で安全に連携削除。
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, getAdminDb } from '@/lib/firebase/admin';

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireScrivener(req);
  if (result.error) return result.error;

  const { id: targetUid } = await params;

  if (!targetUid) {
    return NextResponse.json({ error: 'ユーザーIDが指定されていません' }, { status: 400 });
  }

  // ── 安全ガード：自分自身の削除を防止 ──
  if (targetUid === result.callerUid) {
    return NextResponse.json(
      { error: 'セキュリティ保護のため、現在ログイン中の自分自身を削除することはできません。' },
      { status: 403 }
    );
  }

  try {
    const db = getAdminDb();
    
    // 対象ユーザーの存在確認
    const userDoc = await db.collection('users').doc(targetUid).get();
    if (!userDoc.exists) {
       return NextResponse.json({ error: '指定されたユーザーが見つかりません' }, { status: 404 });
    }
    const displayName = userDoc.data()?.displayName ?? targetUid;

    // ── ステップ1. Firebase Authentication からのアカウント削除 ──
    try {
      await adminAuth.deleteUser(targetUid);
    } catch (authError: unknown) {
      const e = authError as { code?: string };
      // Authにユーザーが存在しない場合は無視して進める（不整合解消のため）
      if (e.code !== 'auth/user-not-found') {
        console.error('[users DELETE] Firebase Auth error:', e);
        return NextResponse.json(
          { error: 'Firebase Auth でのアカウント削除に失敗しました。システム不整合を防ぐため中止しました。' },
          { status: 500 }
        );
      }
    }

    // ── ステップ2. Firestore からのドキュメント削除 ──
    try {
      await db.collection('users').doc(targetUid).delete();
    } catch (dbError) {
      console.error('[users DELETE] Firestore error:', dbError);
      return NextResponse.json(
        { error: 'Authのアカウントは削除されましたが、Firestoreデータ（名前等）の削除に失敗しました。手動で処理してください。' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: `ユーザー「${displayName}」を完全に削除しました。` },
      { status: 200 }
    );
  } catch (err) {
    console.error('[users DELETE] unexpected error:', err);
    return NextResponse.json({ error: 'ユーザーの削除中に予期せぬエラーが発生しました' }, { status: 500 });
  }
}
