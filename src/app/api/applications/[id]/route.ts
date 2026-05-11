import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { COLLECTIONS } from '@/constants/firestore';

/**
 * GET /api/applications/[id]
 * 申請書フォームのデータを取得する。
 * URLのプレフィックスから適切なFirestoreコレクションを判別します。
 * 主にリーガルチェックでのAI連携（クロスチェック用）で使用します。
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const db = getAdminDb();
    
    // プレフィックスによるコレクション判別
    let collectionName = '';
    if (id.startsWith('renewal_')) {
      collectionName = COLLECTIONS.RENEWAL_APPLICATIONS;
    } else if (id.startsWith('coe_')) {
      collectionName = COLLECTIONS.COE_APPLICATIONS;
    } else if (id.startsWith('change_status_')) {
      collectionName = COLLECTIONS.CHANGE_OF_STATUS_APPLICATIONS;
    } else if (id.startsWith('draft_')) {
      collectionName = 'dynamic_applications';
    } else {
      return NextResponse.json({ error: 'Unknown application type prefix' }, { status: 400 });
    }

    const docRef = db.collection(collectionName).doc(id);
    const snap = await docRef.get();
    
    if (!snap.exists) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const data = snap.data();
    
    // formData または data (dynamic formsの場合) を抽出
    const formData = data?.formData || data?.data || null;
    const attachments = data?.attachments || null;

    return NextResponse.json({ 
      id: snap.id,
      formData,
      attachments
    }, { status: 200 });

  } catch (error) {
    console.error('[API] Error fetching application data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
