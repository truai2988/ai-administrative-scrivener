import { addDays } from 'date-fns';
import { Foreigner, ForeignerStatus } from '@/types/database';

const NATIONALITIES = ['中国', 'ベトナム', 'フィリピン', '韓国', 'ネパール', 'インドネシア', 'アメリカ', 'タイ'];
const VISA_TYPES = ['技術・人文知識・国際業務', '技能実習', '特定技能', '日本人の配偶者等', '定住者', '家族滞在'];
const COMPANIES = ['株式会社テクノレイド', 'グローバル・アライアンス IT', '未来創生建設', 'さくらフーズ', '日本運輸サービス'];

export const generateMockData = (count: number): Foreigner[] => {
  const now = new Date();
  const foreigners: Foreigner[] = [
    {
      id: 'DEMO-001',
      name: 'NGUYEN VAN A',
      nationality: 'ベトナム',
      residenceCardNumber: 'VN12345678AB',
      birthDate: '1995-05-15',
      expiryDate: addDays(now, 60).toISOString().split('T')[0],
      passportImageUrl: 'https://via.placeholder.com/150',
      status: '準備中',
      company: 'さくらフーズ', // Added company for demo data
      aiReview: {
        riskScore: 10,
        reason: '職歴と業務内容に矛盾はなく、特定技能の要件に適合しています。',
        checkedAt: new Date().toISOString(),
        jobTitle: '飲食料品製造業（加工ライン）',
        pastExperience: 'ベトナムの食品加工工場にて3年間の実務経験あり.'
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'DEMO-002',
      name: 'DELA CRUZ JUAN',
      nationality: 'フィリピン',
      residenceCardNumber: 'PH87654321CD',
      birthDate: '1990-11-20',
      expiryDate: addDays(now, 21).toISOString().split('T')[0],
      passportImageUrl: 'https://via.placeholder.com/150',
      status: 'チェック中',
      company: '未来創生建設', // Added company for demo data
      aiReview: {
        riskScore: 85,
        reason: '【警告】過去の経歴が事務職のみであり、今回の建設分野の業務と関連性が薄く、単純労働とみなされるリスクがあります。理由書の詳細化が必要です。',
        checkedAt: new Date().toISOString(),
        jobTitle: '建設業（土木作業長）',
        pastExperience: 'フィリピンの会計事務所にて5年間の事務職経験.'
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'DEMO-003',
      name: 'THAPA RAM',
      nationality: 'ネパール',
      residenceCardNumber: 'NP11223344EE',
      birthDate: '1998-03-10',
      expiryDate: addDays(now, 120).toISOString().split('T')[0],
      passportImageUrl: 'https://via.placeholder.com/150',
      status: '申請済',
      company: '株式会社テクノレイド', // Added company for demo data
      aiReview: {
        riskScore: 5,
        reason: '正常。経歴と職務内容に整合性があり、必要書類も完備されています。',
        checkedAt: new Date().toISOString(),
        jobTitle: '宿泊業（フロント業務）',
        pastExperience: 'ネパールのホテルにてフロントデスク2年の経験.'
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
  ];

  const randomData: Foreigner[] = [];

  for (let i = 0; i < count - foreigners.length; i++) {
    const nationality = NATIONALITIES[Math.floor(Math.random() * NATIONALITIES.length)];
    const visaType = VISA_TYPES[Math.floor(Math.random() * VISA_TYPES.length)];
    const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];
    
    // Generate dates around now
    const birthDate = addDays(new Date('1985-01-01'), Math.floor(Math.random() * 8000)).toISOString().split('T')[0];
    const expiryDate = addDays(now, Math.floor(Math.random() * 200) - 10).toISOString().split('T')[0];
    
    let status: ForeignerStatus = '準備中';
    const rand = Math.random();
    if (rand > 0.8) status = '申請済';
    else if (rand > 0.5) status = 'チェック中';

    randomData.push({
      id: `FOR-${1000 + i}`,
      name: `外国人 太郎 ${i + 1}`,
      nationality,
      residenceCardNumber: `${nationality.substring(0, 2).toUpperCase()}${Math.floor(10000000 + Math.random() * 90000000)}CD`,
      birthDate,
      expiryDate,
      passportImageUrl: 'https://via.placeholder.com/150',
      status,
      visaType,
      company,
      aiReview: Math.random() > 0.3 ? {
        riskScore: Math.floor(Math.random() * 40),
        reason: '過去の経歴と今回の業務内容に整合性があり、特に問題は見当たりません。',
        checkedAt: new Date().toISOString(),
        jobTitle: '製造ライン業務',
        pastExperience: '同業種での経験が母国で2年以上あります。'
      } : undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    } as Foreigner);
  }

  // Sort random data by expiry date
  randomData.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  // Return demo data first, then sorted random data
  return [...foreigners, ...randomData];
};
