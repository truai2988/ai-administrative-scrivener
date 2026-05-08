import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateCamelCaseId(formName: string, apiKey: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
Translate the following Japanese document name into a concise, beautiful camelCase English string.
Do not include any file extensions, spaces, or symbols.
For example:
- "事業計画書" -> "businessPlan"
- "在留資格変更許可申請書" -> "changeOfStatus"
- "特定技能ビザ申請" -> "specifiedSkilledWorker"

Document Name: ${formName}

Return ONLY the camelCase string and nothing else.
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  
  // Remove any markdown code blocks if the AI returned them
  return text.replace(/`/g, '').replace(/^json\n/, '').trim();
}
