/**
 * PDF Overlay 型定義
 *
 * PDF上に重畳表示する入力フィールドの型を定義する。
 * 座標系はPDFページの左上を原点 (0, 0) としたピクセル単位。
 */

/** フィールドの種別 */
export type OverlayFieldType = 'text' | 'check' | 'radio' | 'circle';

/** PDF上に配置する個々のフィールド定義 */
export interface OverlayField {
  /** 一意な識別子 */
  id: string;
  /** フィールド種別 */
  type: OverlayFieldType;
  /** PDF左上からのX座標 (px, スケール=1基準) */
  x: number;
  /** PDF左上からのY座標 (px, スケール=1基準) */
  y: number;
  /** フィールドの幅 (px, スケール=1基準) */
  width: number;
  /** フィールドの高さ (px, スケール=1基準) */
  height: number;
  /** 現在の値。text → string, check/radio/circle → boolean */
  value?: string | boolean;
  /** 表示ラベル（circle の場合に中央テキストとして使用等） */
  label?: string;
  /** radio グループ名（同一グループ内で排他選択） */
  radioGroup?: string;
  /** 所属ページ番号（1始まり, 省略時は1） */
  page?: number;
}
