const express = require('express');
const router = express.Router();
const axios = require('axios');
const cache = require('../services/cacheService');
const groqService = require('../services/groqService');

let yahooFinance;
try {
  const yf = require('yahoo-finance2');
  yahooFinance = yf.default || yf; // ✅ handles both module formats
  console.log('[finance] yahoo-finance2 loaded OK');
} catch (e) {
  console.warn('[finance] yahoo-finance2 not available:', e.message);
}

const DEMO_QUOTES = {
  AAPL:  { symbol: 'AAPL',  price: 178.52, change: 1.24,  volume: '52.3M', name: 'Apple Inc.' },
  MSFT:  { symbol: 'MSFT',  price: 415.60, change: -0.87, volume: '21.1M', name: 'Microsoft Corp.' },
  GOOGL: { symbol: 'GOOGL', price: 141.80, change: 2.15,  volume: '18.7M', name: 'Alphabet Inc.' },
  TSLA:  { symbol: 'TSLA',  price: 248.42, change: -3.21, volume: '95.2M', name: 'Tesla Inc.' },
  AMZN:  { symbol: 'AMZN',  price: 185.07, change: 0.93,  volume: '34.5M', name: 'Amazon.com' },
  NVDA:  { symbol: 'NVDA',  price: 875.28, change: 4.56,  volume: '42.8M', name: 'NVIDIA Corp.' },
};

const DEMO_CRYPTO = [
  { symbol: 'BTC', name: 'Bitcoin',  price: 67432.18, change: 2.34 },
  { symbol: 'ETH', name: 'Ethereum', price: 3456.72,  change: -1.05 },
  { symbol: 'SOL', name: 'Solana',   price: 142.89,   change: 5.67 },
  { symbol: 'XRP', name: 'XRP',      price: 0.6234,   change: -0.43 },
];

const DEMO_FOREX = [
  { pair: 'USD/JPY', rate: 154.23, change: 0.12, flags: ['us', 'jp'] },
  { pair: 'EUR/USD', rate: 1.0834, change: -0.08, flags: ['eu', 'us'] },
  { pair: 'GBP/USD', rate: 1.2645, change: 0.15, flags: ['gb', 'us'] },
];

const DEMO_COMMODITIES = [
  { name: 'Gold',        symbol: 'GC=F',  price: 2342.50, change: 0.87 },
  { name: 'Crude Oil',   symbol: 'CL=F',  price: 78.34,   change: -1.23 },
  { name: 'Natural Gas', symbol: 'NG=F',  price: 2.156,   change: 2.45 },
];

function generateSparkline(basePrice) {
  const data = [];
  let price = basePrice * (0.95 + Math.random() * 0.05);
  for (let i = 6; i >= 0; i--) {
    price = price * (0.98 + Math.random() * 0.04);
    data.push({ day: i, price: parseFloat(price.toFixed(2)) });
  }
  data.push({ day: 0, price: basePrice });
  return data.reverse();
}

// ✅ 1. STATIC ROUTES FIRST

// GET /api/finance
router.get('/', async (req, res) => {
  try {
    const cached = cache.get('finance_overview');
    if (cached) return res.json(cached);

    let fearGreed = { value: 45, label: 'Fear' };
    try {
      const fgRes = await axios.get('https://api.alternative.me/fng/?limit=1', { timeout: 5000 });
      const fgData = fgRes.data?.data?.[0];
      if (fgData) fearGreed = { value: parseInt(fgData.value), label: fgData.value_classification };
    } catch (e) { /* use default */ }

    let crypto = DEMO_CRYPTO;
    try {
      const cgRes = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: { ids: 'bitcoin,ethereum,solana,ripple', vs_currencies: 'usd', include_24hr_change: 'true' },
        timeout: 5000
      });
      const d = cgRes.data;
      if (d.bitcoin) {
        crypto = [
          { symbol: 'BTC', name: 'Bitcoin',  price: d.bitcoin?.usd || 0,  change: d.bitcoin?.usd_24h_change || 0 },
          { symbol: 'ETH', name: 'Ethereum', price: d.ethereum?.usd || 0, change: d.ethereum?.usd_24h_change || 0 },
          { symbol: 'SOL', name: 'Solana',   price: d.solana?.usd || 0,   change: d.solana?.usd_24h_change || 0 },
          { symbol: 'XRP', name: 'XRP',      price: d.ripple?.usd || 0,   change: d.ripple?.usd_24h_change || 0 },
        ];
      }
    } catch (e) { /* use demo */ }

    const result = { crypto, forex: DEMO_FOREX, commodities: DEMO_COMMODITIES, fearGreed };
    cache.set('finance_overview', result, 3 * 60 * 1000);
    res.json(result);
  } catch (err) {
    console.error('[finance] Overview error:', err.message);
    res.json({ crypto: DEMO_CRYPTO, forex: DEMO_FOREX, commodities: DEMO_COMMODITIES, fearGreed: { value: 45, label: 'Fear' } });
  }
});

// GET /api/finance/predictions
router.get('/predictions', async (req, res) => {
  try {
    const cached = cache.get('finance_predictions');
    if (cached) return res.json(cached);

    const news = cache.get('news') || [];
    const events = cache.get('events') || [];
    const flights = cache.get('flights') || [];
    const cyber = cache.get('cyber') || [];
    const financeOverview = cache.get('finance_overview') || {};

    const titles = news.slice(0, 15).map(n => n.title);
    const criticalEvents = events.filter(e => e.severity === 'CRITICAL').map(e => `[${e.country || 'Unknown'}] ${e.title}`);
    const highEvents = events.filter(e => e.severity === 'HIGH').map(e => e.title).slice(0, 5);

    const cryptoContext = financeOverview?.crypto
      ? financeOverview.crypto.map(c => `${c.symbol}: $${c.price?.toLocaleString()} (${c.change >= 0 ? '+' : ''}${c.change?.toFixed(2)}%)`).join(', ')
      : '';
    const fearGreed = financeOverview?.fearGreed
      ? `Fear & Greed: ${financeOverview.fearGreed.value} (${financeOverview.fearGreed.label})`
      : '';

    const prompt = `You are VERIDIAN Forecast AI. Generate LIVE prediction questions based on ACTUAL current events.

TODAY'S DATE: ${new Date().toISOString().split('T')[0]}

=== LIVE INTELLIGENCE FEEDS ===

CRITICAL EVENTS (${criticalEvents.length}):
${criticalEvents.length > 0 ? criticalEvents.map(e => `  - ${e}`).join('\n') : '  - None active'}

HIGH EVENTS (${highEvents.length}):
${highEvents.length > 0 ? highEvents.map(e => `  - ${e}`).join('\n') : '  - None active'}

TOP NEWS:
${titles.slice(0, 10).map(t => `  - ${t}`).join('\n') || '  - No headlines'}

MILITARY: ${flights.length} aircraft tracked, ${flights.filter(f => f.isNearConflict).length} near conflict zones
CYBER: ${cyber.length} threat nodes, ${cyber.filter(c => c.severity === 'CRITICAL').length} critical
MARKETS: ${cryptoContext || 'N/A'} | ${fearGreed || 'N/A'}

=== YOUR TASK ===
Create 5 prediction questions that are DIRECTLY about the specific live events above.

Return JSON only:
{
  "predictions": [
    {
      "question": "Specific prediction question referencing a live event above",
      "category": "MIL|ECON|POL|TECH|CYBER",
      "probability": <0-100>,
      "sparkline": [7 integers showing probability trend over 7 days],
      "sentiment": { "yes": <percent>, "no": <percent> },
      "daysRemaining": <integer>,
      "reasoning": "1 sentence explaining why"
    }
  ],
  "marketStatus": "BULLISH|BEARISH",
  "marketReasoning": "1-2 sentence explanation"
}`;

    let predictions = [];
    let marketStatus = 'BEARISH';
    let marketReasoning = '';

    try {
      const aiRes = await groqService.generateAI(prompt);
      if (aiRes) {
        predictions = Array.isArray(aiRes.predictions) ? aiRes.predictions : (Array.isArray(aiRes) ? aiRes : []);
        marketStatus = ['BULLISH', 'BEARISH'].includes(aiRes.marketStatus) ? aiRes.marketStatus : 'BEARISH';
        marketReasoning = aiRes.marketReasoning || '';
      }
    } catch (e) {
      console.warn('[finance] Prediction AI failed, using fallback.');
    }

    if (predictions.length === 0) {
      predictions = [
        { question: `Will the ${criticalEvents.length} active critical events lead to broader regional escalation within 30 days?`, category: 'MIL', probability: Math.min(80, 30 + criticalEvents.length * 12), sparkline: [40,42,45,48,50,52,55], sentiment: { yes: 55, no: 45 }, daysRemaining: 30, reasoning: `Based on ${criticalEvents.length} CRITICAL events currently active.` },
        { question: `Will global cyber threat activity (${cyber.length} nodes) trigger a coordinated government response?`, category: 'CYBER', probability: 35, sparkline: [30,32,28,35,33,35,35], sentiment: { yes: 35, no: 65 }, daysRemaining: 60, reasoning: `${cyber.length} active threat nodes tracked globally.` },
        { question: `Will military flight activity near conflict zones indicate major deployment changes?`, category: 'MIL', probability: 42, sparkline: [38,40,42,44,43,42,42], sentiment: { yes: 42, no: 58 }, daysRemaining: 14, reasoning: `${flights.filter(f => f.isNearConflict).length} aircraft currently tracked near conflict zones.` }
      ];
    }

    // Market Indices
    let indices = [];
    if (yahooFinance) {
      try {
        const symbols = ['^GSPC', '^IXIC', '^DJI', '^GDAXI'];
        const names = ['S&P 500', 'NASDAQ', 'Dow Jones', 'DAX'];
        const codes = ['US', 'US', 'US', 'EU'];
        const quotes = await Promise.allSettled(symbols.map(s => yahooFinance.quote(s)));
        indices = quotes.map((q, i) => {
          if (q.status === 'fulfilled' && q.value) {
            return {
              name: names[i], code: codes[i],
              value: Math.round(q.value.regularMarketPrice || 0),
              change: parseFloat((q.value.regularMarketChangePercent || 0).toFixed(2)),
              isUp: (q.value.regularMarketChangePercent || 0) >= 0
            };
          }
          return null;
        }).filter(Boolean);
        if (indices.length > 0) console.log('[finance] Yahoo indices loaded:', indices.length);
      } catch (e) {
        console.warn('[finance] Yahoo indices failed:', e.message);
      }
    }

    if (indices.length === 0) {
      indices = [
        { name: 'S&P 500',   code: 'US', value: 5241,  change: criticalEvents.length > 3 ? -1.25 : 0.82, isUp: criticalEvents.length <= 3 },
        { name: 'NASDAQ',    code: 'US', value: 16384, change: criticalEvents.length > 3 ? -0.95 : 0.45, isUp: criticalEvents.length <= 3 },
        { name: 'Dow Jones', code: 'US', value: 39127, change: criticalEvents.length > 2 ? -0.58 : 0.18, isUp: criticalEvents.length <= 2 },
        { name: 'DAX',       code: 'EU', value: 18477, change: criticalEvents.length > 2 ? -1.05 : 0.32, isUp: criticalEvents.length <= 2 }
      ];
    }

    // Keywords
    const keywordsRaw = titles.join(' ').toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
    const stopWords = ['the', 'and', 'for', 'with', 'that', 'this', 'from', 'after', 'amid', 'over', 'says', 'said', 'new', 'been', 'more', 'into', 'about'];
    const counts = {};
    keywordsRaw.forEach(w => {
      if (w.length > 3 && !stopWords.includes(w)) counts[w] = (counts[w] || 0) + 1;
    });
    const keywords = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], i) => ({ rank: i + 1, name: name.charAt(0).toUpperCase() + name.slice(1), mentions: count * 5 + (titles.length - i) }));

    const result = {
      predictions, indices, keywords, marketStatus, marketReasoning,
      dataContext: {
        criticalEvents: criticalEvents.length,
        totalEvents: events.length,
        militaryFlights: flights.length,
        cyberThreats: cyber.length
      }
    };

    cache.set('finance_predictions', result, 10 * 60 * 1000);
    res.json(result);
  } catch (err) {
    console.error('[finance] Predictions error:', err.message);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

// ✅ 2. DYNAMIC ROUTE LAST
// GET /api/finance/:ticker
router.get('/:ticker', async (req, res) => {
  try {
    const ticker = req.params.ticker.toUpperCase();
    const cacheKey = `finance_${ticker}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    if (yahooFinance) {
      try {
        const quote = await yahooFinance.quote(ticker);
        const now = new Date();
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

        let sparkline = [];
        try {
          const hist = await yahooFinance.historical(ticker, {
            period1: weekAgo.toISOString().split('T')[0],
            period2: now.toISOString().split('T')[0],
            interval: '1d'
          });
          sparkline = hist.map(h => ({ day: h.date?.toISOString()?.split('T')[0], price: h.close }));
        } catch (e) {
          sparkline = generateSparkline(quote?.regularMarketPrice || 100);
        }

        const result = {
          symbol: ticker,
          name: quote?.longName || quote?.shortName || ticker,
          price: quote?.regularMarketPrice || 0,
          change: quote?.regularMarketChangePercent || 0,
          volume: quote?.regularMarketVolume ? (quote.regularMarketVolume / 1e6).toFixed(1) + 'M' : '0',
          sparkline
        };

        cache.set(cacheKey, result);
        return res.json(result);
      } catch (e) {
        console.warn(`[finance] yahoo-finance2 failed for ${ticker}:`, e.message);
      }
    }

    const demo = DEMO_QUOTES[ticker] || {
      symbol: ticker,
      price: 100 + Math.random() * 200,
      change: (Math.random() - 0.5) * 5,
      volume: '10.0M',
      name: ticker
    };
    demo.sparkline = generateSparkline(demo.price);
    cache.set(cacheKey, demo);
    res.json(demo);
  } catch (err) {
    console.error('[finance] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch finance data' });
  }
});

module.exports = router;