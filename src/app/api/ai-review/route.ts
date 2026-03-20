import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Gemini API
// IMPORTANT: In a real app, use environment variables for API keys
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const { 
      foreignerName, 
      currentJobContent, 
      pastExperience, 
      visaCategory 
    } = await req.json();

    if (!currentJobContent || !pastExperience) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const prompt = `
あなたはプロフェッショナルな行政書士のAIアシスタントです。
以下の「現在の職務内容」と「外国人の過去の経歴」を照らし合わせ、在留資格（主に特定技能：${visaCategory || '飲食料品製造業など'}）の業務範囲において矛盾がないか、また許可が下りない可能性のある「単純労働」に該当するリスクがないかリーガルチェックを行ってください。

【対象外国人】: ${foreignerName}
【現在の職務内容】: 
${currentJobContent}

【過去の経歴】: 
${pastExperience}

【指示】:
1. 職務内容と過去の経歴・専門性の矛盾を特定してください。
2. 職務内容が当該在留資格の要件を満たしているか、または「単純労働」とみなされるリスクを評価してください。
3. 結果は必ず以下のJSON形式でのみ返してください。他のテキストは含めないでください。

{
  "riskScore": (0から100の数値。高いほど不許可リスクが高い),
  "reason": "具体的なリスクの理由。行政書士が補正するためのアドバイスを含めてください。"
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (handling potential markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);

    // Here, you would normally save 'analysis' back to Firestore
    // e.g., db.collection('foreigners').doc(id).update({ aiReview: { ...analysis, checkedAt: new Date().toISOString() } })

    return NextResponse.json({ 
      success: true, 
      aiReview: {
        ...analysis,
        checkedAt: new Date().toISOString()
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('AI Review Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}
