/**
 * groqService.js — AI provider with 4-key Groq rotation + Gemini fallback
 * 
 * Round-robin cycles through GROQ_API_KEY_1..4.
 * On 429 rate-limit, auto-increments to next key.
 * If all 4 keys exhausted, falls back to Google Gemini API.
 */
const axios = require('axios');

const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
].filter(Boolean);

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
let currentKeyIndex = 0;
/**
 * Call Groq chat completion
 */
async function callGroq(prompt, keyIndex) {
    const key = GROQ_KEYS[keyIndex];
    if (!key) throw new Error('NO_KEY');
  
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are VERIDIAN AI, a geopolitical intelligence analyst. Always respond with valid JSON only, no markdown or extra text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 2048,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
  
    const raw = res.data.choices?.[0]?.message?.content || '{}';
    return JSON.parse(raw);
  }
  
  /**
   * Call Google Gemini as fallback
   */
  async function callGemini(prompt) {
    if (!GEMINI_KEY) throw new Error('NO_GEMINI_KEY');
  
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        contents: [{ parts: [{ text: `You are VERIDIAN AI, a geopolitical intelligence analyst. Respond with valid JSON only, no markdown.\n\n${prompt}` }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048, responseMimeType: 'application/json' }
      },
      { timeout: 30000 }
    );
  
    const raw = res.data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(raw);
  }
  
  /**
   * Main entry: tries Groq keys in rotation, falls back to Gemini
   */
  async function generateAI(prompt) {
    // If no keys at all, return demo response
    if (GROQ_KEYS.length === 0 && !GEMINI_KEY) {
      console.warn('[groqService] No AI keys configured — returning demo response');
      return null;
    }
  
    // Try each Groq key starting from current index
    const exhaustedKeys = new Set();
    let attempts = 0;
  
    while (attempts < GROQ_KEYS.length && GROQ_KEYS.length > 0) {
      const idx = currentKeyIndex % GROQ_KEYS.length;
      try {
        const result = await callGroq(prompt, idx);
        // Success — advance for next call (round-robin)
        currentKeyIndex = (idx + 1) % GROQ_KEYS.length;
        return result;
      } catch (err) {
        const status = err.response?.status;
        if (status === 429) {
          console.warn(`[groqService] Key ${idx + 1} rate-limited (429), rotating to next key...`);
          exhaustedKeys.add(idx);
          currentKeyIndex = (idx + 1) % GROQ_KEYS.length;
          attempts++;
        } else {
          console.error(`[groqService] Groq key ${idx + 1} error:`, err.message);
          currentKeyIndex = (idx + 1) % GROQ_KEYS.length;
          attempts++;
        }
      }
    }