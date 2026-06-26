// ============================================
// LalaWord Gemini API Client
// ============================================

const GeminiAPI = (() => {
  const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
  let requestCount = 0;
  let lastResetTime = Date.now();
  const MAX_RPM = 12;

  function getModel() {
    return Store.get('geminiModel') || 'gemini-2.0-flash';
  }

  function getApiKey() {
    return Store.get('apiKey');
  }

  function checkRateLimit() {
    const now = Date.now();
    if (now - lastResetTime > 60000) {
      requestCount = 0;
      lastResetTime = now;
    }
    if (requestCount >= MAX_RPM) {
      throw new Error('RATE_LIMIT');
    }
    requestCount++;
  }

  async function call(contents, options = {}) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error('NO_API_KEY');

    checkRateLimit();

    const body = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens ?? 4096,
        responseMimeType: 'application/json',
      },
    };

    const url = `${BASE_URL}/models/${getModel()}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) throw new Error('QUOTA_EXCEEDED');
      if (response.status === 400) throw new Error('INVALID_API_KEY');
      if (response.status === 403) throw new Error('INVALID_API_KEY');
      throw new Error(`API_ERROR_${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('EMPTY_RESPONSE');

    try {
      return JSON.parse(text);
    } catch {
      // Try to extract JSON from text
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      throw new Error('PARSE_ERROR');
    }
  }

  // OCR: Image → Text
  async function extractText(imageBase64) {
    const contents = [{
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageBase64,
          }
        },
        {
          text: `이 이미지는 영어 책의 한 페이지입니다.
이미지에서 모든 영어 텍스트를 정확하게 추출해주세요.
문단 구조를 유지하며 줄바꿈 위치도 보존해주세요.
이미지가 아닌 텍스트, 페이지 번호도 포함하세요.
반드시 아래 JSON 형식으로만 응답하세요:
{
  "text": "추출된 전체 텍스트",
  "paragraphs": ["문단1", "문단2", ...]
}`
        }
      ]
    }];

    return call(contents, { temperature: 0.1 });
  }

  // Batch OCR: Multiple images
  async function extractTextBatch(imagesBase64) {
    const parts = [];
    imagesBase64.forEach((img, i) => {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: img,
        }
      });
    });

    parts.push({
      text: `위의 ${imagesBase64.length}장의 이미지는 영어 책의 연속된 페이지들입니다.
각 이미지에서 모든 영어 텍스트를 정확하게 추출해주세요.
페이지 순서대로 텍스트를 합쳐서 제공하세요.
반드시 아래 JSON 형식으로만 응답하세요:
{
  "text": "모든 페이지의 전체 텍스트",
  "paragraphs": ["문단1", "문단2", ...],
  "pageCount": ${imagesBase64.length}
}`
    });

    return call([{ parts }], { temperature: 0.1, maxTokens: 8192 });
  }

  // Word Analysis
  async function analyzeWords(text, level, options = {}) {
    const extractAll = options.extractAll || false;

    if (extractAll) {
      return extractAllWords(text);
    }

    const levelNames = {
      1: '유치원 수준 (기초 200단어 이상은 모두)',
      2: '초등 저학년 수준 (초등 필수 800단어 범위 이상)',
      3: '초등 고학년 수준 (초등 심화 1500단어 범위 이상)',
      4: '중학생 수준 (중등 필수 2500단어 범위 이상)',
      5: '고등학생 수준 (수능 필수 4000단어 범위 이상)',
      6: '고급/성인 수준 (토익/토플 전문 어휘만)',
    };

    const contents = [{
      parts: [{
        text: `다음 영어 텍스트에서 한국 학생의 영어 학습에 도움이 되는 단어를 분석해주세요.

사용자의 영어 수준: Lv.${level} — ${levelNames[level]}

해당 수준에서 학습이 필요한 단어만 선별해주세요.
관사(a, the), 전치사(in, on), 접속사(and, but) 등 기능어는 제외하세요.
Lv.1이면 거의 모든 단어를, Lv.6이면 고급 어휘만 선별하세요.

텍스트:
"""
${text}
"""

반드시 아래 JSON 형식으로만 응답하세요:
{
  "words": [
    {
      "word": "영어 단어 (원형)",
      "meaning": "한국어 뜻 (간결하게)",
      "pos": "품사 (명사/동사/형용사/부사/기타)",
      "pronunciation": "IPA 발음기호",
      "level": ${level},
      "example": "텍스트에서 해당 단어가 사용된 문장",
      "exampleMeaning": "예문의 한국어 해석"
    }
  ]
}`
      }]
    }];

    return call(contents, { temperature: 0.2, maxTokens: 8192 });
  }

  // Extract ALL unique words (including simple ones like "you", "and", "the")
  async function extractAllWords(text) {
    const contents = [{
      parts: [{
        text: `다음 영어 텍스트에서 등장하는 모든 고유한 영어 단어를 빠짐없이 추출해주세요.

중요한 규칙:
- you, and, the, is, a, it, he, she, we 등 아무리 쉬운 단어도 모두 포함
- 고유명사(이름, 지명)는 제외
- 중복은 제거하고 한 번만 포함
- 동사는 원형으로 변환 (was→be, running→run 등)
- 모든 단어에 한국어 뜻, 품사, IPA 발음기호를 달아주세요
- 텍스트에서 해당 단어가 사용된 예문도 포함

텍스트:
"""
${text}
"""

반드시 아래 JSON 형식으로만 응답하세요:
{
  "words": [
    {
      "word": "영어 단어 (원형)",
      "meaning": "한국어 뜻 (간결하게)",
      "pos": "품사 (명사/동사/형용사/부사/기타)",
      "pronunciation": "IPA 발음기호",
      "level": 1,
      "example": "텍스트에서 해당 단어가 사용된 문장",
      "exampleMeaning": "예문의 한국어 해석"
    }
  ]
}`
      }]
    }];

    return call(contents, { temperature: 0.1, maxTokens: 8192 });
  }

  // Sentence Translation
  async function translateSentences(paragraphs, mode = 'natural') {
    const modeDesc = mode === 'literal' ? '직역 (영어 어순 그대로)' : '의역 (자연스러운 한국어)';

    const contents = [{
      parts: [{
        text: `다음 영어 문장들을 한국어로 해석해주세요.
해석 모드: ${modeDesc}

문장들:
${paragraphs.map((p, i) => `${i + 1}. ${p}`).join('\n')}

반드시 아래 JSON 형식으로만 응답하세요:
{
  "translations": [
    {
      "original": "영어 원문",
      "translation": "한국어 해석",
      "grammarPoints": ["주요 문법 포인트 (있으면)"]
    }
  ]
}`
      }]
    }];

    return call(contents, { temperature: 0.3, maxTokens: 8192 });
  }

  // Test API Key
  async function testApiKey(key) {
    // First try listing models - simplest & most reliable validation
    try {
      const listUrl = `${BASE_URL}/models?key=${key}`;
      const listResp = await fetch(listUrl);
      if (listResp.ok) return true;
      console.warn('[API Key Test] models list failed:', listResp.status, await listResp.text().catch(() => ''));
    } catch (e) {
      console.warn('[API Key Test] models list error:', e);
    }

    // Fallback: try a minimal generateContent call
    const model = Store.get('geminiModel') || 'gemini-2.0-flash';
    const url = `${BASE_URL}/models/${model}:generateContent?key=${key}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hi' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });
      if (!response.ok) {
        console.warn('[API Key Test] generateContent failed:', response.status, await response.text().catch(() => ''));
      }
      return response.ok;
    } catch (e) {
      console.warn('[API Key Test] generateContent error:', e);
      return false;
    }
  }

  // Test a specific model with a simple call
  async function testModel(apiKey, modelId) {
    const url = `${BASE_URL}/models/${modelId}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say hello' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });
      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn(`[Model Test] ${modelId} failed:`, response.status, errText);
        return { ok: false, status: response.status, error: errText };
      }
      return { ok: true };
    } catch (e) {
      console.warn(`[Model Test] ${modelId} error:`, e);
      return { ok: false, status: 0, error: e.message };
    }
  }

  // Recommended models that are known to work well
  const RECOMMENDED_MODELS = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];

  // List available models
  async function listModels(apiKey) {
    try {
      const response = await fetch(`${BASE_URL}/models?key=${apiKey}`);
      if (!response.ok) return [];
      const data = await response.json();
      const all = (data.models || []).filter(m =>
        m.name && m.supportedGenerationMethods?.includes('generateContent')
      ).map(m => {
        const id = m.name.replace('models/', '');
        return {
          id,
          name: m.displayName || id,
          description: m.description || '',
          inputLimit: m.inputTokenLimit,
          outputLimit: m.outputTokenLimit,
          recommended: RECOMMENDED_MODELS.some(r => id.startsWith(r)),
        };
      });
      // Sort: recommended first, then alphabetical
      all.sort((a, b) => {
        if (a.recommended !== b.recommended) return a.recommended ? -1 : 1;
        return a.id.localeCompare(b.id);
      });
      return all;
    } catch {
      return [];
    }
  }

  return { extractText, extractTextBatch, analyzeWords, translateSentences, testApiKey, testModel, listModels, call };
})();
