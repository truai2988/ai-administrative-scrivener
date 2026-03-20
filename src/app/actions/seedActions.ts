'use server';

import { db } from '@/lib/firebase/client';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Foreigner } from '@/types/database';
import { revalidatePath } from 'next/cache';

export async function seedDatabaseAction() {
  try {
    const foreignersRef = collection(db, 'foreigners');

    const now = new Date();
    
    // データ1（正常）: 期限2ヶ月後
    const date1 = new Date();
    date1.setMonth(now.getMonth() + 2);
    
    const demo1: Foreigner = {
      id: 'demo-normal-001',
      name: 'CHEN WEI',
      residenceCardNumber: 'AB12345678CD',
      expiryDate: date1.toISOString().split('T')[0],
      birthDate: '1995-05-15',
      nationality: '中国',
      passportImageUrl: 'https://placehold.jp/400x300.png?text=Passport+Demo',
      status: '準備中',
      company: '株式会社テクノレイド',
      visaType: '技術・人文知識・国際業務',
      aiReview: {
        riskScore: 15,
        reason: '職歴と業務内容に矛盾はありません。',
        checkedAt: now.toISOString(),
        jobTitle: 'ソフトウェアエンジニア',
        pastExperience: '北京のIT企業で5年の開発経験あり。'
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // データ2（警告）: 期限3週間後
    const date2 = new Date();
    date2.setDate(now.getDate() + 21);
    
    const demo2: Foreigner = {
      id: 'demo-warning-002',
      name: 'NGUYEN VAN A',
      residenceCardNumber: 'XY98765432ZZ',
      expiryDate: date2.toISOString().split('T')[0],
      birthDate: '1998-10-20',
      nationality: 'ベトナム',
      passportImageUrl: 'https://placehold.jp/400x300.png?text=Passport+Demo',
      status: 'チェック中',
      company: '未来創生建設',
      visaType: '技術・人文知識・国際業務',
      aiReview: {
        riskScore: 85,
        reason: '【警告】過去の経歴と従事業務の関連性が薄く、理由書の詳細化が必要です。',
        checkedAt: now.toISOString(),
        jobTitle: '施工管理補助',
        pastExperience: '母国の大学で経済学を専攻。建設関連の実務経験なし。'
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // データ3（完了）: 期限4ヶ月後
    const date3 = new Date();
    date3.setMonth(now.getMonth() + 4);
    
    const demo3: Foreigner = {
      id: 'demo-completed-003',
      name: 'MARIA GARCIA',
      residenceCardNumber: 'JK11223344ML',
      expiryDate: date3.toISOString().split('T')[0],
      birthDate: '1992-03-10',
      nationality: 'フィリピン',
      passportImageUrl: 'https://placehold.jp/400x300.png?text=Passport+Demo',
      status: '申請済',
      company: 'さくらフーズ',
      visaType: '特定技能',
      aiReview: {
        riskScore: 5,
        reason: '全ての書類が揃っており、要件を満たしています。',
        checkedAt: now.toISOString(),
        jobTitle: '外食業',
        pastExperience: 'フィリピンのレストランでの実務経験3年。特定技能評価試験合格済み。'
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // Firestore に保存
    await Promise.all([
      setDoc(doc(foreignersRef, demo1.id), demo1),
      setDoc(doc(foreignersRef, demo2.id), demo2),
      setDoc(doc(foreignersRef, demo3.id), demo3),
    ]);

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Seed Error:', error);
    return { success: false, error: String(error) };
  }
}
