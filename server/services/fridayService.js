/**
 * fridayService.js — FRIDAY Voice Agent Brain
 * 
 * Groq LLaMA function calling + tool execution + ElevenLabs TTS
 * Multi-key rotation on both Groq and ElevenLabs for free-tier resilience.
 */
const axios = require('axios');
const cache = require('./cacheService');
const fridayBridge = require('./fridayBridge');
const { findCountry } = require('../utils/countryCoords');

// ══════════════════════════════════════════════════════════════
//  API KEY ROTATION — Groq (reuse existing keys)
// ══════════════════════════════════════════════════════════════
const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1, process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3, process.env.GROQ_API_KEY_4,
].filter(Boolean);
let groqIdx = 0;

// ══════════════════════════════════════════════════════════════
//  API KEY ROTATION — ElevenLabs (multi-account free tier)
// ══════════════════════════════════════════════════════════════
const ELEVEN_KEYS = [
  process.env.ELEVENLABS_API_KEY_1, process.env.ELEVENLABS_API_KEY_2,
  process.env.ELEVENLABS_API_KEY_3, process.env.ELEVENLABS_API_KEY_4,
  process.env.ELEVENLABS_API_KEY_5, process.env.ELEVENLABS_API_KEY_6,
]
  .map(k => k ? k.trim() : null) // Trim \r carriage returns
  .filter(k => k && k !== 'your_key_here'); // Ignore unconfigured slots

let elevenIdx = 0;

// Sarah voice — soft, professional female (available on Free Tier)
const ELEVEN_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

// ══════════════════════════════════════════════════════════════
//  CONVERSATION SESSIONS (in-memory, 30-min TTL)
// ══════════════════════════════════════════════════════════════
const sessions = new Map();
const SESSION_TTL = 30 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.lastActive > SESSION_TTL) sessions.delete(id);
  }
}, 5 * 60 * 1000);

// ══════════════════════════════════════════════════════════════
//  FRIDAY SYSTEM PROMPT
// ══════════════════════════════════════════════════════════════
const SYSTEM_PROMPT = `You are FRIDAY — the AI voice operator of VERIDIAN, a real-time geopolitical intelligence command centre. You are not a chatbot. You are an active operator with full control over the dashboard.

Your personality: precise, calm, authoritative — like a senior intelligence briefer. Short sentences. No filler. Military cadence. Confident and direct.

Your capabilities via tools:
- Fly the 3D globe to any country or region
- Open and close any dashboard panel (finance, news, sitrep, predictions, signals, flights, vessels, cyber, regions, wargame)
- Read live geopolitical events, breaking news, and intelligence feeds
- Generate AI trading signals for any ticker
- Pull military flight data, surge patterns, and conflict zone activity
- Read situation reports and country intelligence briefs

Rules:
- ALWAYS use tools to drive the UI — never just describe what you would do
- When the user asks about a country's status, intelligence, or intentions, ALWAYS call the 'get_country_brief' tool. It will automatically fly the globe and open the intelligence panel.
- When reading an intelligence brief or situation report, provide a detailed analysis of about 4 to 6 sentences (approximately 15+ seconds of speaking time).
- For simple actions (like opening a panel), keep spoken responses under 2 sentences.
- Say "VERIDIAN confirms:" before stating live data
- If data is unavailable, say "No data in the current feed" — never fabricate
- When greeting, say something like "FRIDAY online. VERIDIAN systems nominal. How can I assist?"
- Never use markdown, bullet points, or formatting — you are speaking aloud
- Use natural speech patterns. Numbers should be spoken naturally.`;

// ══════════════════════════════════════════════════════════════
//  TOOL DEFINITIONS (OpenAI function-calling format)
// ══════════════════════════════════════════════════════════════
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'fly_to_country',
      description: 'Fly the VERIDIAN 3D globe to focus on a specific country, region, or location. Use this whenever the user mentions a place.',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Country or region name' }
        },
        required: ['country']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'open_panel',
      description: 'Open a VERIDIAN dashboard panel. Panels: finance, news, sitrep, predictions, signals, flights, vessels, cyber, regions, wargame',
      parameters: {
        type: 'object',
        properties: {
          panel_name: {
            type: 'string',
            enum: ['finance', 'news', 'sitrep', 'predictions', 'signals', 'flights', 'vessels', 'cyber', 'regions', 'wargame'],
            description: 'Panel to open'
          }
        },
        required: ['panel_name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'close_all_panels',
      description: 'Close all panels and return to clean globe view.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_active_events',
      description: 'Get live geopolitical events tracked by VERIDIAN. Optionally filter by severity or country.',
      parameters: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
          country: { type: 'string', description: 'Country filter' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_news',
      description: 'Get latest intelligence news headlines. Optionally filter by topic or country.',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Topic or country to filter' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_sitrep',
      description: 'Get the global Situation Report — threat level, top threats, and market implications.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_country_brief',
      description: 'Generate deep AI intelligence brief for a country — stability score, risks, military posture, economic impact.',
      parameters: {
        type: 'object',
        properties: { country: { type: 'string' } },
        required: ['country']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_trading_signal',
      description: 'Get AI trading signal (BUY/HOLD/SELL) for a stock ticker with geopolitical reasoning.',
      parameters: {
        type: 'object',
        properties: { ticker: { type: 'string', description: 'e.g. SPY, TSLA, LMT, GLD' } },
        required: ['ticker']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_military_flights',
      description: 'Get current military flight activity — tracked aircraft, surges, conflict zone proximity.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_threat_assessment',
      description: 'Quick threat assessment for a region or globally.',
      parameters: {
        type: 'object',
        properties: {
          region: { type: 'string', description: 'Middle East, Europe, Asia-Pacific, Americas, or Africa' }
        }
      }
    }
  }
];

// ══════════════════════════════════════════════════════════════
//  TOOL EXECUTORS
// ══════════════════════════════════════════════════════════════

async function executeTool(name, args) {
  const PORT = process.env.PORT || 5000;

  switch (name) {
    case 'fly_to_country': {
      const match = findCountry(args.country);
      if (match) {
        fridayBridge.emit('friday:command', {
          action: 'FLY_TO',
          payload: { country: match.name, lat: match.lat, lng: match.lng }
        });
        return `Globe locked on ${match.name} at ${match.lat.toFixed(1)} north, ${match.lng.toFixed(1)} east.`;
      }
      return `Unable to locate ${args.country} in the coordinate database.`;
    }

    case 'open_panel': {
      fridayBridge.emit('friday:command', {
        action: 'OPEN_PANEL',
        payload: { panel: args.panel_name }
      });
      const labels = {
        finance: 'Finance and Trading Signals', news: 'Live Intelligence Feed',
        sitrep: 'Situation Report', predictions: 'AI Predictions',
        signals: 'Signal History', flights: 'Military Flight Console',
        vessels: 'Naval Vessel Tracker', cyber: 'Cyber Threat Monitor',
        regions: 'Regional Stability', wargame: 'Wargame Simulator'
      };
      return `${labels[args.panel_name] || args.panel_name} panel is now open.`;
    }

    case 'close_all_panels': {
      fridayBridge.emit('friday:command', { action: 'CLOSE_ALL', payload: {} });
      return 'All panels closed. Globe view restored.';
    }

    case 'get_active_events': {
      const events = cache.get('events') || [];
      let filtered = events;
      if (args.severity) filtered = filtered.filter(e => e.severity === args.severity);
      if (args.country) {
        const c = args.country.toLowerCase();
        filtered = filtered.filter(e =>
          (e.country || '').toLowerCase().includes(c) ||
          (e.title || '').toLowerCase().includes(c)
        );
      }
      const top = filtered.slice(0, 5);
      if (top.length === 0) return 'No events matching your criteria in the current feed.';
      const list = top.map((e, i) =>
        `${i + 1}. ${e.severity} level. ${e.title}${e.country ? ` in ${e.country}` : ''}`
      ).join('. ');
      return `Tracking ${filtered.length} matching events. Top ${top.length}: ${list}`;
    }

    case 'get_news': {
      const news = cache.get('news') || [];
      let filtered = news;
      if (args.topic) {
        const t = args.topic.toLowerCase();
        filtered = filtered.filter(n =>
          (n.title || '').toLowerCase().includes(t) ||
          (n.region || '').toLowerCase().includes(t)
        );
      }
      const breaking = filtered.filter(n => n.isBreaking).slice(0, 3);
      const top = filtered.slice(0, 5);
      let resp = '';
      if (breaking.length > 0) {
        resp += `BREAKING: ${breaking.map(n => n.title).join('. ')}. `;
      }
      if (top.length > 0) {
        resp += top.map((n, i) => `${i + 1}. ${n.title}`).join('. ');
      }
      return resp || 'No news matching your query.';
    }

    case 'get_sitrep': {
      fridayBridge.emit('friday:command', { action: 'OPEN_PANEL', payload: { panel: 'sitrep' } });
      const cached = cache.get('ai_sitrep');
      if (cached) {
        const summary = (cached.summary || '').substring(0, 600);
        return `Global threat level: ${cached.globalThreatLevel}. ${summary}`;
      }
      try {
        const r = await axios.get(`http://localhost:${PORT}/api/ai/sitrep`, { timeout: 25000 });
        const s = r.data;
        return `Global threat level: ${s.globalThreatLevel}. ${(s.summary || '').substring(0, 600)}`;
      } catch {
        const events = cache.get('events') || [];
        const crit = events.filter(e => e.severity === 'CRITICAL').length;
        return `Currently tracking ${events.length} global events. ${crit} are CRITICAL. Detailed sitrep is being generated.`;
      }
    }

    case 'get_country_brief': {
      fridayBridge.emit('friday:speaking', { text: `Generating intelligence brief for ${args.country}...` });
      // Also fly there
      const match = findCountry(args.country);
      if (match) {
        fridayBridge.emit('friday:command', {
          action: 'FLY_TO',
          payload: { country: match.name, lat: match.lat, lng: match.lng }
        });
        fridayBridge.emit('friday:command', {
          action: 'SELECT_COUNTRY',
          payload: { country: match.name }
        });
      }
      try {
        const r = await axios.post(`http://localhost:${PORT}/api/ai/brief`, {
          country: args.country
        }, { timeout: 30000 });
        const b = r.data;
        return `Intelligence brief for ${args.country}. Stability score: ${b.stabilityScore} out of 100. Outlook: ${b.outlook}. ${(b.briefText || '').substring(0, 500)}`;
      } catch {
        return `Brief generation for ${args.country} timed out. Please try again.`;
      }
    }

    case 'get_trading_signal': {
      fridayBridge.emit('friday:command', { action: 'OPEN_PANEL', payload: { panel: 'finance' } });
      try {
        const r = await axios.post(`http://localhost:${PORT}/api/ai/signal`, {
          ticker: args.ticker
        }, { timeout: 25000 });
        const s = r.data;
        return `Trading signal for ${args.ticker.toUpperCase()}: ${s.signal} at ${s.confidence} percent confidence. ${(s.reasoning || '').substring(0, 300)}`;
      } catch {
        return `Unable to generate signal for ${args.ticker}. Service temporarily unavailable.`;
      }
    }

    case 'get_military_flights': {
      fridayBridge.emit('friday:command', { action: 'OPEN_PANEL', payload: { panel: 'flights' } });
      const flights = cache.get('flights') || [];
      const surges = flights.filter(f => f.isSurge);
      const nearConflict = flights.filter(f => f.isNearConflict);
      let resp = `Tracking ${flights.length} military aircraft globally. ${surges.length} in surge formation. ${nearConflict.length} near active conflict zones.`;
      if (surges.length > 0) {
        resp += ` Surge callsigns: ${surges.slice(0, 4).map(f => f.callsign).join(', ')}.`;
      }
      return resp;
    }

    case 'get_threat_assessment': {
      const regions = cache.get('ai_regions') || [];
      if (args.region) {
        const match = regions.find(r => r.name?.toLowerCase().includes(args.region.toLowerCase()));
        if (match) {
          return `${match.name} assessment. Stability: ${match.stability} out of 100. Trend: ${match.trend}. Top threat: ${match.topThreat}. ${match.aiSummary || ''}`;
        }
      }
      const events = cache.get('events') || [];
      const crit = events.filter(e => e.severity === 'CRITICAL').length;
      const high = events.filter(e => e.severity === 'HIGH').length;
      let resp = `Global overview. ${crit} CRITICAL and ${high} HIGH severity events active.`;
      if (regions.length > 0) {
        resp += ' ' + regions.map(r => `${r.name}: stability ${r.stability}, trend ${r.trend}`).join('. ');
      }
      return resp;
    }

    default:
      return `Tool ${name} is not available.`;
  }
}

// ══════════════════════════════════════════════════════════════
//  GROQ FUNCTION-CALLING LOOP (with key rotation)
// ══════════════════════════════════════════════════════════════

async function callGroq(messages, retryCount = 0) {
  let attempts = 0;
  // Increase temperature on retries to bust deterministic cache if LLM hallucinates syntax
  const baseTemp = 0.3 + (retryCount * 0.2); 

  while (attempts < GROQ_KEYS.length && GROQ_KEYS.length > 0) {
    const idx = groqIdx % GROQ_KEYS.length;
    try {
      const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages,
          tools: TOOLS,
          tool_choice: 'auto',
          parallel_tool_calls: false,
          temperature: baseTemp,
          max_tokens: 1024,
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_KEYS[idx]}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      groqIdx = (idx + 1) % GROQ_KEYS.length;
      return res.data;
    } catch (err) {
      const isToolError = err.response?.data?.error?.code === 'tool_use_failed';
      console.warn(`[FRIDAY] Groq key ${idx + 1} failed (${err.response?.status || err.message}). ${isToolError ? 'LLM Tool Syntax Error.' : ''}`);
      
      if (isToolError && retryCount < 2) {
        console.log(`[FRIDAY] Retrying tool generation with higher temperature (${baseTemp + 0.2})...`);
        return callGroq(messages, retryCount + 1); // Retry with higher temp to bust cache
      }

      if (err.response?.status === 400 && !isToolError) {
        console.error('[FRIDAY] Groq 400 Payload Error Detail:', JSON.stringify(err.response?.data));
      }
      
      groqIdx = (idx + 1) % GROQ_KEYS.length;
      attempts++;
    }
  }
  return null;
}

async function processWithTools(messages) {
  const actionsLog = [];
  let iterations = 0;

  while (iterations < 5) {
    iterations++;
    const response = callGroq(messages);
    const data = await response;

    if (!data) {
      return { text: 'All AI systems are currently at capacity. Please try again in a moment.', actions: actionsLog };
    }

    const msg = data.choices?.[0]?.message;
    if (!msg) {
      return { text: 'No response received. Standing by.', actions: actionsLog };
    }

    // If the model wants to call tools
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      // Groq strict validation requires content not to be null, and arguments to be valid JSON
      msg.content = msg.content || "";
      for (const tc of msg.tool_calls) {
        if (!tc.function.arguments || tc.function.arguments === "null") {
          tc.function.arguments = "{}";
        }
      }
      messages.push(msg);

      for (const tc of msg.tool_calls) {
        const toolName = tc.function.name;
        let toolArgs = {};
        try { toolArgs = JSON.parse(tc.function.arguments || '{}'); } catch {}

        console.log(`[FRIDAY] Tool: ${toolName}(${JSON.stringify(toolArgs)})`);
        const result = await executeTool(toolName, toolArgs);
        actionsLog.push({ tool: toolName, args: toolArgs });

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result
        });
      }
      continue; // Loop back to get final response
    }

    // No tool calls — final response
    return { text: msg.content || 'Acknowledged.', actions: actionsLog };
  }

  return { text: 'Processing complete.', actions: actionsLog };
}

// ══════════════════════════════════════════════════════════════
//  MAIN VOICE PROCESSING ENTRY POINT
// ══════════════════════════════════════════════════════════════

async function processVoice(text, sessionId) {
  // Get or create session
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      messages: [{ role: 'system', content: SYSTEM_PROMPT }],
      lastActive: Date.now()
    });
  }

  const session = sessions.get(sessionId);
  session.lastActive = Date.now();

  // Add user message
  session.messages.push({ role: 'user', content: text });

  // Keep history bounded (system + last 20 messages)
  if (session.messages.length > 21) {
    let keep = session.messages.slice(-20);
    // Groq will throw 400 if a 'tool' message exists without a preceding 'assistant' message
    while (keep.length > 0 && keep[0].role === 'tool') {
      keep.shift();
    }
    session.messages = [session.messages[0], ...keep];
  }

  // Emit listening state
  fridayBridge.emit('friday:listening', { active: false });
  fridayBridge.emit('friday:speaking', { text: 'Processing...' });

  // Process with function calling
  const result = await processWithTools(session.messages);

  // Add assistant response to history
  session.messages.push({ role: 'assistant', content: result.text });

  // Emit speaking event
  fridayBridge.emit('friday:speaking', { text: result.text });

  return result;
}

// ══════════════════════════════════════════════════════════════
//  ELEVENLABS TTS (with multi-key rotation)
// ══════════════════════════════════════════════════════════════

async function synthesizeSpeech(text) {
  if (ELEVEN_KEYS.length === 0) {
    console.warn('[FRIDAY] No ElevenLabs keys configured — TTS unavailable');
    return null;
  }

  let attempts = 0;
  while (attempts < ELEVEN_KEYS.length) {
    const idx = elevenIdx % ELEVEN_KEYS.length;
    try {
      const res = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`,
        {
          text,
          model_id: 'eleven_turbo_v2_5'
        },
        {
          headers: {
            'xi-api-key': ELEVEN_KEYS[idx],
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          responseType: 'arraybuffer',
          timeout: 15000
        }
      );
      elevenIdx = (idx + 1) % ELEVEN_KEYS.length;
      return Buffer.from(res.data);
    } catch (err) {
      const status = err.response?.status;
      console.warn(`[FRIDAY] ElevenLabs key ${idx + 1} failed (${status || err.message}), rotating...`);
      elevenIdx = (idx + 1) % ELEVEN_KEYS.length;
      attempts++;
    }
  }

  console.error('[FRIDAY] All ElevenLabs keys exhausted');
  return null;
}

module.exports = { processVoice, synthesizeSpeech };
