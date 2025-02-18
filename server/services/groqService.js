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