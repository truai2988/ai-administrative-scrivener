/**
 * 技能実習生に関する評価調書 — フォーム定数定義（プルダウン・ラジオボタン選択肢）
 *
 * ※ このファイルはテンプレート登録システムにより自動生成されました。
 * ※ 選択肢のラベルやコード体系は原本に合わせて手動調整してください。
 */

export interface FormOption {
  value: string;
  label: string;
}

export const technicalInternEvaluationFormOptions = {
  /** 性別 */
  gender: [
    { value: '1', label: '男' },
    { value: '2', label: '女' },
  ] as FormOption[],

  /** 性別 */
  traineeGender: [
    { value: '1', label: '男' },
    { value: '2', label: '女' },
  ] as FormOption[],

  /** 合否 */
  passFailResult: [
    { value: '1', label: '合格' },
    { value: '2', label: '不合格' },
  ] as FormOption[],

  /** 合否結果 */
  testResult: [
    { value: '1', label: '合格' },
    { value: '2', label: '不合格' },
  ] as FormOption[],

  /** 性別 */
  internGender: [
    { value: '1', label: '男' },
    { value: '2', label: '女' },
  ] as FormOption[],

  /** 合否 */
  passFailResultCode: [
    { value: '1', label: '合格' },
    { value: '2', label: '不合格' },
  ] as FormOption[],

} as const;

export type TechnicalInternEvaluationFormOptions = typeof technicalInternEvaluationFormOptions;
