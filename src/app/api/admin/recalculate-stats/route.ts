import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const db = getAdminDb();
    
    const isPending = (s?: string) => s === '作成中' || s === '作成完了';
    const isCompleted = (s?: string) => s === '申請済';

    const globalStats = { total: 0, pending: 0, completed: 0 };
    const orgStats: Record<string, { total: number, pending: number, completed: number }> = {};

    const snapshot = await db.collection('foreigners').get();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const status = data.status;
      const orgId = data.orgId || 'default'; // Fallback if missing

      // Increment global
      globalStats.total += 1;
      if (isPending(status)) globalStats.pending += 1;
      if (isCompleted(status)) globalStats.completed += 1;

      // Increment org
      if (!orgStats[orgId]) {
        orgStats[orgId] = { total: 0, pending: 0, completed: 0 };
      }
      orgStats[orgId].total += 1;
      if (isPending(status)) orgStats[orgId].pending += 1;
      if (isCompleted(status)) orgStats[orgId].completed += 1;
    });

    const batch = db.batch();
    
    // Write global stats
    const globalRef = db.collection('foreigner_stats').doc('global');
    batch.set(globalRef, globalStats);
    
    // Write org stats
    for (const [orgId, stats] of Object.entries(orgStats)) {
      const orgRef = db.collection('foreigner_stats').doc(orgId);
      batch.set(orgRef, stats);
    }
    
    await batch.commit();

    return NextResponse.json({ success: true, globalStats, orgStats });
  } catch (error: any) {
    console.error('Error recalculating stats:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
