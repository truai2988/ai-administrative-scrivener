/**
 * DELETE /api/admin/users/[id]  - ユーザー削除
 * PATCH  /api/admin/users/[id]  - ユーザー編集
 *
 * - scrivener / hq_admin ロールのみ実行可能。
 * - 自分自身（ログイン中のアカウント）は削除不可。
 * - Firebase Auth -> Firestore の順で安全に連携削除。
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, getAdminDb } from '@/lib/firebase/admin';

const ALLOWED_ROLES = ['scrivener', 'hq_admin'];

async function requireManagerRole(req: NextRequest): Promise<
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
  if (!ALLOWED_ROLES.includes(callerRole)) {
    return {
      error: NextResponse.json(
        { error: 'この操作は行政書士（scrivener）または本部管理者（hq_admin）のみ実行できます' },
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
  const result = await requireManagerRole(req);
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireManagerRole(req);
  if (result.error) return result.error;

  const { id: targetUid } = await params;
  if (!targetUid) {
    return NextResponse.json({ error: 'ユーザーIDが指定されていません' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { email, displayName, role } = body;

    if (!email || !displayName || !role) {
      return NextResponse.json({ error: '必要なデータ（email, displayName, role）が不足しています' }, { status: 400 });
    }

    // ── ガード: 自分が自身のロールを変更しようとしている場合、ブロック
    if (targetUid === result.callerUid) {
      const db = getAdminDb();
      const userDoc = await db.collection('users').doc(targetUid).get();
      const currentRole = userDoc.data()?.role;
      if (role !== currentRole) {
         return NextResponse.json(
           { error: '自身の権限（ロール）は変更できません' },
           { status: 403 }
         );
      }
    }

    // ── ステップ1: Firebase Auth の更新 ──
    try {
      await adminAuth.updateUser(targetUid, {
        email,
        displayName,
      });
    } catch (authError: unknown) {
      const e = authError as { code?: string };
      console.error('[users PATCH] Firebase Auth Error:', e);
      if (e.code === 'auth/email-already-exists') {
        return NextResponse.json({ error: '指定されたメールアドレスは既に他のアカウントで使用されています。' }, { status: 409 });
      }
      if (e.code === 'auth/invalid-email') {
         return NextResponse.json({ error: '無効なメールアドレス形式です。' }, { status: 400 });
      }
      return NextResponse.json(
        { error: '認証データ（Auth）の更新に失敗しました' },
        { status: 500 }
      );
    }

    // ── ステップ2: Firestore の更新 ──
    const db = getAdminDb();
    try {
      await db.collection('users').doc(targetUid).update({
        email,
        displayName,
        role,
        updatedAt: new Date().toISOString(),
      });
    } catch (dbError) {
      console.error('[users PATCH] Firestore Error:', dbError);
      return NextResponse.json(
        { error: 'Authデータは更新されましたが、Firestoreの更新に失敗しました。システム管理者に連絡してください。' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'アカウント情報が更新されました' });
  } catch (error) {
    console.error('[users PATCH] Unexpected error:', error);
    return NextResponse.json({ error: '予期せぬエラーが発生しました' }, { status: 500 });
  }
}
