import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log("=== API KEY CHECK ===");
    console.log("GEMINI_API_KEY exists?", !!process.env.GEMINI_API_KEY);
    console.log("Length:", process.env.GEMINI_API_KEY?.length);
    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ isValid: false, reason: '画像データがありません' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
この画像から、行政手続（ビザ申請など）における書類作成に必要な情報（氏名、生年月日、国籍、在留資格、有効期限など）がすべて鮮明に読み取れますか？
光の反射（ハレーション）やピンボケで文字が潰れている場合、または全く関係のない画像（風景やイラストなど）である場合は isValid: false とし、再撮影を促す理由を reason に記載して、extractedData は null にしてください。

正しく読み取れる場合のみ isValid: true とし、reason は空文字または「問題ありません」とし、さらに画像から読み取った文字列をすべて抽出して extractedData に整理して格納してください。

抽出項目（存在しない場合はnullまたは空文字にしてください）:
- name: 氏名（アルファベット等すべてそのまま）
- nationality: 国籍（例：Philippines, 中国 などわかる範囲で）
- birthDate: 生年月日（YYYY-MM-DD形式に変換できれば変換。無理ならそのまま）
- residenceCardNumber: 在留カード番号（12桁の英数字）
- expiryDate: 有効期限（YYYY-MM-DD形式に変換できれば変換）
- visaType: 在留資格（例：特定技能1号, 技能実習など）

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
    "visaType": "..."
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
      throw new Error('Failed to parse AI response as JSON');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);

    return NextResponse.json(analysis);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('AI Validate Image Error:', errorMessage);
    
    // If there is an error (like missing API key), we shouldn't block the user from uploading.
    // However, for this feature, returning an error message lets the frontend handle it.
    return NextResponse.json({ 
      isValid: false, 
      reason: 'AIによる画像検査中にエラーが発生しました。時間を置いて再度お試しください。',
      systemError: true
    }, { status: 500 });
  }
}
