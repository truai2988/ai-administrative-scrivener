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
import objectHash from 'object-hash';

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
            description: '入力データJSON内に実在するキーパス。ルートキーは入力データのトップレベルキーと完全一致させること。',
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
在留資格に関する申請書データを受け取り、以下の審査基準に基づいて厳密にチェックを行い、
問題点・懸念点・改善提案を diagnostics 配列として返却してください。
このチェックは、在留期間更新・在留資格変更・在留資格認定証明書交付のいずれの申請書にも対応します。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【最優先: 入力データ品質チェック（Input Cleansing）】
  category: "input"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[P-1: 氏名の分割検証 → level: "suggestion"]

外国人本人の氏名フィールド（nameEn: ローマ字、nameKanji: 漢字/母国語表記）について、
以下のパターンを検知し、具体的な分割提案を出すこと。

■ アルファベット氏名（nameEn）の場合:
- 在留カードおよび入管の表記規則では「SURNAME GIVEN_NAME」の順（スペース区切り）が標準。
- nameEn にスペースが含まれていない、かつ明らかに多音節の場合（例: "JOHNDOE"）は
  フルネームが結合している可能性が高い → "suggestion" を出す。
  メッセージ例:「氏名が結合されている可能性があります。在留カードの表記を確認し、
  例：『氏（Surname）: DOE』『名（Given name）: JOHN』のように正しく分割してください。」
- nameEn の全文が明らかに姓のみ（単一の普通名詞的な文字列）で、
  かつ firstName または nameKanji に名が未入力の場合は suggestion を出す。
- スペースで区切られているが「名・姓の逆順」になっている疑い（例: 漢字圏の外国人で
  ローマ字が一般的な姓→名の順と逆になっている場合）も検知し suggestion を出すこと。

■ 漢字・母国語表記氏名（nameKanji）の場合:
- nameKanji に日本語の姓・名の区切りや、中国語・ベトナム語・韓国語の
  一般的な姓の知識に基づき、明らかに姓のみで名が別フィールドに入っていない場合は
  suggestion を出すこと。
- 例：「姓が結合されている可能性があります。
  例：姓：阮 / 名：文明 に分割してください。」

[P-2: 全角文字・不要記号の混在 → level: "warning"]

以下のフォーマット違反を検知し、具体的な修正指示を出すこと。

■ 全角文字の混入:
- nameEn（ローマ字氏名）に全角アルファベット（Ａ〜Ｚ、ａ〜ｚ）、
  全角数字（０〜９）、全角スペース（　）が含まれている場合は warning を出す。
  メッセージ例:「氏名（ローマ字）に全角文字が含まれています。
  半角アルファベット（A-Z）のみで入力してください。」
- passportNumber（旅券番号）に全角文字が含まれる場合も同様に warning を出す。
  日本の旅券番号は「アルファベット2桁＋数字7桁」が標準。
- email（メールアドレス）に全角文字が含まれる場合は warning を出す。
- companyPhone / phoneNumber / mobileNumber が全角数字・ハイフン全角を含む場合は warning。

■ 在留カード番号のフォーマット検証:
- residenceCardNumber のフォーマットは「英字2桁＋数字8桁＋英字2桁」（計12文字）が正規形式。
  例: AB12345678CD
- このフォーマットに合致しない場合（長さが異なる、全角含む、ハイフン混入など）は
  warning を出すこと。
  メッセージ例:「在留カード番号のフォーマットが正しくありません。
  正しい形式：英字2文字＋数字8桁＋英字2文字（例: AB12345678CD）で入力してください。」
- 在日親族（relatives 配列）の residenceCardNumber も同様にチェックすること。

■ 法人番号・雇用保険番号:
- corporateNumber（法人番号）は数字13桁が正規形式。全角混入・桁数違いは warning。
- employmentInsuranceNumber（雇用保険適用事業所番号）は
  「数字2桁-数字6桁-数字1桁」（ハイフン区切りで計9桁）が一般的な形式。
  大幅に異なる場合は warning を出すこと。

■ 電話番号:
- companyPhone / phoneNumber / mobileNumber が数字・ハイフン・プラス記号以外の
  文字を含む場合は warning を出すこと。
- 桁数が7桁未満または15桁超の場合も warning（国際番号含む）。

■ パスポート番号:
- 日本の旅券番号は「英字2桁＋数字7桁」（例: AB1234567）が標準形式。
  この形式から大幅に外れている場合は warning を出すこと（外国籍の場合は国ごとに異なる
  ため、明確に異常な場合のみ指摘）。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【審査基準 1: 入力フィールドの基本チェック（category: "input"）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- 必須フィールド（nameEn、birthDate、passportNumber、residenceCardNumber、
  japanZipCode、japanPrefecture、japanCity、japanAddressLines、
  phoneNumber、email、currentResidenceStatus、stayExpiryDate）が
  空文字・null・undefinedの場合は critical を出す。
- passportExpiryDate（旅券有効期限）が現在日から6ヶ月以内の場合は warning を出す。
  メッセージ例:「旅券の有効期限が6ヶ月以内に迫っています。
  旅券の更新を行い、最新の旅券番号・有効期限を記載してください。」
- stayExpiryDate（在留期限）が現在日より過去の場合は critical を出す（期限切れ）。
- stayExpiryDate が現在日から1ヶ月以内の場合は warning を出す（申請期間の懸念）。
- checkIntent（申請意思の宣誓）が false の場合は critical を出す。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【審査基準 2: データ間の整合性チェック（category: "consistency"）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- 在留期限と雇用契約終了日を比較し、契約が在留期限より著しく短い（例: 3ヶ月以上乖離）、
  または契約更新の記載がない場合は warning を出す。
- 雇用開始日が在留期限後になっている場合は critical を出す。
- 特定技能1号の通算在留期間が4年を超えている（上限5年）場合は warning を出す。
- 月給の時給換算（hourlyRate）と月額（monthlySalary）・週の所定労働時間の計算が矛盾している場合は warning を出す。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【審査基準 3: 法的・審査上のリスクチェック（category: "legal"）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[3-1: 税金・社会保険の未納チェック]
- 雇用保険・社会保険（健康保険・厚生年金）の適用（対象パス: employerInfo.isLaborInsuranceApplicable, employerInfo.isSocialInsuranceApplicable）が false になっている場合は critical を出し、
  「在留資格の要件として社会保険の適用は必須です」と指摘すること。
- 資本金・年間売上金額（employerInfo.capital, employerInfo.annualRevenue）の記載がない（または0）場合は warning を出し、
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
  入管審査で不許可となる可能性が高いため、職務内容の記載を見直すことを強く推奨します」と指摘すること。
- 業務区分が未選択・空の場合は critical を出すこと。
  フィールドパスは申請種別によって異なるため、以下に従って正確に指定すること:
  * 在留期間更新・在留資格変更の場合: field = "employerInfo.jobCategories"
  * 在留資格認定証明書交付（COE）の場合: field = "employerInfo.specifiedSkilledSubCategory"
  メッセージ例:「業務区分は必須項目です。主たる職務内容がどのような業務区分に該当するのか
  具体的に記載してください。特に特定技能の場合、不許可事由となる可能性が高いです。」
  なお、入力データに "specifiedSkilledSubCategory" キーが存在する場合はCOE申請として判定し、
  "jobCategories" キーが存在する場合は更新・変更申請として判定すること。


[3-5: 犯罪歴・問題行動]
- criminalRecord が true の場合、criminalRecordDetail が未記載であれば critical を出すこと。
- criminalRecord が true かつ detail がある場合は warning を出し、
  「犯罪歴がある場合、詳細な経緯と反省・改善の事実を示す資料の添付を推奨します」と指摘すること。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【出力の注意事項】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 問題が全くない優良な申請の場合は diagnostics を空配列 [] にすること。
- 各メッセージは実務的・具体的に書き、行政書士が補正するためのアドバイスを含めること。
- field は、入力データのJSONに実在する完全なキーパス（例: employerInfo.isSocialInsuranceApplicable）をそのまま記載すること。実在しないパス（例: employmentInfoなど）を勝手に生成（ハルシネーション）しないこと。
- 氏名分割の提案では「どのように分割すべきか」を必ず具体的に示すこと。
- 1つの問題に対して1つのアイテムのみ出力すること（重複禁止）。
- P-1〜P-2の入力品質チェックは、他のどの審査基準よりも優先して最初に評価すること。
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
  } catch (err) {
    console.error('[verifyAuth] トークン検証エラー:', err);
    return {
      error: NextResponse.json({ error: '無効な認証トークンです' }, { status: 401 }),
    };
  }
}

// ─── ペイロード最小化ヘルパー ───────────────────────────────────────────────────

function removeEmptyData(obj: unknown): unknown {
  if (obj === null || obj === undefined || obj === '') return undefined;
  if (Array.isArray(obj)) {
    const arr = obj.map(removeEmptyData).filter((val) => val !== undefined);
    return arr.length > 0 ? arr : undefined;
  }
  if (typeof obj === 'object') {
    if (Object.prototype.toString.call(obj) !== '[object Object]') {
      return obj;
    }
    const newObj: Record<string, unknown> = {};
    let hasKeys = false;
    for (const key in obj as Record<string, unknown>) {
      const val = removeEmptyData((obj as Record<string, unknown>)[key]);
      if (val !== undefined) {
        newObj[key] = val;
        hasKeys = true;
      }
    }
    return hasKeys ? newObj : undefined;
  }
  return obj;
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
    let body: Record<string, unknown> = {};

    try {
      body = await req.json();
    } catch {
      // bodyが空の場合は無視
    }

    // applicationType に基づいてコレクション名を決定
    const applicationType = (body.applicationType as string) || 'renewal';
    const collectionMap: Record<string, string> = {
      renewal: 'renewal_applications',
      coe: 'coe_applications',
      change_of_status: 'change_of_status_applications',
    };
    const collectionName = collectionMap[applicationType] || 'renewal_applications';

    const applicationTypeLabel: Record<string, string> = {
      renewal: '在留期間更新許可申請書',
      coe: '在留資格認定証明書交付申請書',
      change_of_status: '在留資格変更許可申請書',
    };
    const typeLabel = applicationTypeLabel[applicationType] || '申請書';

    let aiDiagnosticsData: {
      diagnostics?: unknown;
      lastDiagnosticHash?: string;
    } | null = null;

    if (id === 'unsaved') {
      // 未保存フォームの場合: ボディからデータを取得
      formData = (body.formData as Record<string, unknown>) ?? {};
    } else {
      // 保存済みの申請書レコードから取得
      const docRef = db.collection(collectionName).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return NextResponse.json({ error: '申請書が見つかりません' }, { status: 404 });
      }

      const data = doc.data()!;
      formData = (data.formData as Record<string, unknown>) ?? {};
      aiDiagnosticsData = data.aiDiagnostics;
    }

    // 送信ペイロードの最小化（空データの削除）
    const minimizedFormData = removeEmptyData(formData) || {};

    // 3. カスタム診断ルールをFirestoreから取得し、システムプロンプトに動的結合
    let finalSystemPrompt = SYSTEM_PROMPT;
    let customRulesText = '';

    try {
      const rulesSnapshot = await db
        .collection('ai_diagnostic_rules')
        .where('enabled', '==', true)
        .get();

      if (!rulesSnapshot.empty) {
        customRulesText = rulesSnapshot.docs.map((ruleDoc, index) => {
          const rule = ruleDoc.data();
          const ruleTitle = rule.title || `カスタムルール${index + 1}`;
          const ruleContent = rule.type === 'pdf'
            ? (rule.pdfExtractedText || '（テキスト抽出なし）')
            : (rule.content || '');
          return `[ルール${index + 1}: ${ruleTitle}]\n${ruleContent}`;
        }).join('\n\n');

        finalSystemPrompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【追加カスタムルール（事務所独自の基準）】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

以下は事務所固有の追加チェック基準です。上記の基本基準と同等の厳密さで適用してください。
問題を検知した場合は、上記と同じ diagnostics 形式で出力してください。

${customRulesText}`;
      }
    } catch (rulesErr) {
      // カスタムルール取得失敗はログのみ（基本診断は続行）
      console.warn('[ai-check] カスタムルールの取得に失敗:', rulesErr);
    }

    // 3.5 ハッシュ生成と早期リターン (キャッシュの利用)
    // AIモデルやシステムプロンプトのバージョンもソルトとして含めることで将来のアップデートに対応
    const MODEL_NAME = 'gemini-2.5-flash';
    const PROMPT_VERSION = '1.2.0'; // COE業務区分フィールドパスの申請種別分岐に対応
    
    const computedHash = objectHash({
      formData: minimizedFormData,
      customRulesText,
      model: MODEL_NAME,
      promptVersion: PROMPT_VERSION,
    });

    if (id !== 'unsaved' && aiDiagnosticsData && aiDiagnosticsData.lastDiagnosticHash === computedHash) {
      console.log('[ai-check] ⚡ キャッシュヒット: 早期リターンします', { id, computedHash });
      return NextResponse.json({ diagnostics: aiDiagnosticsData.diagnostics }, { status: 200 });
    }

    // 4. Gemini API 呼び出し
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
        model: MODEL_NAME,
        systemInstruction: finalSystemPrompt,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: GEMINI_RESPONSE_SCHEMA,
        },
      },
      { timeout: 60000 }
    );

    // フォームデータを構造化されたテキストとして渡す
    // トップレベルキーを動的に抽出し、AIにfieldパスの制約として明示する
    const topLevelKeys = typeof minimizedFormData === 'object' && minimizedFormData !== null
      ? Object.keys(minimizedFormData as Record<string, unknown>)
      : [];

    const userPrompt = `以下の${typeLabel}データを診断してください。

【申請種別】${typeLabel}

【申請データのトップレベルキー一覧】
${topLevelKeys.join(', ')}

⚠️ diagnostics の field には、上記のトップレベルキーのいずれかで始まるパスのみを使用すること。
上記に存在しないルートキー（例: foreignerInfo, employmentInfo, companyInfo 等）は絶対に使わないこと。
正しい例: "${topLevelKeys[0] || 'identityInfo'}.nameEn"
誤った例: "foreignerInfo.nameEn"（トップレベルキーに存在しない場合）

【申請データ（JSON）】
${JSON.stringify(minimizedFormData, null, 2)}

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
    console.log('[ai-check] 保存判定: id=', id, ', collectionName=', collectionName, ', diagnostics件数=', diagnostics.length);
    if (id !== 'unsaved') {
      try {
        await db.collection(collectionName).doc(id).update({
          aiDiagnostics: {
            diagnostics,
            checkedAt: new Date().toISOString(),
            checkedBy: authResult.uid,
            lastDiagnosticHash: computedHash,
          },
        });
        console.log('[ai-check] ✅ Firestore保存成功: ', collectionName, '/', id);
      } catch (saveErr) {
        console.warn('[ai-check] ❌ Firestoreへの保存に失敗:', saveErr);
      }
    } else {
      console.warn('[ai-check] ⚠️ id=unsaved のためFirestoreに保存しません');
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
