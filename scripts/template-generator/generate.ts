#!/usr/bin/env npx tsx
/**
 * generate.ts
 * テンプレート登録システム — CLI エントリーポイント
 *
 * 使用方法:
 *   npx tsx scripts/template-generator/generate.ts \
 *     --input "./原本ファイル.xlsx" \
 *     --name "specifiedSkilledWorker" \
 *     --label "特定技能ビザ申請" \
 *     --output "./generated/"
 *
 *   # パーサー結果のみ確認（AI解析なし）
 *   npx tsx scripts/template-generator/generate.ts \
 *     --input "./原本ファイル.xlsx" \
 *     --name "test" \
 *     --label "テスト" \
 *
 *   # Word ファイル（付属書類）の場合:
 *   npx tsx scripts/template-generator/generate.ts \
 *     --input "./計画書.docx" \
 *     --name "businessPlan" \
 *     --label "事業計画書" \
 *     --type word
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { parseExcel } from './parsers/parseExcel';
import { parseWord } from './parsers/parseWord';
import { analyzeWithGemini } from './ai/analyzeWithGemini';
import { generateZodSchema } from './generators/generateZodSchema';
import { generateCsvHeaders } from './generators/generateCsvHeaders';
import { generateCsvMapper } from './generators/generateCsvMapper';
import { generateFormOptions } from './generators/generateFormOptions';
import { generateExcelFiller } from './generators/generateExcelFiller';
import { generateWordFiller } from './generators/generateWordFiller';
import type { GenerateOptions, ParsedFormStructure } from './types';
import { getAdminDb, getAdminStorage } from '../../src/lib/firebase/admin';
import { generateCamelCaseId } from './ai/generateCamelCaseId';

// ─── .env.local から GEMINI_API_KEY を読み込む ────────────────────────────────
function loadEnv(): void {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

// ─── ファイル書き出しヘルパー ─────────────────────────────────────────────────
function writeOutput(outputDir: string, fileName: string, content: string): void {
  const filePath = path.join(outputDir, fileName);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`  📝 ${filePath}`);
}

// ─── メイン処理 ───────────────────────────────────────────────────────────────
async function main(opts: GenerateOptions): Promise<void> {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  🏛️  テンプレート登録システム — スキーマ自動生成ツール      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY が設定されていません。');
    console.error('   .env.local に GEMINI_API_KEY=xxx を設定してください。');
    process.exit(1);
  }

  let actualInput = opts.input;
  let actualName = opts.name;
  let actualLabel = opts.label;
  let actualType = opts.type;

  // ─── Step 0: Firebase連携 (--id 指定時) ──────────────────────────
  if (opts.id) {
    console.log(`🔍 FirestoreからID [${opts.id}] のメタデータを取得中...`);
    const db = getAdminDb();
    const docSnap = await db.collection('document_templates').doc(opts.id).get();
    if (!docSnap.exists) {
      console.error(`❌ Firestoreにテンプレート(ID: ${opts.id})が見つかりません。`);
      process.exit(1);
    }
    const data = docSnap.data()!;
    actualLabel = data.formName;
    actualType = data.fileType === 'excel' ? 'csv' : 'word'; // デフォルト
    
    console.log(`   📝 テンプレート名: ${actualLabel}`);
    
    // GeminiでキャメルケースIDを自動生成
    console.log(`🤖 日本語名から英語のキー名を生成中...`);
    actualName = await generateCamelCaseId(actualLabel, apiKey);
    console.log(`   ✨ 生成されたキー名: ${actualName}`);
    
    // Storageからダウンロード
    console.log(`☁️ Firebase Storageからファイルをダウンロード中...`);
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    const fileObj = bucket.file(data.storagePath);
    
    const tmpDir = path.join(process.cwd(), '.tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    
    const ext = path.extname(data.storagePath) || (data.fileType === 'excel' ? '.xlsx' : '.docx');
    actualInput = path.join(tmpDir, `${opts.id}${ext}`);
    
    await fileObj.download({ destination: actualInput });
    console.log(`   ⬇️ ダウンロード完了: ${actualInput}`);
  }

  if (!actualInput || !actualName || !actualLabel) {
    console.error('❌ --id を指定するか、--input, --name, --label をすべて指定してください。');
    process.exit(1);
  }

  // 以降の処理のためにoptsを上書き
  opts.input = actualInput;
  opts.name = actualName;
  opts.label = actualLabel;
  opts.type = actualType as any;

  // .docx 入力時は自動的に word モードに設定
  const inputExt = path.extname(opts.input).toLowerCase();
  if (inputExt === '.docx' && opts.type !== 'word') {
    console.log('  ℹ️  .docx 入力を検出 — 自動的に Word モードに切り替えます');
    opts.type = 'word';
  }

  const modeLabels: Record<string, string> = {
    csv: '📊 CSV出力モード（オンライン申請）',
    pdf: '📄 PDF出力モード（Excel差し込み）',
    word: '📝 Word出力モード（docxtemplater差し込み）',
  };
  const modeLabel = modeLabels[opts.type] || opts.type;
  console.log(`   ${modeLabel}\n`);

  // ─── Step 1: ファイル解析 ──────────────────────────────────────
  const inputPath = path.resolve(opts.input);
  const ext = path.extname(inputPath).toLowerCase();

  let parsed: ParsedFormStructure;
  if (ext === '.xlsx' || ext === '.xlsm') {
    parsed = parseExcel(inputPath);
  } else if (ext === '.docx') {
    parsed = await parseWord(inputPath);
  } else {
    console.error(`❌ サポートされていないファイル形式: ${ext}`);
    console.error('   対応形式: .xlsx, .xlsm, .docx');
    process.exit(1);
  }

  // パーサー結果のサマリー表示
  console.log('\n📊 パーサー結果サマリー:');
  console.log(`   書類名: ${parsed.title}`);
  console.log(`   シート数: ${parsed.sheets.length} (${parsed.sheets.join(', ')})`);
  console.log(`   検出フィールド数: ${parsed.fields.length}`);
  console.log(`   rawText長: ${parsed.rawText.length.toLocaleString()} 文字`);

  // セクション別のフィールド数
  const sectionCounts = new Map<string, number>();
  for (const field of parsed.fields) {
    sectionCounts.set(field.section, (sectionCounts.get(field.section) || 0) + 1);
  }
  console.log('\n   セクション別フィールド数:');
  for (const [section, count] of sectionCounts) {
    console.log(`     ├─ ${section}: ${count} 件`);
  }

  // フィールド一覧（先頭20件）
  console.log(`\n   フィールド一覧（先頭20件）:`);
  for (const field of parsed.fields.slice(0, 20)) {
    const typeTag = field.inputType === 'select' 
      ? `[${field.inputType}: ${field.dropdownOptions?.length || 0}件]`
      : `[${field.inputType}]`;
    console.log(`     ├─ "${field.label}" ${typeTag}${field.required ? ' *必須' : ''}`);
  }
  if (parsed.fields.length > 20) {
    console.log(`     └─ ... 他 ${parsed.fields.length - 20} 件`);
  }

  // ─── parse-only モード ─────────────────────────────────────────
  if (opts.parseOnly) {
    console.log('\n✅ --parse-only モード: パーサー結果の表示のみで終了します。');

    // JSON 出力
    const jsonPath = path.join(opts.output, `${opts.name}_parsed.json`);
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(parsed, null, 2), 'utf-8');
    console.log(`   JSON 出力: ${jsonPath}`);
    return;
  }

  // ─── Step 2: AI 構造解析 ──────────────────────────────────────
  // apiKeyは既に取得済み

  // 記載例 PDF のテキスト（今後の拡張用）
  let exampleText: string | undefined;
  if (opts.example) {
    console.log(`\n📄 記載例 PDF: ${opts.example}`);
    console.log('   ⚠️ PDF パーサーは Phase 6 で実装予定です。スキップします。');
  }

  const definition = await analyzeWithGemini(
    parsed,
    opts.name,
    opts.label,
    apiKey,
    exampleText,
  );

  if (opts.id) {
    definition.templateId = opts.id;
  }

  // AI 結果の JSON を保存（デバッグ・レビュー用）
  const definitionJsonPath = path.join(opts.output, opts.name, `${opts.name}_definition.json`);
  fs.mkdirSync(path.dirname(definitionJsonPath), { recursive: true });
  fs.writeFileSync(definitionJsonPath, JSON.stringify(definition, null, 2), 'utf-8');
  console.log(`\n💾 AI 解析結果 JSON: ${definitionJsonPath}`);

  // AI 結果のサマリー表示
  console.log('\n🤖 AI 解析結果サマリー:');
  for (const section of definition.sections) {
    console.log(`   ├─ ${section.sectionLabel} (${section.sectionKey}): ${section.fields.length} フィールド`);
    for (const field of section.fields.slice(0, 5)) {
      console.log(`   │  ├─ ${field.fieldKey}: ${field.zodType} — "${field.label}"`);
    }
    if (section.fields.length > 5) {
      console.log(`   │  └─ ... 他 ${section.fields.length - 5} 件`);
    }
  }

  // ─── Step 3: コード生成（モード分岐） ─────────────────────────
  const PascalName = opts.name.charAt(0).toUpperCase() + opts.name.slice(1);
  console.log(`\n⚙️  コード生成を開始... [モード: ${opts.type.toUpperCase()}]`);
  const outputDir = path.join(opts.output, opts.name);

  // ── 共通: Zod スキーマ（両モードで必要） ──
  const schemaCode = generateZodSchema(definition);
  writeOutput(outputDir, `${opts.name}Schema.ts`, schemaCode);

  // ── 共通: フォーム定数（enum フィールドがある場合のみ） ──
  const optionsCode = generateFormOptions(definition);
  if (optionsCode) {
    writeOutput(outputDir, `${opts.name}FormOptions.ts`, optionsCode);
  } else {
    console.log('  ⏭️  enum フィールドなし — FormOptions の生成をスキップ');
  }

  if (opts.type === 'csv') {
    // ═══ CSV モード: ヘッダー + マッパー ═══
    console.log('\n  📊 CSV モード固有ファイル:');

    const headerFiles = generateCsvHeaders(definition);
    for (const [fileName, code] of Object.entries(headerFiles)) {
      writeOutput(outputDir, fileName, code);
    }

    const mapperCode = generateCsvMapper(definition);
    writeOutput(outputDir, `generate${PascalName}Csv.ts`, mapperCode);

  } else if (opts.type === 'pdf') {
    // ═══ PDF モード: Excel 差し込み関数 ═══
    console.log('\n  📄 PDF モード固有ファイル:');

    const fillerCode = generateExcelFiller(definition, parsed);
    writeOutput(outputDir, `fill${PascalName}Excel.ts`, fillerCode);

  } else {
    // ═══ Word モード: docxtemplater 差し込み関数 ═══
    console.log('\n  📝 Word モード固有ファイル:');

    const wordFillerCode = generateWordFiller(definition);
    writeOutput(outputDir, `fill${PascalName}Word.ts`, wordFillerCode);
  }

  // ─── 生成ファイル一覧 ──────────────────────────────────────────
  const generatedFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.ts') || f.endsWith('.json'));
  console.log(`\n📦 生成ファイル一覧 (${generatedFiles.length} ファイル):`);
  for (const f of generatedFiles) {
    const fullPath = path.join(outputDir, f);
    const size = fs.statSync(fullPath).size;
    console.log(`   ├─ ${f} (${(size / 1024).toFixed(1)} KB)`);
  }

  // ─── 完了 ─────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  ✅ コード生成完了！                                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n   出力先: ${outputDir}`);
  const modeSummary: Record<string, string> = {
    csv: 'CSV出力（オンライン申請）',
    pdf: 'PDF出力（Excel差し込み）',
    word: 'Word出力（docxtemplater差し込み）',
  };
  console.log(`   モード: ${modeSummary[opts.type] || opts.type}`);
  console.log('');
  console.log('   📌 次のステップ:');
  console.log(`   1. ${definitionJsonPath} をレビュー`);
  console.log('   2. 生成されたスキーマの型・バリデーションを確認');
  if (opts.type === 'csv') {
    console.log('   3. CSV マッパーの TODO コメントを手動で完成させる');
  } else if (opts.type === 'pdf') {
    console.log('   3. Excel 差し込み関数のセル番地を原本と照合する');
  } else {
    console.log('   3. Word 原本にプレースホルダータグを埋め込む（ファイル末尾のタグ一覧を参照）');
  }
  console.log('   4. FormOptions の選択肢ラベルを原本に合わせて調整');
  console.log('   5. 問題なければ src/ へコピー');
  console.log('');
}

// ─── CLI 定義 ─────────────────────────────────────────────────────────────────
loadEnv();

const program = new Command();

program
  .name('template-generator')
  .description('📄 原本ファイル（Excel/Word）から Zod スキーマと CSV マッピングを自動生成')
  .version('1.0.0')
  .option('-i, --input <path>', '入力ファイルパス (.xlsx / .xlsm / .docx) ※id未指定時必須')
  .option('-n, --name <key>', '申請種別のキー名 (camelCase) ※id未指定時必須')
  .option('-l, --label <label>', '申請種別の日本語ラベル ※id未指定時必須')
  .option('--id <formId>', 'Firestoreのdocument_templatesのID (例: tpl_gn85kj7p)')
  .option('-t, --type <mode>', '出力モード: csv / pdf / word', 'csv')
  .option('-e, --example <path>', '記載例 PDF パス (任意)')
  .option('-o, --output <dir>', '出力先ディレクトリ', './generated')
  .option('--parse-only', 'パーサー結果のみ表示（AI解析をスキップ）')
  .action(async (opts: GenerateOptions) => {
    try {
      await main(opts);
    } catch (err) {
      console.error('\n❌ エラーが発生しました:');
      console.error(err instanceof Error ? err.message : String(err));
      if (err instanceof Error && err.stack) {
        console.error('\nスタックトレース:');
        console.error(err.stack);
      }
      process.exit(1);
    }
  });

program.parse(process.argv);
