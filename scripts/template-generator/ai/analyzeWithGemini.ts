/**
 * analyzeWithGemini.ts
 * テンプレート登録システム — Gemini AI 構造解析
 *
 * パーサーが抽出した生データ（ParsedFormStructure）を
 * Gemini 2.5 Flash に送信し、構造化されたフォーム定義（AnalyzedFormDefinition）を取得する。
 *
 * AI は以下の判断を行う:
 *   1. 各フィールドの英語キー名（camelCase）を決定
 *   2. Zod の型とバリデーションルールを推定
 *   3. セクション構造（ネストされた z.object）を設計
 *   4. 繰り返し項目の z.array 定義
 *   5. CSV ヘッダー名の推定
 */

import type { ParsedFormStructure, AnalyzedFormDefinition } from '../types';

// ─── Gemini API 呼び出し ─────────────────────────────────────────────────────

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

/**
 * Gemini API を呼び出してテキストレスポンスを取得する
 */
async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const body = {
    contents: [{
      parts: [{ text: prompt }],
    }],
    generationConfig: {
      temperature: 0.1,      // 構造解析なので低温で安定させる
      maxOutputTokens: 65536,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API エラー (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini API から空のレスポンスが返されました');
  }

  return text;
}

// ─── プロンプト生成 ───────────────────────────────────────────────────────────

function buildChunkPrompt(
  chunkFields: ParsedFormStructure['fields'],
  parsed: ParsedFormStructure,
  formKey: string,
  formLabel: string,
  chunkIndex: number,
  totalChunks: number,
  exampleText?: string,
): string {
  // フィールド情報をコンパクトに整形
  const fieldsSummary = chunkFields.map((f, i) => {
    const parts = [
      `[${i}] "${f.label}"`,
      `section="${f.section}"`,
      `type=${f.inputType}`,
    ];
    if (f.dropdownOptions?.length) {
      parts.push(`options=[${f.dropdownOptions.slice(0, 5).join(',')}${f.dropdownOptions.length > 5 ? ',...' : ''}]`);
    }
    if (f.maxLength) parts.push(`maxLen=${f.maxLength}`);
    if (f.required) parts.push('REQUIRED');
    if (f.repeatable) parts.push(`repeat(max=${f.repeatable.maxCount}, group="${f.repeatable.groupKey}")`);
    if (f.exampleValue) parts.push(`ex="${f.exampleValue}"`);
    return parts.join(' | ');
  }).join('\n');

  return `あなたは日本の入国管理局の申請書類のフォーム設計専門家です。
以下のフォーム構造データから、TypeScript のコード生成に必要なフォーム定義を JSON で出力してください。

【重要制約】
これは全体フォームの「一部（パート ${chunkIndex} / ${totalChunks}）」です。
渡された ${chunkFields.length} 個の項目について、スキーマ定義・計算ロジック・マッピングを「一切の省略なく100%」出力してください。
トークンを節約するための "// 以降同様" などの省略は【厳禁】です。すべてのフィールドを必ず JSON に含めてください。

# 対象フォーム
- 書類名: ${formLabel}
- フォームキー: ${formKey}
- シート数: ${parsed.sheets.length} (${parsed.sheets.join(', ')})
- 現在処理中のフィールド数: ${chunkFields.length}

# フィールド一覧（このパートで処理すべき全項目）
${fieldsSummary}

${exampleText ? `\n# 記載例テキスト（参考）\n${exampleText.substring(0, 3000)}\n` : ''}

# 出力ルール

以下の JSON 構造で出力してください。

{
  "formName": "${formLabel}",
  "formKey": "${formKey}",
  "sections": [
    {
      "sectionKey": "camelCaseのセクション名（例: identityInfo）",
      "sectionLabel": "日本語セクション名",
      "fields": [
        {
          "fieldKey": "camelCaseのフィールド名（例: nationality）",
          "label": "元の日本語ラベル",
          "zodType": "Zodの型（例: z.string(), z.enum(['1','2']), z.number()）",
          "validation": {
            "maxLength": null,
            "minLength": null,
            "regex": null,
            "regexDescription": null
          },
          "csvHeader": "入管CSV仕様のヘッダー名（_区切り）",
          "sectionKey": "所属セクションキー",
          "isRequired": true,
          "isRepeatable": false,
          "repeatMax": null,
          "enumValues": null,
          "description": ".describe()に付与する日本語説明",
          "csvSpec": "CSV仕様コメント（例: 半角英数字、12文字以内）",
          "isComputed": false,
          "dependencies": [],
          "computedLogic": null
        }
      ]
    }
  ],
  "csvFiles": [
    {
      "fileName": "CSVファイル名",
      "headerCount": 84,
      "headers": ["ヘッダー1", "ヘッダー2", "..."]
    }
  ],
  "initialFieldMappings": {
    "身分事項 > 氏名（英字）": "identityInfo.nameEn",
    "身分事項 > 国籍": "identityInfo.nationality",
    "旅券情報 > 旅券番号": "passportInfo.passportNumber"
  }
}

# 重要な解析ルール
1. fieldKey は英語の camelCase にすること。日本語名から適切に翻訳する。
   例: 国籍→nationality, 生年月日→birthDate, 氏名→nameEn, 郵便番号→zipCode
2. 入管の CSV では性別は "1"=男, "2"=女、有無は "1"=有, "2"=無 のコード体系を使う。
3. 日付フィールドは YYYYMMDD 形式（8桁数字）。年月のみの場合は YYYYMM（6桁）。
4. 住所は都道府県・市区町村・番地の3分割が標準。
5. 電話番号はハイフンなし半角数字、12文字以内。
6. 郵便番号はハイフンなし7桁。
7. 繰り返し項目（親族、職歴等）は z.array(z.object({...})).max(N) で定義する。
   フィールドは1つだけ定義し、繰り返しの個別番号は含めない。
8. csvFiles は書類が複数の CSV に分かれる場合（本体 + 区分V 等）を想定して配列にする。
9. セクション分割は入管の公式様式に準拠すること。
10. ドロップダウンの選択肢がある場合は enumValues に含める。
11. 自動計算フィールドの推論:
    - 項目名が「合計」「総計」「年齢」などの場合、または他のフィールドの組み合わせで算出可能な場合は "isComputed": true とする。
    - その場合、計算に必要な他のフィールドの fieldKey を "dependencies": ["fieldA", "fieldB"] のように配列で指定する。
    - "computedLogic" には、計算を行うJSのアロー関数文字列を指定する。
      例: "(fieldA, fieldB) => Number(fieldA || 0) + Number(fieldB || 0)"
      例: "(birthDate) => birthDate ? Math.floor((new Date() - new Date(birthDate.slice(0,4)+'-'+birthDate.slice(4,6)+'-'+birthDate.slice(6,8)))/31557600000) : 0"
12. initialFieldMappings の推論:
    - AI書類読み取り機能（画像解析）が、このフォームに関連する書類（パスポート、在留カード、住民票課税証明書等）を読み取った際に返しそうな標準的な breadcrumb を推論する。
    - breadcrumb のセクション名は以下を使用すること: 身分事項、日本における連絡先、所属機関等、旅券情報、本国における居住地、家族情報、学歴・職歴、技能実習、評価・試験
    - キーは "セクション > フィールド名" 形式（例: "身分事項 > 氏名（英字）"）。
    - 値は "sectionKey.fieldKey" 形式（例: "identityInfo.nameEn"）。
    - フォームの全フィールドについて、対応しそうな breadcrumb があれば網羅的にマッピングすること。`;
}

// ─── メイン関数 ───────────────────────────────────────────────────────────────

/**
 * パーサー出力を Gemini で解析し、AnalyzedFormDefinition を返す。
 *
 * @param parsed - パーサーが抽出したフォーム構造
 * @param formKey - 申請種別のキー名（camelCase）
 * @param formLabel - 申請種別の日本語ラベル
 * @param apiKey - Gemini API キー
 * @param exampleText - 記載例 PDF のテキスト（任意）
 * @returns AnalyzedFormDefinition
 */
export async function analyzeWithGemini(
  parsed: ParsedFormStructure,
  formKey: string,
  formLabel: string,
  apiKey: string,
  exampleText?: string,
): Promise<AnalyzedFormDefinition> {
  console.log('\n🤖 Gemini AI による構造解析を開始（Chunking & Merging）...');
  console.log(`   モデル: gemini-2.5-flash`);
  console.log(`   全フィールド数: ${parsed.fields.length}`);

  // チャンクサイズ（1回のリクエストでGeminiに渡すフィールド数）
  const CHUNK_SIZE = 40;
  const chunks: ParsedFormStructure['fields'][] = [];
  for (let i = 0; i < parsed.fields.length; i += CHUNK_SIZE) {
    chunks.push(parsed.fields.slice(i, i + CHUNK_SIZE));
  }

  console.log(`   チャンク数: ${chunks.length} (サイズ: ${CHUNK_SIZE})`);

  const mergedDefinition: AnalyzedFormDefinition = {
    formName: formLabel,
    formKey: formKey,
    sections: [],
    csvFiles: [],
    computedRules: [],
    initialFieldMappings: {},
  };

  for (let i = 0; i < chunks.length; i++) {
    const chunkFields = chunks[i];
    console.log(`\n   ⏳ [${i + 1}/${chunks.length}] チャンク解析中 (${chunkFields.length} フィールド)...`);
    
    const prompt = buildChunkPrompt(chunkFields, parsed, formKey, formLabel, i + 1, chunks.length, exampleText);
    const rawResponse = await callGemini(prompt, apiKey);

    let partialDef: AnalyzedFormDefinition;
    try {
      partialDef = JSON.parse(rawResponse) as AnalyzedFormDefinition;
    } catch {
      const jsonMatch = rawResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        partialDef = JSON.parse(jsonMatch[1]) as AnalyzedFormDefinition;
      } else {
        console.error(`⚠️ チャンク ${i + 1} の JSON パースに失敗しました。スキップします。`);
        console.error('生レスポンス (先頭500文字):', rawResponse.substring(0, 500));
        continue;
      }
    }

    // --- Merging ロジック ---
    if (partialDef.sections) {
      for (const partialSection of partialDef.sections) {
        // 既存のセクションがあるかチェック（sectionKey または sectionLabel でマッチ）
        const existingSection = mergedDefinition.sections.find(
          s => s.sectionKey === partialSection.sectionKey || s.sectionLabel === partialSection.sectionLabel
        );
        if (existingSection) {
          // 既存のセクションにフィールドを追加（重複排除）
          for (const newField of partialSection.fields) {
            if (!existingSection.fields.some(f => f.fieldKey === newField.fieldKey)) {
              existingSection.fields.push(newField);
            }
          }
        } else {
          // 新しいセクションを追加
          mergedDefinition.sections.push(partialSection);
        }
      }
    }

    if (partialDef.csvFiles) {
      for (const partialCsv of partialDef.csvFiles) {
        const existingCsv = mergedDefinition.csvFiles?.find(c => c.fileName === partialCsv.fileName);
        if (existingCsv) {
          // ヘッダーの重複を避ける
          const newHeaders = partialCsv.headers.filter(h => !existingCsv.headers.includes(h));
          existingCsv.headers.push(...newHeaders);
          existingCsv.headerCount = existingCsv.headers.length;
        } else {
          mergedDefinition.csvFiles?.push(partialCsv);
        }
      }
    }

    if (partialDef.computedRules) {
      mergedDefinition.computedRules?.push(...partialDef.computedRules);
    }

    if (partialDef.initialFieldMappings) {
      mergedDefinition.initialFieldMappings = {
        ...mergedDefinition.initialFieldMappings,
        ...partialDef.initialFieldMappings,
      };
    }
  }

  const totalFields = mergedDefinition.sections.reduce((sum, s) => sum + s.fields.length, 0);
  console.log('\n🤖 Gemini AI 解析完了（マージ結果）:');
  console.log(`   セクション数: ${mergedDefinition.sections.length}`);
  console.log(`   マージ後フィールド数: ${totalFields} / ${parsed.fields.length}`);
  console.log(`   CSVファイル数: ${mergedDefinition.csvFiles?.length || 0}`);

  return mergedDefinition;
}
