import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set');
      return NextResponse.json({
        isValid: false,
        reason: 'APIキーが設定されていません。管理者にお問い合わせください。',
        systemError: true
      }, { status: 500 });
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ isValid: false, reason: '画像データがありません' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
この画像から、行政手続（ビザ申請など）における書類作成に必要な情報がすべて鮮明に読み取れますか？
光の反射（ハレーション）やピンボケで文字が潰れている場合、または全く関係のない画像（風景やイラストなど）である場合は isValid: false とし、再撮影を促す理由を reason に記載して、extractedData は null にしてください。

正しく読み取れる場合のみ isValid: true とし、reason は空文字または「問題ありません」とし、さらに画像から読み取った文字列をすべて抽出して extractedData に整理して格納してください。

抽出項目（存在しない場合はnullまたは空文字にしてください）:
- name: 氏名（アルファベット等すべてそのまま）
- nationality: 国籍・地域（例：Philippines, 中国 などわかる範囲で）
- birthDate: 生年月日（YYYY-MM-DD形式に変換。例: 1983年11月15日 → 1983-11-15）
- residenceCardNumber: 在留カード番号（例: DX12345678CD）
- expiryDate: 在留期限・有効期限（YYYY-MM-DD形式。例: 2026年09月01日 → 2026-09-01）
- visaType: 在留資格（例：特定技能1号, 企業内転勤, 技能実習など）
- gender: 性別（「男」または「女」。Male/M → 男、Female/F → 女）
- address: 住居地・住所（記載がある場合そのまま）
- workRestriction: 就労制限の有無（「就労活動のみ可」「在留資格に基づく就労活動のみ可」「制限なし」など記載通り）
- periodOfStay: 在留期間の年数表記（例: 「5年」「3年」「1年」）
- dateOfPermission: 許可年月日（YYYY-MM-DD形式）
- dateOfDelivery: 交付年月日（YYYY-MM-DD形式）
- passportNumber: 旅券番号（パスポートに記載の場合のみ。例: TK1234567）

結果は必ず以下のJSON形式でのみ返してください。他のテキストやマークダウン指定は含めないでください。

{
  "isValid": true または false,
  "reason": "具体的な理由。",
  "extractedData": {
    "name": "...",
    "nationality": "...",
    "birthDate": "...",
    "residenceCardNumber": "...",
    "expiryDate": "...",
    "visaType": "...",
    "gender": "...",
    "address": "...",
    "workRestriction": "...",
    "periodOfStay": "...",
    "dateOfPermission": "...",
    "dateOfDelivery": "...",
    "passportNumber": "..."
  }
}
`;


    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const imageParts = [
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType || 'image/jpeg',
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AIの応答データの解析に失敗しました');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json(analysis);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('AI Validate Image Error:', errorMessage);
    console.error('Stack:', errorStack);
    
    return NextResponse.json({ 
      isValid: false, 
      reason: `AIエラー: ${errorMessage}`,
      systemError: true
    }, { status: 500 });
  }
}
