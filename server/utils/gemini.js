const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

function isGeminiConfigured() {
  return Boolean(GEMINI_API_KEY);
}

async function geminiGenerate(parts, { temperature = 0.4 } = {}) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');
  const res = await fetch(`${BASE}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature }
    }),
    signal: AbortSignal.timeout(45000)
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('\n') || '';
}

function geminiText(prompt, options) {
  return geminiGenerate([{ text: prompt }], options);
}

function geminiVision(imageBase64, mimeType, prompt, options) {
  return geminiGenerate([
    { text: prompt },
    { inlineData: { mimeType, data: imageBase64 } }
  ], options);
}

module.exports = { isGeminiConfigured, geminiText, geminiVision, geminiGenerate };