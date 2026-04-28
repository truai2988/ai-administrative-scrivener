/**
 * dummyExtractedData.ts
 *
 * Click-to-Fill 機能の開発・テスト用ダミーデータ。
 * 本番では OCR API のレスポンスを ExtractedItem[] に変換して使用する。
 */

import type { ExtractedItem } from '@/types/extractedItem';

/** COE 申請フォーム用のダミー抽出データ（10件） */
export const DUMMY_COE_EXTRACTED_DATA: ExtractedItem[] = [
  {
    id: 'e1',
    value: 'JOHN DOE',
    breadcrumb: ['身分事項', '氏名（英字）'],
    confidence: 0.95,
    mapped: false,
    mappedTo: null,
  },
  {
    id: 'e2',
    value: 'アメリカ合衆国',
    breadcrumb: ['身分事項', '国籍'],
    confidence: 0.88,
    mapped: false,
    mappedTo: null,
  },
  {
    id: 'e3',
    value: '1990-03-15',
    breadcrumb: ['身分事項', '生年月日'],
    confidence: 0.92,
    mapped: false,
    mappedTo: null,
  },
  {
    id: 'e4',
    value: '1',
    breadcrumb: ['身分事項', '性別'],
    confidence: 0.97,
    mapped: false,
    mappedTo: null,
  },
  {
    id: 'e5',
    value: '106-0032',
    breadcrumb: ['身分事項', '郵便番号'],
    confidence: 0.90,
    mapped: false,
    mappedTo: null,
  },
  {
    id: 'e6',
    value: '東京都',
    breadcrumb: ['身分事項', '都道府県'],
    confidence: 0.85,
    mapped: false,
    mappedTo: null,
  },
  {
    id: 'e7',
    value: '港区六本木1-2-3',
    breadcrumb: null,
    confidence: null,
    mapped: false,
    mappedTo: null,
  },
  {
    id: 'e8',
    value: '株式会社サンプル',
    breadcrumb: ['所属機関等', '勤務先名称'],
    confidence: 0.78,
    mapped: false,
    mappedTo: null,
  },
  {
    id: 'e9',
    value: 'AB123456C',
    breadcrumb: ['身分事項', '旅券番号'],
    confidence: 0.72,
    mapped: false,
    mappedTo: null,
  },
  {
    id: 'e10',
    value: '¥250,000',
    breadcrumb: ['所属機関等', '月額報酬'],
    confidence: 0.65,
    mapped: false,
    mappedTo: null,
  },
];
