/**
 * friday.js — FRIDAY Voice Agent API Routes
 * 
 * POST /api/friday/voice — Process voice command text via Groq function calling
 * POST /api/friday/tts   — Proxy text-to-speech via ElevenLabs (avoids CORS)
 */
const express = require('express');
const router = express.Router();
const { processVoice, synthesizeSpeech } = require('../services/fridayService');

// ──────────────────────────────────────────────────
//  POST /api/friday/voice
//  Receives transcribed text, processes with FRIDAY brain
//  Returns { response, actions }
// ──────────────────────────────────────────────────
router.post('/voice', async (req, res) => {
  try {
    const { text, sessionId } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log(`[FRIDAY] Voice input: "${text}"`);

    const sid = sessionId || 'default';
    const result = await processVoice(text.trim(), sid);

    console.log(`[FRIDAY] Response: "${result.text.substring(0, 100)}..." (${result.actions.length} tools used)`);

    res.json({
      response: result.text,
      actions: result.actions
    });
  } catch (err) {
    console.error('[FRIDAY] Voice processing error:', err.message);
    res.json({
      response: 'FRIDAY encountered an error. Systems recovering. Please try again.',
      actions: []
    });
  }
});

// ──────────────────────────────────────────────────
//  POST /api/friday/tts
//  Proxies text to ElevenLabs TTS API
//  Returns audio/mpeg binary stream
// ──────────────────────────────────────────────────
router.post('/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Cap text at 1000 chars to stay within free-tier limits
    const capped = text.trim().substring(0, 1000);

    const audioBuffer = await synthesizeSpeech(capped);

    if (!audioBuffer) {
      // Fallback: return a flag telling client to use browser TTS
      return res.json({ fallback: true, text: capped });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache'
    });
    res.send(audioBuffer);
  } catch (err) {
    console.error('[FRIDAY] TTS error:', err.message);
    res.json({ fallback: true, text: req.body?.text || '' });
  }
});

// ──────────────────────────────────────────────────
//  GET /api/friday/status
//  Health check for FRIDAY subsystem
// ──────────────────────────────────────────────────
router.get('/status', (_req, res) => {
  const groqKeys = [
    process.env.GROQ_API_KEY_1, process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3, process.env.GROQ_API_KEY_4,
  ].filter(Boolean).length;

  const elevenKeys = [
    process.env.ELEVENLABS_API_KEY_1, process.env.ELEVENLABS_API_KEY_2,
    process.env.ELEVENLABS_API_KEY_3, process.env.ELEVENLABS_API_KEY_4,
    process.env.ELEVENLABS_API_KEY_5, process.env.ELEVENLABS_API_KEY_6,
  ].filter(Boolean).length;

  res.json({
    status: 'online',
    groqKeys,
    elevenLabsKeys: elevenKeys,
    ttsAvailable: elevenKeys > 0,
    sttProvider: 'Web Speech API (client-side)',
  });
});

module.exports = router;
