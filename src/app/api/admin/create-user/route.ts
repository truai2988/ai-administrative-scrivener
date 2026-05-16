/**
 * POST /api/admin/create-user
 *
 * Firebase Admin SDK を使って新規ユーザーを作成する API Route。
 *
 * 【重要】クライアント側の createUserWithEmailAndPassword() を使うと
 * 呼び出し者（管理者）自身がログアウトされてしまう Firebase の仕様があるため、
 * サーバーサイドの Admin SDK でユーザーを作成することで回避する。
 *
 * リクエスト：
 *   - Authorization: Bearer <Firebase IDトークン>（呼び出し者の認証）
 *   - Body: CreateUserRequest（organizationSchema.ts 参照）
 *
 * レスポンス:
 *   - 200: { uid: string }
 *   - 400: { error: string, details?: ... }
 *   - 401: { error: string }
 *   - 403: { error: string }
 *   - 500: { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { createUserRequestSchema } from '@/lib/schemas/organizationSchema';

export async function POST(req: NextRequest) {
  // ── 1. 呼び出し者の認証（Bearer トークン検証） ─────────────────────────────
  const authHeader = req.headers.get('Authorization');
  const idToken = authHeader?.replace('Bearer ', '').trim();

  if (!idToken) {
    return NextResponse.json({ error: '認証トークンがありません' }, { status: 401 });
  }

  let callerUid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ error: '無効な認証トークンです' }, { status: 401 });
  }

  // ── 2. 呼び出し者が scrivener か確認 ─────────────────────────
  const callerDoc = await adminDb.collection('users').doc(callerUid).get();
  if (!callerDoc.exists) {
    return NextResponse.json({ error: 'ユーザー情報が見つかりません' }, { status: 403 });
  }
  const callerRole = callerDoc.data()?.role as string;
  const ALLOWED_ROLES = ['scrivener'];
  if (!ALLOWED_ROLES.includes(callerRole)) {
    return NextResponse.json(
      { error: 'この操作は行政書士（scrivener）のみ実行できます' },
      { status: 403 }
    );
  }

  // ── 3. リクエストボディのバリデーション ────────────────────────────────────
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'リクエストボディが不正です' }, { status: 400 });
  }

  const parsed = createUserRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'バリデーションエラー', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password, displayName, role, organizationId } = parsed.data;

  // ── 4. Firebase Auth にユーザーを作成 ──────────────────────────────────────
  let uid: string;
  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });
    uid = userRecord.uid;
  } catch (err: unknown) {
    const firebaseErr = err as { code?: string; message?: string };
    if (firebaseErr.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'このメールアドレスはすでに使用されています' },
        { status: 400 }
      );
    }
    console.error('[create-user] Firebase Auth error:', err);
    return NextResponse.json(
      { error: 'ユーザーの作成に失敗しました', details: firebaseErr.message },
      { status: 500 }
    );
  }

  // ── 5. Firestore に users ドキュメントを作成 ──────────────────────────────
  try {
    const now = new Date().toISOString();
    await adminDb
      .collection('users')
      .doc(uid)
      .set({
        email,
        displayName,
        role,
        organizationId: organizationId ?? null,
        createdAt: now,
        updatedAt: now,
      });
  } catch (err) {
    // Firestoreへの書き込みに失敗した場合は Authユーザーも削除してロールバック
    console.error('[create-user] Firestore write error, rolling back Auth user:', err);
    await adminAuth.deleteUser(uid).catch(() => {});
    return NextResponse.json(
      { error: 'ユーザー情報の保存に失敗しました（ロールバック済み）' },
      { status: 500 }
    );
  }

  // ── 6. 成功レスポンス ────────────────────────────────────────────────────
  return NextResponse.json({ uid }, { status: 200 });
}
