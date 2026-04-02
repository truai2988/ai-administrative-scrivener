/**
 * DELETE /api/admin/organizations/[id]  - 組織削除
 *
 * - scrivener ロールのみ実行可能
 * - 所属スタッフ（users コレクション）がいる場合は削除不可
 * - 所属外国人（foreigners コレクション）は自動的に「本部直轄（hq_direct）」へ移管
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, getAdminDb } from '@/lib/firebase/admin';

/** 本部直轄の branchId / organizationId */
const HQ_DIRECT_ID = 'hq_direct';

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

// ── DELETE: 組織削除 ──────────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireScrivener(req);
  if (result.error) return result.error;

  const { id: orgId } = await params;

  if (!orgId) {
    return NextResponse.json({ error: '組織IDが指定されていません' }, { status: 400 });
  }

  // 本部直轄自体は削除不可
  if (orgId === HQ_DIRECT_ID) {
    return NextResponse.json(
      { error: '本部直轄組織は削除できません' },
      { status: 400 }
    );
  }

  try {
    const db = getAdminDb();

    // 組織の存在確認
    const orgDoc = await db.collection('organizations').doc(orgId).get();
    if (!orgDoc.exists) {
      return NextResponse.json({ error: '指定された組織が見つかりません' }, { status: 404 });
    }
    const orgName = orgDoc.data()?.name ?? orgId;

    // ── 安全ガード: 所属スタッフが存在する場合は削除不可 ──
    const staffSnapshot = await db
      .collection('users')
      .where('organizationId', '==', orgId)
      .limit(1)
      .get();

    if (!staffSnapshot.empty) {
      return NextResponse.json(
        {
          error: `「${orgName}」にはまだスタッフアカウントが所属しています。先にユーザーを別の組織へ移動または削除してください。`,
        },
        { status: 409 }
      );
    }

    // ── 所属外国人を本部直轄へ移管（Firestoreバッチ処理）──
    const foreignersSnapshot = await db
      .collection('foreigners')
      .where('branchId', '==', orgId)
      .get();

    const now = new Date().toISOString();
    let migratedCount = 0;

    if (!foreignersSnapshot.empty) {
      // 500件ずつバッチ書き込み（Firestore制限）
      const BATCH_SIZE = 500;
      const docs = foreignersSnapshot.docs;

      for (let i = 0; i < docs.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = docs.slice(i, i + BATCH_SIZE);

        for (const doc of chunk) {
          batch.update(doc.ref, {
            branchId: HQ_DIRECT_ID,
            updatedAt: now,
          });
        }

        await batch.commit();
        migratedCount += chunk.length;
      }
    }

    // ── 組織ドキュメントを削除 ──
    await db.collection('organizations').doc(orgId).delete();

    return NextResponse.json(
      {
        success: true,
        message: `「${orgName}」を削除しました。${migratedCount > 0 ? `所属外国人 ${migratedCount} 名を本部直轄へ移管しました。` : ''}`,
        migratedForeigners: migratedCount,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[organizations DELETE] error:', err);
    return NextResponse.json({ error: '組織の削除に失敗しました' }, { status: 500 });
  }
}
