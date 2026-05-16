/**
 * GET  /api/admin/organizations  - 組織一覧取得
 * POST /api/admin/organizations  - 新規組織作成
 *
 * GET  : scrivener / union_staff が実行可能
 *        union_staff は自分の所属組織のみ取得可能（他組織は非表示）
 * POST : scrivener のみ実行可能（union_staff 以下は 403）
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { createOrganizationSchema } from '@/lib/schemas/organizationSchema';
import type { UserRole } from '@/types/database';

/** 組織の作成・削除が許可されたロール */
const BRANCH_MANAGER_ROLES: UserRole[] = ['scrivener'];

/** 組織の閲覧が許可されたロール */
const ORG_VIEWER_ROLES: UserRole[] = ['scrivener', 'union_staff'];

interface CallerInfo {
  callerUid: string;
  callerRole: UserRole;
  organizationId: string | null;
}

/**
 * 共通: Bearer トークンからユーザー情報を取得する
 * 認証エラー時には { error: NextResponse } を返す
 */
async function getCallerInfo(req: NextRequest): Promise<
  { info: CallerInfo; error?: never } | { info?: never; error: NextResponse }
> {
  const authHeader = req.headers.get('Authorization');
  const idToken = authHeader?.replace('Bearer ', '').trim();

  if (!idToken) {
    console.error('[getCallerInfo] No auth token. Header:', authHeader);
    return {
      error: NextResponse.json({ error: '認証トークンがありません' }, { status: 401 }),
    };
  }

  let callerUid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    callerUid = decoded.uid;
  } catch (err) {
    console.error('[getCallerInfo] Token verification failed:', err);
    return {
      error: NextResponse.json({ error: '無効な認証トークンです' }, { status: 401 }),
    };
  }

  const callerDoc = await adminDb.collection('users').doc(callerUid).get();
  if (!callerDoc.exists) {
    console.error('[getCallerInfo] User doc not found for UID:', callerUid);
    return {
      error: NextResponse.json({ error: 'ユーザー情報が見つかりません' }, { status: 401 }),
    };
  }

  const data = callerDoc.data()!;
  const callerRole = data.role as UserRole;
  const organizationId = (data.organizationId as string | null) ?? null;

  return { info: { callerUid, callerRole, organizationId } };
}

// ── GET: 組織一覧取得 ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const result = await getCallerInfo(req);
  if (result.error) return result.error;

  const { callerRole, organizationId } = result.info;

  // 閲覧権限チェック
  if (!ORG_VIEWER_ROLES.includes(callerRole)) {
    return NextResponse.json(
      { error: 'この操作を実行する権限がありません（403 Forbidden）' },
      { status: 403 }
    );
  }

  try {
    let snapshot;

    if (callerRole === 'union_staff') {
      // union_staff は自分の所属組織1件のみ
      if (!organizationId) {
        // 組織未割当の union_staff は空配列を返す
        return NextResponse.json({ organizations: [] }, { status: 200 });
      }
      snapshot = await adminDb
        .collection('organizations')
        .where('__name__', '==', organizationId) // Firestore: ドキュメントIDで絞り込み
        .get();
    } else {
      // scrivener は全組織を取得
      snapshot = await adminDb
        .collection('organizations')
        .orderBy('createdAt', 'desc')
        .get();
    }

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
  const result = await getCallerInfo(req);
  if (result.error) return result.error;

  const { callerRole } = result.info;

  // 作成権限チェック: scrivener のみ
  if (!BRANCH_MANAGER_ROLES.includes(callerRole)) {
    return NextResponse.json(
      {
        error:
          'この操作は行政書士（scrivener）のみ実行できます（403 Forbidden）',
      },
      { status: 403 }
    );
  }

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
