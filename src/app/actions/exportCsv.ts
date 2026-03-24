'use server';

import { Foreigner } from '@/types/database';

/**
 * 入管オンライン申請システム向け CSV一括出力 Server Action
 * 選択された複数の外国人データを、入管のオンライン申請にインポート可能なCSVフォーマットに変換する。
 * BOM付きUTF-8で出力し、Excelでも文字化けなく開ける。
 */

const CSV_HEADERS = [
  '氏名',
  '国籍・地域',
  '生年月日',
  '性別',
  '在留カード番号',
  '在留期限',
  '在留資格',
  '申請種別',
  '所属機関名',
  '職務内容',
  '月額報酬（基本給）',
  '月額報酬（諸手当）',
  '社会保険加入',
  '住宅提供',
];

function formatDateForCsv(dateStr: string): string {
  if (!dateStr) return '';
  // yyyy-MM-dd → yyyy/MM/dd
  return dateStr.replace(/-/g, '/');
}

function escapeCsvField(value: string): string {
  if (!value) return '';
  // ダブルクォートを含む場合はエスケープ
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function foreignerToCsvRow(foreigner: Foreigner): string {
  const fields = [
    foreigner.name || '',
    foreigner.nationality || '',
    formatDateForCsv(foreigner.birthDate),
    '', // 性別（現在のデータモデルにはないためブランク）
    foreigner.residenceCardNumber || '',
    formatDateForCsv(foreigner.expiryDate),
    foreigner.visaType || '',
    '更新', // デフォルトの申請種別
    foreigner.company || '',
    foreigner.jobTitle || foreigner.aiReview?.jobTitle || '',
    foreigner.salary || '',
    foreigner.allowances || '',
    foreigner.socialInsurance ? '加入' : '未加入',
    foreigner.housingProvided ? 'あり' : 'なし',
  ];

  return fields.map(escapeCsvField).join(',');
}

export async function generateBatchCsv(foreigners: Foreigner[]) {
  try {
    if (!foreigners || foreigners.length === 0) {
      return { success: false, error: '対象者が選択されていません。' };
    }

    // BOM + ヘッダー行 + データ行
    const BOM = '\uFEFF';
    const headerLine = CSV_HEADERS.map(escapeCsvField).join(',');
    const dataLines = foreigners.map(foreignerToCsvRow);
    const csvContent = BOM + [headerLine, ...dataLines].join('\r\n');

    // Base64エンコードして返却
    const base64 = Buffer.from(csvContent, 'utf-8').toString('base64');

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

    return {
      success: true,
      data: base64,
      filename: `入管一括申請_${timestamp}_${foreigners.length}件.csv`,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('CSV Generation Error:', error);
    return { success: false, error: errorMessage };
  }
}
