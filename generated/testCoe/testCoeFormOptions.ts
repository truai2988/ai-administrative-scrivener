/**
 * テストCOE申請 — フォーム定数定義（プルダウン・ラジオボタン選択肢）
 *
 * ※ このファイルはテンプレート登録システムにより自動生成されました。
 * ※ 選択肢のラベルやコード体系は原本に合わせて手動調整してください。
 */

export interface FormOption {
  value: string;
  label: string;
}

export const testCoeFormOptions = {
  /** (4) 性別 */
  gender: [
    { value: '1', label: '男' },
    { value: '2', label: '女' },
  ] as FormOption[],

  /** (6) 配偶者の有無 */
  maritalStatus: [
    { value: '1', label: '有' },
    { value: '2', label: '無' },
  ] as FormOption[],

  /** 在日親族の有無 */
  hasRelativesInJapan: [
    { value: '1', label: '有' },
    { value: '2', label: '無' },
  ] as FormOption[],

  /** 犯罪を理由とする処分の有無 */
  hasCriminalRecord: [
    { value: '1', label: '有' },
    { value: '2', label: '無' },
  ] as FormOption[],

  /** (3) 法人番号の有無 */
  hasCorporateNumber: [
    { value: '1', label: '有' },
    { value: '2', label: '無' },
  ] as FormOption[],

} as const;

export type TestCoeFormOptions = typeof testCoeFormOptions;
