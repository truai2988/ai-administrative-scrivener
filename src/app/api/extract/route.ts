/**
 * POST /api/extract
 *
 * フロントエンドから画像/PDFファイルを直接受け取り、
 * AI で書類の文字情報を構造化データとして抽出するエンドポイント。
 *
 * ■ ハイブリッド 2 段構成:
 *   Stage 1: Document AI (OCR)
 *     → 画像/PDF を高精度に文字認識。Entity 抽出も同時実行。
 *   Stage 2: Gemini (構造化)
 *     → Document AI が返した全文テキスト + Entities を元に、
 *       Click-to-Fill サイドバー用の ExtractedItem[] を生成。
 *       Gemini はフォーム構造を理解しており、breadcrumb の推定精度が高い。
 *
 * ■ フォールバック:
 *   - DOCUMENT_AI_PROCESSOR_ID 未設定 → Gemini Vision のみで OCR + 構造化
 *   - GEMINI_API_KEY 未設定 → Document AI の Entity + 正規表現マッパー のみで構造化
 *   - 両方未設定 → 2秒待機後にモックデータを返す
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { mapDocumentAiToFormData } from '@/lib/mappers/aiExtractedToFormData';

// ─── 環境変数 ─────────────────────────────────────────────────────────────────

const PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID;
const DOC_AI_LOCATION = process.env.DOCUMENT_AI_LOCATION ?? 'us';
const DOC_AI_PROCESSOR_ID = process.env.DOCUMENT_AI_PROCESSOR_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ─── Document AI クライアント（遅延初期化） ───────────────────────────────────

let _docAiClient: DocumentProcessorServiceClient | null = null;

function getDocAiClient(): DocumentProcessorServiceClient {
  if (_docAiClient) return _docAiClient;

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error('[Extract] サービスアカウントの認証情報が設定されていません');
  }

  _docAiClient = new DocumentProcessorServiceClient({
    credentials: { client_email: clientEmail, private_key: privateKey },
    apiEndpoint:
      DOC_AI_LOCATION === 'eu'
        ? 'eu-documentai.googleapis.com'
        : 'us-documentai.googleapis.com',
  });

  return _docAiClient;
}

// ─── Gemini 構造化プロンプト ──────────────────────────────────────────────────

const STRUCTURING_PROMPT = `あなたは日本の入国管理局への申請書類を読み取る専門AIです。
以下の OCR で読み取ったテキストから、フォーム入力に使えるデータを整理して抽出してください。

【ルール】
1. 読み取れた全てのフィールド（氏名、生年月日、国籍、住所、旅券番号、在留カード番号、在留資格、勤務先情報、性別など）を抽出する
2. 各フィールドには適切な階層ラベル（breadcrumb）を付ける。以下のセクション名を使用：
   - 身分事項: 氏名（英字）、氏名（母国語/漢字）、国籍、生年月日、性別、出生地、旅券番号、発行年月日、有効期間満了日、発行機関、在留カード番号、在留資格、在留期間、在留期間満了日
   - 日本における連絡先: 郵便番号、都道府県、市区町村、番地、電話番号
   - 所属機関等: 勤務先名称、勤務先住所、月額報酬、職業
   - 本国における居住地: 住所
3. 各フィールドの確信度を 0.0〜1.0 で設定する。OCRの読み取り品質を考慮すること
4. 重複するフィールドは最も信頼度の高いものだけを残す
5. 値は正確に抽出し、推測で補完しない

【出力形式】必ず以下のJSON形式のみで返してください:
{
  "fields": [
    { "value": "抽出テキスト", "breadcrumb": ["セクション名", "フィールド名"], "confidence": 0.95 }
  ]
}`;

// Gemini Vision 用（Document AI 未使用時のフォールバック）
const VISION_PROMPT = `あなたは日本の入国管理局への申請書類を読み取る専門AIです。
アップロードされた書類画像から、フォーム入力に使えるデータを抽出してください。

【ルール】
1. 書類から読み取れる全てのフィールド（氏名、生年月日、国籍、住所、旅券番号、在留カード番号、在留資格、勤務先情報、性別など）を抽出する
2. 各フィールドには適切な階層ラベル（breadcrumb）を付ける。以下のセクション名を使用：
   - 身分事項: 氏名（英字）、氏名（母国語/漢字）、国籍、生年月日、性別、出生地、旅券番号、発行年月日、有効期間満了日、発行機関、在留カード番号、在留資格、在留期間、在留期間満了日
   - 日本における連絡先: 郵便番号、都道府県、市区町村、番地、電話番号
   - 所属機関等: 勤務先名称、勤務先住所、月額報酬、職業
   - 本国における居住地: 住所
3. 各フィールドの確信度を 0.0〜1.0 で設定する
4. 読み取れない文字や不確かな情報は確信度を低く設定する

【出力形式】必ず以下のJSON形式のみで返してください:
{
  "fields": [
    { "value": "抽出テキスト", "breadcrumb": ["セクション名", "フィールド名"], "confidence": 0.95 }
  ]
}`;

// ─── 型定義 ───────────────────────────────────────────────────────────────────

interface GeminiExtractedField {
  value: string;
  breadcrumb: string[];
  confidence: number;
}

interface GeminiExtractionResponse {
  fields: GeminiExtractedField[];
}

interface ExtractedItemResponse {
  id: string;
  value: string;
  breadcrumb: string[] | null;
  confidence: number | null;
  mapped: boolean;
  mappedTo: string | null;
}

// ─── モックデータ（全API未設定時のフォールバック） ─────────────────────────────

const MOCK_EXTRACTED_DATA: ExtractedItemResponse[] = [
  { id: 'ext-1', value: 'NGUYEN VAN ANH', breadcrumb: ['身分事項', '氏名（英字）'], confidence: 0.96, mapped: false, mappedTo: null },
  { id: 'ext-2', value: 'ベトナム', breadcrumb: ['身分事項', '国籍'], confidence: 0.92, mapped: false, mappedTo: null },
  { id: 'ext-3', value: '1995-07-22', breadcrumb: ['身分事項', '生年月日'], confidence: 0.89, mapped: false, mappedTo: null },
  { id: 'ext-4', value: '1', breadcrumb: ['身分事項', '性別'], confidence: 0.98, mapped: false, mappedTo: null },
  { id: 'ext-5', value: '150-0001', breadcrumb: ['日本における連絡先', '郵便番号'], confidence: 0.87, mapped: false, mappedTo: null },
  { id: 'ext-6', value: '東京都', breadcrumb: ['日本における連絡先', '都道府県'], confidence: 0.93, mapped: false, mappedTo: null },
  { id: 'ext-7', value: '渋谷区神宮前5-10-1', breadcrumb: ['日本における連絡先', '市区町村以下'], confidence: 0.81, mapped: false, mappedTo: null },
  { id: 'ext-8', value: '株式会社グローバルフーズ', breadcrumb: ['所属機関等', '勤務先名称'], confidence: 0.85, mapped: false, mappedTo: null },
  { id: 'ext-9', value: 'C12345678', breadcrumb: ['身分事項', '旅券番号'], confidence: 0.74, mapped: false, mappedTo: null },
  { id: 'ext-10', value: '¥220,000', breadcrumb: ['所属機関等', '月額報酬'], confidence: 0.68, mapped: false, mappedTo: null },
];

// ─── ヘルパー: Document AI の Entity/テキスト → ExtractedItem[] 変換 ──────────

/**
 * 既存のマッパー(mapDocumentAiToFormData)の出力を ExtractedItem[] に変換する。
 * breadcrumb は fieldPath から生成。
 */
function ocrFieldsToExtractedItems(
  fields: { fieldPath: string; rawValue: string; normalizedValue: string; confidence: number }[]
): ExtractedItemResponse[] {
  // fieldPath → 日本語ラベルのマッピング
  const pathLabels: Record<string, [string, string]> = {
    'foreignerInfo.nameEn': ['身分事項', '氏名（英字）'],
    'foreignerInfo.nationality': ['身分事項', '国籍'],
    'foreignerInfo.birthDate': ['身分事項', '生年月日'],
    'foreignerInfo.gender': ['身分事項', '性別'],
    'foreignerInfo.residenceCardNumber': ['身分事項', '在留カード番号'],
    'foreignerInfo.passportNumber': ['身分事項', '旅券番号'],
    'foreignerInfo.currentResidenceStatus': ['身分事項', '在留資格'],
    'foreignerInfo.currentStayPeriod': ['身分事項', '在留期間'],
    'foreignerInfo.stayExpiryDate': ['身分事項', '在留期間満了日'],
    'foreignerInfo.japanZipCode': ['日本における連絡先', '郵便番号'],
    'foreignerInfo.japanPrefecture': ['日本における連絡先', '都道府県'],
    'foreignerInfo.japanCity': ['日本における連絡先', '市区町村'],
    'foreignerInfo.japanAddressLines': ['日本における連絡先', '番地'],
    'foreignerInfo.japanAddress': ['日本における連絡先', '住所'],
    'foreignerInfo.edNumberAlpha': ['身分事項', 'ED番号（英字）'],
    'foreignerInfo.edNumberNumeric': ['身分事項', 'ED番号（数字）'],
    'foreignerInfo.hasResidenceCard': ['身分事項', '在留カードの有無'],
  };

  return fields
    .filter((f) => f.fieldPath !== 'foreignerInfo.hasResidenceCard') // UI に不要
    .map((field, index) => ({
      id: `ext-${index + 1}`,
      value: field.normalizedValue || field.rawValue,
      breadcrumb: pathLabels[field.fieldPath] ?? [field.fieldPath],
      confidence: field.confidence,
      mapped: false,
      mappedTo: null,
    }));
}

// ─── ヘルパー: Gemini JSON パース ────────────────────────────────────────────

function parseGeminiResponse(text: string): ExtractedItemResponse[] {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AIの応答データから JSON を抽出できませんでした');
  }

  const parsed: GeminiExtractionResponse = JSON.parse(jsonMatch[0]);
  return parsed.fields.map((field, index) => ({
    id: `ext-${index + 1}`,
    value: field.value,
    breadcrumb: field.breadcrumb ?? null,
    confidence: field.confidence ?? null,
    mapped: false,
    mappedTo: null,
  }));
}

// ─── メインハンドラ ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── FormData からファイルを取得 ──────────────────────────────────────
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'ファイルが送信されていません' }, { status: 400 });
    }

    // ファイルサイズチェック (最大 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'ファイルサイズが10MBを超えています' }, { status: 400 });
    }

    // MIMEタイプチェック
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `未対応のファイル形式です: ${file.type}` }, { status: 400 });
    }

    // ── ファイルを Base64 に変換 ─────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    // コスト削減（API二重課金防止）のため、デフォルトでは Document AI のハイブリッド抽出を無効化し
    // Gemini Vision 単体での抽出を優先する。
    // クライアントから明示的にハイブリッドモードが要求された場合、または環境変数で強制されている場合に有効化する。
    const clientRequestedHybrid = formData.get('useHybridMode') === 'true';
    const USE_DOCUMENT_AI_HYBRID = process.env.USE_DOCUMENT_AI_HYBRID === 'true' || clientRequestedHybrid;
    const hasDocAi = !!(DOC_AI_PROCESSOR_ID && PROJECT_ID && USE_DOCUMENT_AI_HYBRID);
    const hasGemini = !!GEMINI_API_KEY;

    // ── 両方未設定: モックモード ─────────────────────────────────────────
    if (!hasDocAi && !hasGemini) {
      console.warn('[Extract] Document AI / Gemini 両方未設定。モックデータを返します');
      await new Promise((r) => setTimeout(r, 2000));
      return NextResponse.json({ success: true, items: MOCK_EXTRACTED_DATA, mode: 'mock' });
    }

    // ════════════════════════════════════════════════════════════════════
    // Stage 1: Document AI (OCR)
    // ════════════════════════════════════════════════════════════════════

    let docAiText: string | null = null;
    let docAiItems: ExtractedItemResponse[] | null = null;

    if (hasDocAi) {
      try {
        const client = getDocAiClient();
        const processorName = `projects/${PROJECT_ID}/locations/${DOC_AI_LOCATION}/processors/${DOC_AI_PROCESSOR_ID}`;

        const [result] = await client.processDocument({
          name: processorName,
          rawDocument: {
            content: base64Data,
            mimeType: file.type,
          },
        });

        const document = result.document;
        if (document) {
          docAiText = document.text ?? null;

          // 既存マッパーで Entity + 正規表現マッチング → ExtractedItem[]
          const { extractedFields } = mapDocumentAiToFormData(document);
          if (extractedFields.length > 0) {
            docAiItems = ocrFieldsToExtractedItems(extractedFields);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Extract] Document AI エラー (Geminiにフォールバック):', msg);
        // Document AI が失敗しても Gemini にフォールバック
      }
    }

    // ════════════════════════════════════════════════════════════════════
    // Stage 2: Gemini (構造化マッピング)
    // ════════════════════════════════════════════════════════════════════

    if (hasGemini) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        let items: ExtractedItemResponse[];
        let mode: string;

        if (docAiText) {
          // ── ハイブリッドモード: Document AI テキスト → Gemini 構造化 ──
          const prompt = `${STRUCTURING_PROMPT}\n\n【OCRテキスト】\n${docAiText}`;
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          items = parseGeminiResponse(text);
          mode = 'hybrid';
        } else {
          // ── Gemini Vision モード: 画像を直接 Gemini に送信 ──
          const result = await model.generateContent([
            VISION_PROMPT,
            { inlineData: { mimeType: file.type, data: base64Data } },
          ]);
          const text = result.response.text();
          items = parseGeminiResponse(text);
          mode = 'gemini-vision';
        }

        return NextResponse.json({ success: true, items, mode });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[Extract] Gemini エラー:', msg);

        // Gemini が失敗しても Document AI の結果があればそれを返す
        if (docAiItems && docAiItems.length > 0) {
          return NextResponse.json({ success: true, items: docAiItems, mode: 'document-ai-only' });
        }

        return NextResponse.json(
          { error: `AI 処理中にエラーが発生しました: ${msg}` },
          { status: 500 },
        );
      }
    }

    // ── Document AI のみモード（Gemini 未設定） ──────────────────────────
    if (docAiItems && docAiItems.length > 0) {
      return NextResponse.json({ success: true, items: docAiItems, mode: 'document-ai-only' });
    }

    return NextResponse.json(
      { error: '書類からデータを抽出できませんでした' },
      { status: 422 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Extract] Error:', message);
    return NextResponse.json(
      { error: `書類の読み取り中にエラーが発生しました: ${message}` },
      { status: 500 },
    );
  }
}
