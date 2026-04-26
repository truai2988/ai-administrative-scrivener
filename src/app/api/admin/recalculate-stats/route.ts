import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const db = getAdminDb();
    
    const isPending = (s?: string) => s === '準備中' || s === '編集中' || s === 'チェック中' || s === '追加資料待機' || s === '入管審査中' || s === '差し戻し';
    const isCompleted = (s?: string) => s === '完了' || s === '申請済';

    const globalStats = { total: 0, pending: 0, completed: 0 };
    const branchStats: Record<string, { total: number, pending: number, completed: number }> = {};

    const snapshot = await db.collection('foreigners').get();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const status = data.status;
      const branchId = data.branchId || 'default'; // Fallback if missing

      // Increment global
      globalStats.total += 1;
      if (isPending(status)) globalStats.pending += 1;
      if (isCompleted(status)) globalStats.completed += 1;

      // Increment branch
      if (!branchStats[branchId]) {
        branchStats[branchId] = { total: 0, pending: 0, completed: 0 };
      }
      branchStats[branchId].total += 1;
      if (isPending(status)) branchStats[branchId].pending += 1;
      if (isCompleted(status)) branchStats[branchId].completed += 1;
    });

    const batch = db.batch();
    
    // Write global stats
    const globalRef = db.collection('foreigner_stats').doc('global');
    batch.set(globalRef, globalStats);
    
    // Write branch stats
    for (const [branchId, stats] of Object.entries(branchStats)) {
      const branchRef = db.collection('foreigner_stats').doc(branchId);
      batch.set(branchRef, stats);
    }
    
    await batch.commit();

    return NextResponse.json({ success: true, globalStats, branchStats });
  } catch (error: any) {
    console.error('Error recalculating stats:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
