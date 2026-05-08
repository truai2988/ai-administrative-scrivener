/**
 * parseExcel.ts
 * テンプレート登録システム — Excel パーサー
 *
 * 書類提出用の .xlsx / .xlsm ファイルを SheetJS で解析し、
 * フォーム構造（フィールド一覧・セクション・バリデーション）を抽出する。
 *
 * 政府提出用の Excel ファイルは以下のような特徴を持つ:
 *   - 表形式のレイアウト（セル結合多用）
 *   - データバリデーション（ドロップダウンリスト）
 *   - 色付き/罫線付きのラベルセルと空白の入力セル
 *   - 複数シート（本体・別紙・参考など）
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import type { ParsedField, ParsedFormStructure, FieldInputType } from '../types';

// ─── ヘルパー ─────────────────────────────────────────────────────────────────

/** セルが空（未入力・入力用セル）かを判定 */
function isCellEmpty(cell: XLSX.CellObject | undefined): boolean {
  if (!cell) return true;
  if (cell.v === undefined || cell.v === null || cell.v === '') return true;
  return false;
}

/** セルのテキスト値を安全に取得 */
function getCellText(cell: XLSX.CellObject | undefined): string {
  if (!cell || cell.v === undefined || cell.v === null) return '';
  return String(cell.v).trim();
}

/** ラベルテキストから必須フラグを推定 */
function inferRequired(label: string): boolean {
  return /[＊*※●]|必須|required/i.test(label);
}

/** ラベルテキストからセクション名を推定 */
function inferSection(label: string, currentSection: string): string {
  // 大分類のキーワード
  const sectionPatterns: Array<[RegExp, string]> = [
    [/身分事項|本人情報|申請人/, '身分事項'],
    [/旅券|パスポート/, '旅券情報'],
    [/在留|ビザ/, '在留情報'],
    [/勤務先|所属機関|雇用|会社/, '所属機関'],
    [/代理人/, '代理人'],
    [/取次者/, '取次者'],
    [/家族|親族|同居/, '家族情報'],
    [/職歴|経歴/, '職歴'],
    [/学歴|学校/, '学歴'],
    [/資格|技能|試験/, '資格情報'],
    [/契約|雇用契約/, '雇用契約'],
    [/支援/, '支援計画'],
    [/登録支援機関/, '登録支援機関'],
    [/派遣/, '派遣情報'],
  ];

  for (const [pattern, section] of sectionPatterns) {
    if (pattern.test(label)) return section;
  }
  return currentSection || '一般';
}

/** ラベルや値から入力タイプを推定 */
function inferInputType(
  label: string,
  validations: XLSX.DataValidation[] | undefined,
  cellRef: string
): { type: FieldInputType; options?: string[] } {
  // データバリデーションがあればドロップダウン
  if (validations) {
    for (const dv of validations) {
      if (dv.sqref && dv.sqref.includes(cellRef)) {
        if (dv.type === 'list' && dv.formula1) {
          // "選択肢1,選択肢2,..." 形式
          const options = dv.formula1
            .replace(/^"/, '').replace(/"$/, '')
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
          if (options.length > 0) {
            return { type: 'select', options };
          }
        }
      }
    }
  }

  // ラベルからの推定
  if (/年月日|生年月|日付|期限|期日|年月/.test(label)) return { type: 'date' };
  if (/有無|の有無/.test(label)) return { type: 'radio' };
  if (/性別/.test(label)) return { type: 'radio' };
  if (/番号|数|金額|資本金|売上|報酬|人数|年数|月数/.test(label)) return { type: 'number' };
  if (/内容|理由|詳細|備考|フリー/.test(label)) return { type: 'textarea' };

  return { type: 'text' };
}

/** 繰り返しパターンを検出（「親族1」「親族2」...） */
function detectRepeatablePattern(fields: ParsedField[]): ParsedField[] {
  const repeatGroups = new Map<string, ParsedField[]>();

  for (const field of fields) {
    // 数字付きのラベルパターンを検出（例: "親族1_氏名", "職歴2_入社年月"）
    const match = field.label.match(/^(.+?)(\d+)[_・](.+)$/);
    if (match) {
      const groupKey = `${match[1]}_${match[3]}`;
      if (!repeatGroups.has(groupKey)) {
        repeatGroups.set(groupKey, []);
      }
      repeatGroups.get(groupKey)!.push(field);
    }
  }

  // 3件以上の繰り返しが見つかったグループにメタデータを付与
  for (const [groupKey, groupFields] of repeatGroups) {
    if (groupFields.length >= 2) {
      for (const field of groupFields) {
        field.repeatable = {
          maxCount: groupFields.length,
          groupKey,
        };
      }
    }
  }

  return fields;
}

// ─── メインパーサー ───────────────────────────────────────────────────────────

/**
 * Excel ファイル (.xlsx / .xlsm) を解析し、ParsedFormStructure を返す。
 *
 * @param filePath - Excel ファイルの絶対パス
 * @returns ParsedFormStructure
 */
export function parseExcel(filePath: string): ParsedFormStructure {
  if (!fs.existsSync(filePath)) {
    throw new Error(`ファイルが見つかりません: ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();
  if (ext !== '.xlsx' && ext !== '.xlsm') {
    throw new Error(`サポートされていないファイル形式です: ${ext} (.xlsx / .xlsm のみ対応)`);
  }

  console.log(`📖 Excel ファイルを読み込み中: ${path.basename(filePath)}`);

  const workbook = XLSX.read(fs.readFileSync(filePath), {
    type: 'buffer',
    cellStyles: true,     // セルスタイル情報を取得
    cellDates: true,       // 日付を Date オブジェクトとして取得
  });

  const fields: ParsedField[] = [];
  const rawTextParts: string[] = [];
  let currentSection = '一般';

  for (const sheetName of workbook.SheetNames) {
    console.log(`  📄 シート: "${sheetName}"`);
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // シートの範囲を取得
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    // データバリデーション情報
    const validations = (sheet as Record<string, unknown>)['!dataValidation'] as XLSX.DataValidation[] | undefined;

    // 全セルを走査
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellRef] as XLSX.CellObject | undefined;
        const text = getCellText(cell);

        if (!text) continue;

        // rawText に追加（AI 用）
        rawTextParts.push(`[${sheetName}!${cellRef}] ${text}`);

        // ────────────────────────────────────────────────────────
        // フィールド検出ロジック:
        // ① ラベルセル（テキスト有り）の右隣または下のセルが空 → 入力フィールド
        // ② データバリデーション付きのセル → ドロップダウン
        // ③ 括弧付き番号（(1), (2)...）を含むラベル → 構造化フィールド
        // ────────────────────────────────────────────────────────

        // セクション推定の更新
        currentSection = inferSection(text, currentSection);

        // 右隣のセルをチェック
        const rightRef = XLSX.utils.encode_cell({ r: row, c: col + 1 });
        const rightCell = sheet[rightRef] as XLSX.CellObject | undefined;

        // 下のセルをチェック
        const belowRef = XLSX.utils.encode_cell({ r: row + 1, c: col });
        const belowCell = sheet[belowRef] as XLSX.CellObject | undefined;

        // ラベルの右隣が空欄 → 入力フィールドのラベルと判定
        const isLabelWithInput = isCellEmpty(rightCell) && text.length >= 2;

        // データバリデーション付きのセル自体
        let hasValidation = false;
        if (validations) {
          for (const dv of validations) {
            if (dv.sqref && (dv.sqref.includes(rightRef) || dv.sqref.includes(cellRef))) {
              hasValidation = true;
              break;
            }
          }
        }

        // 括弧付き番号を含むラベル → 高確率でフォームフィールド
        const hasBracketNumber = /[（(]\d+[)）]/.test(text);

        // ── ノイズフィルタリング ──────────────────────────────
        // セクション見出し（■で始まる）はセクション更新のみに使い、フィールドとしては登録しない
        const isSectionHeader = /^[■□▪▸▶●◆]/.test(text);
        // ヒントテキスト（括弧だけの注記: "(YYYYMMDD)", "(1:有 2:無)", "(円)", "(名)"等）
        const isHintOnly = /^[（(].+[)）]$/.test(text) && !hasBracketNumber;
        // 書類タイトル行（「申請書」「許可申請」等を含む長いタイトル）
        const isTitle = /申請書|許可申請|交付申請|届出書/.test(text) && text.length > 10;

        if (isSectionHeader || isHintOnly || isTitle) {
          // rawText にはすでに追加済み（AI解析の参考になる）。フィールドとしては無視。
          continue;
        }

        if (isLabelWithInput || hasValidation || hasBracketNumber) {
          const inputRef = isLabelWithInput ? rightRef : cellRef;
          const { type, options } = inferInputType(text, validations, inputRef);

          // フィールドとして登録（重複チェック）
          const isDuplicate = fields.some(
            f => f.label === text && f.sheetName === sheetName
          );

          if (!isDuplicate && text.length >= 2) {
            fields.push({
              label: text,
              section: currentSection,
              cellRef: inputRef,
              sheetName,
              inputType: type,
              dropdownOptions: options,
              required: inferRequired(text),
              exampleValue: isCellEmpty(rightCell) ? getCellText(belowCell) : getCellText(rightCell),
            });
          }
        }
      }
    }
  }

  // 繰り返しパターンを検出
  const enrichedFields = detectRepeatablePattern(fields);

  console.log(`  ✅ ${enrichedFields.length} 個のフィールドを検出しました`);

  return {
    title: path.basename(filePath, ext),
    fields: enrichedFields,
    sheets: workbook.SheetNames,
    rawText: rawTextParts.join('\n'),
    sourceFile: filePath,
    sourceType: 'excel',
  };
}
