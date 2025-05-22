/**
 * signalEngine.js — Automatic Event → Signal Pipeline
 * 
 * Watches for new CRITICAL events in the cache. When detected:
 * 1. Maps event region/type to likely affected tickers
 * 2. Calls Groq/Gemini AI to generate cross-correlated trading signals
 * 3. Saves signals to MongoDB SignalHistory
 * 4. Pushes signals + watchlist to all WebSocket clients in real-time
 * 
 * Rate-limited: max 5 auto-signal batches per hour, 2-min debounce
 */

const cache = require('./cacheService');
const { generateAI } = require('./groqService');

let SignalHistory;
try {
  SignalHistory = require('../models/SignalHistory');
} catch (e) { /* model unavailable */ }

// ─── Sector → Ticker Mapping ──────────────────────────────────
const SECTOR_TICKERS = {
  conflict_mideast:    ['XOM', 'LMT', 'GLD', 'BA', 'NOC'],
  conflict_europe:     ['RTX', 'LMT', 'GLD', 'TLT', 'BA'],
  conflict_asia:       ['LMT', 'GLD', 'TSM', 'NOC', 'RTX'],
  conflict_africa:     ['GLD', 'XOM', 'FCX', 'NEM', 'ITA'],
  conflict_americas:   ['GLD', 'XOM', 'LMT', 'TLT', 'SPY'],
  cyber:               ['PANW', 'CRWD', 'FTNT', 'ZS', 'NET'],
  political:           ['GLD', 'TLT', 'SPY', 'UUP', 'VIX'],
  earthquake:          ['CAT', 'GLD', 'MOS', 'SPY', 'TLT'],
  disaster:            ['CAT', 'GLD', 'MOS', 'SPY', 'TLT'],
  humanitarian:        ['GLD', 'TLT', 'SPY', 'XOM', 'LMT'],
  default:             ['SPY', 'QQQ', 'GLD', 'TLT', 'VIX'],
};

// Region detection helpers
const REGION_KEYWORDS = {
  mideast: ['iraq', 'syria', 'iran', 'yemen', 'lebanon', 'israel', 'palestine', 'saudi', 'jordan', 'oman', 'qatar', 'kuwait', 'bahrain', 'uae', 'hormuz'],
  europe:  ['ukraine', 'russia', 'poland', 'germany', 'france', 'uk', 'britain', 'romania', 'hungary', 'moldova', 'belarus', 'finland', 'sweden', 'norway'],
  asia:    ['china', 'taiwan', 'japan', 'philippines', 'india', 'north korea', 'south korea', 'australia', 'indonesia', 'vietnam', 'myanmar', 'thailand', 'pakistan', 'afghanistan'],
  africa:  ['nigeria', 'sudan', 'somalia', 'ethiopia', 'congo', 'chad', 'mali', 'libya', 'niger', 'cameroon', 'mozambique', 'kenya', 'egypt'],
  americas:['united states', 'venezuela', 'brazil', 'mexico', 'colombia', 'argentina', 'cuba', 'haiti', 'canada'],
};

function detectRegion(event) {
  const text = `${event.country || ''} ${event.title || ''}`.toLowerCase();
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some(k => text.includes(k))) return region;
  }
  return null;
}

function getTickersForEvent(event) {
  const type = (event.type || '').toLowerCase();
  const region = detectRegion(event);

  // Cyber events
  if (type === 'cyber') return SECTOR_TICKERS.cyber;

  // Conflict events — region-specific
  if (type === 'conflict') {
    if (region === 'mideast')  return SECTOR_TICKERS.conflict_mideast;
    if (region === 'europe')   return SECTOR_TICKERS.conflict_europe;
    if (region === 'asia')     return SECTOR_TICKERS.conflict_asia;
    if (region === 'africa')   return SECTOR_TICKERS.conflict_africa;
    if (region === 'americas') return SECTOR_TICKERS.conflict_americas;
    return SECTOR_TICKERS.default;
  }

  // Nature/disaster
  if (type === 'earthquake') return SECTOR_TICKERS.earthquake;
  if (type === 'disaster' || type === 'wildfire') return SECTOR_TICKERS.disaster;
  if (type === 'humanitarian') return SECTOR_TICKERS.humanitarian;
  if (type === 'political')  return SECTOR_TICKERS.political;

  return SECTOR_TICKERS.default;
}

// ─── Engine State ─────────────────────────────────────────────
let io = null;
let previousCriticalIds = new Set();
let signalBatchCount = 0;
let lastBatchHour = -1;
let lastRunTimestamp = 0;
const DEBOUNCE_MS = 2 * 60 * 1000;        // 2-minute debounce
const MAX_BATCHES_PER_HOUR = 5;
const CHECK_INTERVAL_MS = 60 * 1000;       // Check every 60 seconds

/**
 * Initialize the signal engine with Socket.IO reference
 */
function init(socketIO) {
  io = socketIO;

  // Populate initial critical event IDs so we don't fire on existing data
  const events = cache.get('events') || [];
  events.forEach(e => {
    if (e.severity === 'CRITICAL') previousCriticalIds.add(e.id);
  });


    console.log('[SignalEngine] Initialized — monitoring for CRITICAL events');
    console.log(`[SignalEngine] Known critical IDs: ${previousCriticalIds.size}`);
  
    // Start the monitoring loop
    setInterval(checkForNewCriticalEvents, CHECK_INTERVAL_MS);
  }
  
  /**
   * Core monitoring function — runs every 60 seconds
   */
  async function checkForNewCriticalEvents() {
    try {
      const now = Date.now();
  
      // Debounce check
      if (now - lastRunTimestamp < DEBOUNCE_MS) return;
  
      // Rate limit: reset counter each hour
      const currentHour = new Date().getHours();
      if (currentHour !== lastBatchHour) {
        signalBatchCount = 0;
        lastBatchHour = currentHour;
      }
      if (signalBatchCount >= MAX_BATCHES_PER_HOUR) return;
  
      // Get current events
      const events = cache.get('events') || [];
      const currentCritical = events.filter(e => e.severity === 'CRITICAL');
  
      // Find NEW critical events
      const newCritical = currentCritical.filter(e => !previousCriticalIds.has(e.id));
  
      // Update known IDs
      currentCritical.forEach(e => previousCriticalIds.add(e.id));
  
      if (newCritical.length === 0) return;
  
      console.log(`[SignalEngine] 🚨 ${newCritical.length} NEW CRITICAL event(s) detected!`);
      newCritical.forEach(e => console.log(`  → [${e.country || 'GLOBAL'}] ${e.title}`));
  
      lastRunTimestamp = now;
      signalBatchCount++;
  
      // Process the new critical events
      await generateAutoSignals(newCritical);
  
    } catch (err) {
      console.error('[SignalEngine] Check error:', err.message);
    }
  }
  
  /**
   * Generate trading signals for new CRITICAL events
   */
  async function generateAutoSignals(criticalEvents) {
    try {
      // Collect all unique tickers affected by these events
      const tickerReasons = new Map(); // ticker -> [event titles]
      criticalEvents.forEach(event => {
        const tickers = getTickersForEvent(event);
        tickers.forEach(ticker => {
          if (!tickerReasons.has(ticker)) tickerReasons.set(ticker, []);
          tickerReasons.get(ticker).push(event.title);
        });
      });
  
      // Take top 5 most-referenced tickers
      const sortedTickers = [...tickerReasons.entries()]
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 5);
  
      const tickerList = sortedTickers.map(([t]) => t);
      const triggerEventTitle = criticalEvents[0]?.title || 'CRITICAL event detected';
  
      // Gather live context
      const allEvents = cache.get('events') || [];
      const allNews = cache.get('news') || [];
      const financeOverview = cache.get('finance_overview') || {};
  
      const criticalTitles = allEvents.filter(e => e.severity === 'CRITICAL').map(e => `[${e.country || 'GLOBAL'}] ${e.title}`);
      const topNews = allNews.slice(0, 8).map(n => `[${n.severity}] ${n.title}`);
      const cryptoContext = financeOverview?.crypto
        ? financeOverview.crypto.map(c => `${c.symbol}: $${c.price?.toLocaleString()} (${c.change >= 0 ? '+' : ''}${c.change?.toFixed(2)}%)`).join(', ')
        : '';
      const fearGreed = financeOverview?.fearGreed
        ? `Fear & Greed: ${financeOverview.fearGreed.value} (${financeOverview.fearGreed.label})`
        : '';
  
      // Batch AI prompt — generate signals for all tickers at once
      const prompt = `You are VERIDIAN GeoTrade AI Signal Engine. A CRITICAL geopolitical event has just been detected. Generate immediate trading signals for the most affected assets.
  
  TODAY'S DATE: ${new Date().toISOString().split('T')[0]}
  
  === TRIGGER EVENT(S) ===
  ${criticalEvents.map(e => `🚨 [${e.severity}] [${e.country || 'GLOBAL'}] ${e.title}`).join('\n')}
  
  === FULL INTELLIGENCE CONTEXT ===
  
  ACTIVE CRITICAL EVENTS (${criticalTitles.length}):
  ${criticalTitles.map(e => `  - ${e}`).join('\n') || '  - None'}
  