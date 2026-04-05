/**
 * POST /api/applications/[id]/ai-check
 *
 * 申請書データをGemini APIで診断し、入力チェック・整合性チェック・法的リスクチェックの
 * 結果を Structured Output (JSON) で返します。
 *
 * 認証: Bearerトークン（ログイン済みユーザーであれば全ロール可）
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { ObjectSchema } from '@google/generative-ai';
import { z } from 'zod';
import { adminAuth, getAdminDb } from '@/lib/firebase/admin';

// ─── Zodスキーマ定義 ──────────────────────────────────────────────────────────

const DiagnosticItemSchema = z.object({
  level: z.enum(['critical', 'warning', 'suggestion']),
  category: z.enum(['input', 'consistency', 'legal']),
  field: z.string(),
  message: z.string(),
});

const AiCheckResponseSchema = z.object({
  diagnostics: z.array(DiagnosticItemSchema),
});

// ─── Gemini JSON Schema（Structured Output用） ─────────────────────────────────
// SDKの型システムが複雑なため、実行時に正しいJSONを出力するスキーマを
// as unknownでキャストして使用する。
// 参考: https://ai.google.dev/gemini-api/docs/structured-output

const GEMINI_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    diagnostics: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          level: {
            type: SchemaType.STRING,
            enum: ['critical', 'warning', 'suggestion'],
            description: '重大度: critical=不許可リスク大, warning=要注意, suggestion=改善提案',
          },
          category: {
            type: SchemaType.STRING,
            enum: ['input', 'consistency', 'legal'],
            description: 'カテゴリ: input=入力不備, consistency=整合性, legal=法的リスク',
          },
          field: {
            type: SchemaType.STRING,
            description: '対象フィールド名（例: foreignerInfo.monthlySalary）',
          },
          message: {
            type: SchemaType.STRING,
            description: 'ユーザーへの具体的な指摘・提案メッセージ（日本語）',
          },
        },
        required: ['level', 'category', 'field', 'message'],
      },
    },
  },
  required: ['diagnostics'],
} as unknown as ObjectSchema;


// ─── システムプロンプト ────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `あなたは日本の入管業務に精通した厳格な行政書士です。
在留期間更新許可申請書のデータを受け取り、以下の審査基準に基づいて厳密にチェックを行い、
問題点・懸念点・改善提案を diagnostics 配列として返却してください。

【審査基準 1: 入力フィールドの基本チェック（category: "input"）】
- 必須フィールド（氏名、生年月日、パスポート番号、在留カード番号、住所、電話番号、メールアドレス等）が空の場合は critical を出す。
- パスポート有効期限・在留期限が申請日（現在）から6ヶ月以内に迫っている場合は warning を出す。
- 法人番号が13桁ではない場合、または雇用保険番号のフォーマットが不正な場合は warning を出す。

【審査基準 2: データ間の整合性チェック（category: "consistency"）】
- 在留期限と雇用契約終了日を比較し、契約が在留期限より著しく短い（例: 3ヶ月以上乖離）、
  または契約更新の記載がない場合は warning を出す。
- 雇用開始日が在留期限後になっている場合は critical を出す。
- 特定技能1号の通算在留期間が4年を超えている（上限5年）場合は warning を出す。
- 月給の時給換算（hourlyRate）と月額（monthlySalary）・週の所定労働時間の計算が矛盾している場合は warning を出す。

【審査基準 3: 法的・審査上のリスクチェック（category: "legal"）】

[3-1: 税金・社会保険の未納チェック]
- 雇用保険・社会保険（健康保険・厚生年金）の適用が false になっている場合は critical を出し、
  「在留資格の要件として社会保険の適用は必須です」と指摘すること。
- 資本金・年間売上金額の記載がない（または0）場合は warning を出し、
  財政的安定性の証明として記載を促すこと。

[3-2: 生計の安定性チェック]
- monthlySalary（月給）が12倍で年収換算した場合に300万円を下回る、かつ
  在日親族（hasRelatives: true）がいる場合は warning を出し、
  「扶養家族の有無・人数と照らし生計要件に不安があります。理由書での補足説明を推奨します」と指摘すること。
- monthlySalary が160,000円（最低賃金水準）を下回る場合は critical を出すこと。
- 日本人と同等の報酬（equivalentSalary）が false の場合は critical を出すこと。

[3-3: 在留期限と契約期間の整合性]
- stayExpiryDate（在留期限）と contractEndDate（契約終了日）を比較し、
  契約終了日が在留期限より3ヶ月以上前に設定されている場合は warning を出すこと。
- desiredStayPeriod（希望在留期間）が contractEndDate を超えている場合は warning を出すこと。

[3-4: 単純作業の除外チェック（特定技能の業務区分確認）]
- mainJobType（主たる職種）や industryFields（特定産業分野）の記載内容に、
  「ライン作業」「清掃」「レジ」「荷物の積み下ろし」「単純」「梱包のみ」など
  単純労働を想起させるキーワードが含まれる場合は critical を出し、
  「在留資格『特定技能』は単純労働に該当する業務を主とすることはできません。
  IN管審査で不許可となる可能性が高いため、職務内容の記載を見直すことを強く推奨します」と指摘すること。
- jobCategories（業務区分）が空の場合は critical を出すこと。

[3-5: 犯罪歴・問題行動]
- criminalRecord が true の場合、criminalRecordDetail が未記載であれば critical を出すこと。
- criminalRecord が true かつ detail がある場合は warning を出し、
  「犯罪歴がある場合、詳細な経緯と反省・改善の事実を示す資料の添付を推奨します」と指摘すること。

【出力の注意事項】
- 問題がない優良な申請場合は diagnostics を空配列 [] にすること。
- 各メッセージは実務的・具体的に書き、行政書士が補正するためのアドバイスを含めること。
- field は対象のJSONパスに近い形（例: employerInfo.monthlySalary）で記載すること。
- 1つの問題に対して1つのアイテムのみ出力すること（重複禁止）。
`;

// ─── 認証ヘルパー ──────────────────────────────────────────────────────────────

async function verifyAuth(req: NextRequest): Promise<
  { uid: string; error?: never } | { uid?: never; error: NextResponse }
> {
  const authHeader = req.headers.get('Authorization');
  const idToken = authHeader?.replace('Bearer ', '').trim();

  if (!idToken) {
    return {
      error: NextResponse.json({ error: '認証トークンがありません' }, { status: 401 }),
    };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return { uid: decoded.uid };
  } catch {
    return {
      error: NextResponse.json({ error: '無効な認証トークンです' }, { status: 401 }),
    };
  }
}

// ─── POST ハンドラ ─────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. 認証チェック
  const authResult = await verifyAuth(req);
  if (authResult.error) return authResult.error;

  const { id } = await params;

  try {
    const db = getAdminDb();

    // 2. フォームデータの取得
    //    - id が 'unsaved' の場合はリクエストボディから直接取得（未保存フォームのフォールバック）
    //    - それ以外は Firestore からデータを取得
    let formData: Record<string, unknown>;

    if (id === 'unsaved') {
      // 未保存フォームの場合: ボディからデータを取得
      const body = await req.json();
      formData = body.formData ?? {};
    } else {
      // 保存済みの申請書レコードから取得
      const docRef = db.collection('renewal_applications').doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return NextResponse.json({ error: '申請書が見つかりません' }, { status: 404 });
      }

      const data = doc.data()!;
      formData = (data.formData as Record<string, unknown>) ?? {};
    }

    // 3. Gemini API 呼び出し
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI機能が設定されていません（GEMINI_API_KEY未設定）' },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      {
        model: 'gemini-2.0-flash',
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: GEMINI_RESPONSE_SCHEMA,
        },
      },
      { timeout: 60000 }
    );

    // フォームデータを構造化されたテキストとして渡す
    const userPrompt = `以下の在留期間更新許可申請書データを診断してください。

【申請データ（JSON）】
${JSON.stringify(formData, null, 2)}

上記のデータを審査基準に従い厳密にチェックし、diagnostics配列として結果を返してください。`;

    const result = await model.generateContent(userPrompt);
    const responseText = result.response.text();

    // 4. Zodでパース・バリデーション
    const parsed = JSON.parse(responseText);
    const validated = AiCheckResponseSchema.safeParse(parsed);

    if (!validated.success) {
      console.error('[ai-check] Zodバリデーション失敗:', validated.error);
      return NextResponse.json(
        { error: 'AIの応答形式が不正です。再度お試しください。' },
        { status: 500 }
      );
    }

    const { diagnostics } = validated.data;

    // 5. 結果をFirestoreに保存（unsaved以外）
    if (id !== 'unsaved') {
      try {
        await db.collection('renewal_applications').doc(id).update({
          aiDiagnostics: {
            diagnostics,
            checkedAt: new Date().toISOString(),
            checkedBy: authResult.uid,
          },
        });
      } catch (saveErr) {
        // 保存失敗はログのみ（診断結果の返却は優先）
        console.warn('[ai-check] Firestoreへの保存に失敗:', saveErr);
      }
    }

    return NextResponse.json({ diagnostics }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ai-check] Error:', err);
    return NextResponse.json(
      { error: `AI診断中にエラーが発生しました: ${message}` },
      { status: 500 }
    );
  }
}
