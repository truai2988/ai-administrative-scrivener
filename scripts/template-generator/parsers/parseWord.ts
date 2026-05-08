/**
 * parseWord.ts
 * テンプレート登録システム — Word（.docx）パーサー
 *
 * mammoth を使用して .docx ファイルからテキストと表構造を抽出し、
 * ParsedFormStructure を生成する。
 *
 * Word文書にはセル番地がないため、AI が「どのプレースホルダータグを
 * Word側に仕込むべきか」を判断するための十分なテキスト情報を提供する。
 *
 * 抽出する情報:
 *   - 見出し・段落テキスト（セクション構造の手がかり）
 *   - 表の内容（ラベル-入力欄のペア検出）
 *   - リスト項目（チェックボックスや選択肢の検出）
 */

import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import * as cheerio from 'cheerio';

import type {
  ParsedFormStructure,
  ParsedField,
  FieldInputType,
  WordTextElement,
} from '../types';

// ─── HTML パーサーユーティリティ ───────────────────────────────────────────────

/**
 * mammoth の HTML 出力から構造化テキスト要素を抽出する
 * （cheerio を使用して DOM 順に処理し、セクションとフィールドの順序を正しく保持する）
 */
function extractTextElements(html: string): WordTextElement[] {
  const elements: WordTextElement[] = [];
  const $ = cheerio.load(html);

  let tableIndex = 0;

  // mammoth の出力は基本的にフラットな p, h1-6, table の並びになる
  $('body').children().each((_, el) => {
    const tagName = el.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tagName)) {
      const text = $(el).text().trim();
      if (text) {
        elements.push({ text, type: 'heading', level: parseInt(tagName.charAt(1)) });
      }
    } else if (tagName === 'p') {
      const text = $(el).text().trim();
      if (text && text.length >= 2) {
        elements.push({ text, type: 'paragraph' });
      }
    } else if (tagName === 'table') {
      $(el).find('tr').each((rowIdx, tr) => {
        $(tr).find('td, th').each((colIdx, td) => {
          const text = $(td).text().trim();
          if (text) {
            elements.push({
              text,
              type: 'tableCell',
              tableIndex,
              tableRow: rowIdx,
              tableCol: colIdx,
            });
          }
        });
      });
      tableIndex++;
    } else if (tagName === 'ul' || tagName === 'ol') {
      $(el).find('li').each((_, li) => {
        const text = $(li).text().trim();
        if (text) {
          elements.push({ text, type: 'listItem' });
        }
      });
    }
  });

  return elements;
}

// ─── フィールド検出ヒューリスティック ──────────────────────────────────────────

/** ラベルっぽいテキストか判定 */
function isLabelLike(text: string): boolean {
  // 短すぎる or 長すぎる → ラベルではない
  if (text.length < 2 || text.length > 60) return false;
  // 括弧付き番号を含む（例: "(1) 氏名"）
  if (/[（(]\d+[)）]/.test(text)) return true;
  // 末尾がコロン/：
  if (/[:：]$/.test(text)) return true;
  // 一般的なフォームラベルキーワード
  if (/氏名|住所|電話|番号|生年月日|国籍|旅券|職業|学歴|勤務|資格|期間|目的|理由/.test(text)) return true;
  return false;
}

/** テキストから入力タイプを推定 */
function inferInputType(text: string): FieldInputType {
  if (/年月日|YYYY|日付|期限|期間/.test(text)) return 'date';
  if (/電話|FAX|ファクス|fax|tel/.test(text)) return 'number';
  if (/郵便番号|〒/.test(text)) return 'number';
  if (/有無|男女|性別/.test(text)) return 'radio';
  if (/□|☐|チェック/.test(text)) return 'checkbox';
  return 'text';
}

/** テキストからセクション見出しを検出 */
function isSectionHeading(text: string, type: WordTextElement['type'], level?: number): boolean {
  // 見出しタグ
  if (type === 'heading' && level && level <= 3) return true;
  // ■▶●で始まるセクション区切り
  if (/^[■□▪▸▶●◆【]/.test(text)) return true;
  // "第X章" や "X." で始まるセクション
  if (/^第\d+/.test(text) || /^\d+\.\s/.test(text)) return true;
  return false;
}

// ─── メイン関数 ───────────────────────────────────────────────────────────────

/**
 * Word（.docx）ファイルを解析し、ParsedFormStructure を返す。
 *
 * @param filePath - .docx ファイルのフルパス
 * @returns ParsedFormStructure
 */
export async function parseWord(filePath: string): Promise<ParsedFormStructure> {
  const absPath = path.resolve(filePath);
  const fileName = path.basename(absPath, path.extname(absPath));

  console.log(`📖 Word ファイルを読み込み中: ${path.basename(absPath)}`);

  // mammoth で HTML 変換
  const buffer = fs.readFileSync(absPath);
  const result = await mammoth.convertToHtml({ buffer });

  if (result.messages.length > 0) {
    console.log(`  ⚠️ mammoth 警告: ${result.messages.length} 件`);
    for (const msg of result.messages.slice(0, 3)) {
      console.log(`     ${msg.type}: ${msg.message}`);
    }
  }

  // プレーンテキスト版も取得（rawText 用）
  const textResult = await mammoth.extractRawText({ buffer });

  // HTML から構造化テキスト要素を抽出
  const elements = extractTextElements(result.value);

  console.log(`  📝 テキスト要素: ${elements.length} 個`);
  console.log(`     見出し: ${elements.filter(e => e.type === 'heading').length} 個`);
  console.log(`     段落: ${elements.filter(e => e.type === 'paragraph').length} 個`);
  console.log(`     表セル: ${elements.filter(e => e.type === 'tableCell').length} 個`);
  console.log(`     リスト: ${elements.filter(e => e.type === 'listItem').length} 個`);

  // フィールドの検出
  const fields: ParsedField[] = [];
  let currentSection = '一般';

  for (const elem of elements) {
    // セクション見出しの検出
    if (isSectionHeading(elem.text, elem.type, elem.level)) {
      currentSection = elem.text.replace(/^[■□▪▸▶●◆【]\s*/, '').replace(/】$/, '').trim();
      continue;
    }

    // フィールドラベルの検出
    if (isLabelLike(elem.text)) {
      // ノイズフィルタリング
      const isHint = /^[（(].+[)）]$/.test(elem.text);
      const isTitle = /申請書|許可申請|交付申請|届出書/.test(elem.text) && elem.text.length > 10;
      if (isHint || isTitle) continue;

      // 重複チェック
      const isDuplicate = fields.some(f => f.label === elem.text);
      if (isDuplicate) continue;

      fields.push({
        label: elem.text.replace(/[:：]\s*$/, ''),
        section: currentSection,
        sheetName: 'document', // Word にはシートがない
        inputType: inferInputType(elem.text),
        required: /[*※必須]/.test(elem.text),
      });
    }

    // 表のヘッダー行からフィールドを検出（左列がラベル、右列が入力欄のパターン）
    if (elem.type === 'tableCell' && elem.tableCol === 0 && isLabelLike(elem.text)) {
      const isDuplicate = fields.some(f => f.label === elem.text);
      if (!isDuplicate) {
        fields.push({
          label: elem.text.replace(/[:：]\s*$/, ''),
          section: currentSection,
          sheetName: 'document',
          inputType: inferInputType(elem.text),
          required: /[*※必須]/.test(elem.text),
        });
      }
    }
  }

  console.log(`  ✅ ${fields.length} 個のフィールドを検出しました`);

  return {
    title: fileName,
    fields,
    sheets: ['document'],
    rawText: textResult.value,
    sourceFile: absPath,
    sourceType: 'word',
  };
}
