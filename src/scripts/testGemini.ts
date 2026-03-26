import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
);
const data = await res.json() as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
const generateModels = (data.models ?? []).filter(m =>
  m.supportedGenerationMethods?.includes('generateContent')
);
console.log('generateContent対応モデル一覧:');
generateModels.forEach(m => console.log(' -', m.name));
