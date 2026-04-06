/**
 * simultaneousExtractor.ts
 *
 * Document AI の出力から「同時申請情報（simultaneousApplication）」を抽出するロジック。
 *
 * ■ 現在の状態: プレースホルダー
 *   同時申請（再入国許可・資格外活動・就労資格証明書）のフラグおよび詳細項目は
 *   申請者の意思確認が必要なため、OCR自動入力の優先度は低い。
 *   将来的な「申請書類のOCR読み取り」時にここを実装する。
 *
 * ■ 将来の拡張ポイント（TODO）
 *   TODO: applyForReEntry（再入国許可申請チェック）の抽出
 *   TODO: applyForActivityOutsideStatus（資格外活動許可申請チェック）の抽出
 *   TODO: applyForAuthEmployment（就労資格証明書交付申請チェック）の抽出
 *   以下は各申請の詳細項目（現在スキーマ未定義・将来追加予定）
 *   TODO: 渡航目的・勤務先・雇用期間（再入国許可申請詳細）の抽出
 *   TODO: 法定代理人・取次者情報の抽出
 *   TODO: 資格外活動詳細（勤務先・労働時間等）の抽出
 */

import type { RenewalApplicationFormData } from '@/lib/schemas/renewalApplicationSchema';
import type { protos } from '@google-cloud/documentai';
import type { OcrExtractedField } from '../aiExtractedToFormData';

type IDocument = protos.google.cloud.documentai.v1.IDocument;
type SimultaneousFormData = NonNullable<RenewalApplicationFormData['simultaneousApplication']>;

/**
 * Document AI の IDocument から simultaneousApplication を抽出する。
 * ※ 現在は空実装。将来の実装時にここにロジックを追加する。
 *
 * @param document - Document AI の出力
 * @param formData - 抽出結果を書き込むオブジェクト（参照渡し、optional型）
 * @param fields   - 抽出フィールド詳細リスト（UIハイライト用）
 */
export function extractSimultaneousFromDocument(
  _document: IDocument,
  _formData: Partial<SimultaneousFormData>,
  _fields: OcrExtractedField[]
): void {
  // TODO: 実装予定
  void _document; void _formData; void _fields;
  // 同時申請情報のOCR抽出ロジックをここに実装する
}
