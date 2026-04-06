/**
 * employerExtractor.ts
 *
 * Document AI の出力から「所属機関情報（employerInfo）」を抽出するロジック。
 *
 * ■ 現在の状態: プレースホルダー
 *   所属機関情報はほぼすべて「法人の固定データ」であり、
 *   OCR対象ドキュメント（在留カード等）には含まれない。
 *   将来的には「特定技能雇用契約書」「所属機関資料」のOCR対応時にここを実装する。
 *
 * ■ 将来の拡張ポイント（TODO）
 *   TODO: companyNameJa（氏名又は名称）の抽出
 *   TODO: corporateNumber（法人番号）の抽出
 *   TODO: employmentInsuranceNumber（雇用保険適用事業所番号）の抽出
 *   TODO: companyZipCode / companyPref / companyCity / companyAddressLines の抽出
 *   TODO: representativeName（代表者の氏名）の抽出
 *   TODO: companyPhone の抽出
 *   TODO: capital / annualRevenue / employeeCount の抽出
 *   TODO: workplaceName / workplaceZipCode / workplacePref 等の抽出
 *   TODO: contractStartDate / contractEndDate（雇用契約期間）の抽出
 *   TODO: industryFields / jobCategories / mainJobType の抽出
 *   TODO: weeklyWorkHours / monthlySalary 等の労働条件の抽出
 *   TODO: supportAgencyName / supportAgencyRegistrationNumber の抽出
 *   TODO: supportPersonnel（支援責任者・担当者）の抽出
 *   TODO: complianceOaths（欠格事由）の抽出（(11)〜(22) 12項目）
 *   TODO: jobHistory[]（職歴 最大10社）の抽出
 */

import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';
import type { protos } from '@google-cloud/documentai';
import type { OcrExtractedField } from '../aiExtractedToFormData';

type IDocument = protos.google.cloud.documentai.v1.IDocument;
type EmployerFormData = Partial<RenewalApplicationFormData['employerInfo']>;

/**
 * Document AI の IDocument から employerInfo を抽出する。
 * ※ 現在は空実装。将来の実装時にここにロジックを追加する。
 *
 * @param document - Document AI の出力
 * @param formData - 抽出結果を書き込むオブジェクト（参照渡し）
 * @param fields   - 抽出フィールド詳細リスト（UIハイライト用）
 */
export function extractEmployerFromDocument(
  _document: IDocument,
  _formData: EmployerFormData,
  _fields: OcrExtractedField[]
): void {
  // TODO: 実装予定
  void _document; void _formData; void _fields;
  // 所属機関情報のOCR抽出ロジックをここに実装する
}
