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

function buildPrompt(
  parsed: ParsedFormStructure,
  formKey: string,
  formLabel: string,
  exampleText?: string,
): string {
  // フィールド情報をコンパクトに整形
  const fieldsSummary = parsed.fields.map((f, i) => {
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

# 対象フォーム
- 書類名: ${formLabel}
- フォームキー: ${formKey}
- シート数: ${parsed.sheets.length} (${parsed.sheets.join(', ')})
- 検出フィールド数: ${parsed.fields.length}

# フィールド一覧
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
          "csvSpec": "CSV仕様コメント（例: 半角英数字、12文字以内）"
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
  ]
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
10. ドロップダウンの選択肢がある場合は enumValues に含める。`;
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
  console.log('\n🤖 Gemini AI による構造解析を開始...');
  console.log(`   モデル: gemini-2.5-flash`);
  console.log(`   フィールド数: ${parsed.fields.length}`);

  const prompt = buildPrompt(parsed, formKey, formLabel, exampleText);

  console.log(`   プロンプト長: ${prompt.length.toLocaleString()} 文字`);
  console.log('   ⏳ AI 解析中...\n');

  const rawResponse = await callGemini(prompt, apiKey);

  // JSON パース
  let definition: AnalyzedFormDefinition;
  try {
    definition = JSON.parse(rawResponse) as AnalyzedFormDefinition;
  } catch {
    // JSON がマークダウンのコードブロックに包まれている場合
    const jsonMatch = rawResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      definition = JSON.parse(jsonMatch[1]) as AnalyzedFormDefinition;
    } else {
      console.error('⚠️ AI レスポンスの JSON パースに失敗しました。');
      console.error('生レスポンス (先頭500文字):', rawResponse.substring(0, 500));
      throw new Error('AI レスポンスのパースに失敗しました');
    }
  }

  // 基本的なバリデーション
  if (!definition.sections || !Array.isArray(definition.sections)) {
    throw new Error('AI レスポンスに sections 配列がありません');
  }

  const totalFields = definition.sections.reduce((sum, s) => sum + s.fields.length, 0);
  console.log('🤖 Gemini AI 解析完了:');
  console.log(`   セクション数: ${definition.sections.length}`);
  console.log(`   フィールド数: ${totalFields}`);
  console.log(`   CSVファイル数: ${definition.csvFiles?.length || 0}`);

  return definition;
}
