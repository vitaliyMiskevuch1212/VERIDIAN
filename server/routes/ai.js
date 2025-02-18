const express = require('express');
const router = express.Router();
const { generateAI } = require('../services/groqService');
const cache = require('../services/cacheService');

// Try to load Mongoose models (may fail if no MongoDB)
let BriefCache, SignalHistory;
try {
  BriefCache = require('../models/BriefCache');
  SignalHistory = require('../models/SignalHistory');
} catch (e) { /* models unavailable */ }

// ============================================================
//  DEMO FALLBACK DATA
// ============================================================

const DEMO_BRIEF = {
  briefText: 'This country is currently experiencing moderate geopolitical tensions driven by regional instability and economic pressures. Intelligence assessments indicate a shifting security landscape with multiple stakeholders vying for influence. Diplomatic channels remain open but progress has been limited in recent negotiations.\n\nEconomic indicators suggest vulnerability to external shocks, particularly in energy and commodity markets. Civil society organizations report increasing concerns over governance transparency and institutional integrity. Regional alliances are being tested as competing interests create friction across traditional partnerships.',
  stabilityScore: 62,
  topRisks: [
    { risk: 'Regional military escalation along contested borders', severity: 'HIGH' },
    { risk: 'Economic sanctions impact on trade flows and currency stability', severity: 'MEDIUM' },
    { risk: 'Internal political fragmentation weakening governance', severity: 'MEDIUM' }
  ],
  outlook: 'Deteriorating',
  keyActors: ['Government forces maintaining defensive posture', 'Opposition coalition pushing for reforms', 'Regional powers exerting diplomatic pressure'],
  escalationFactors: ['Military buildup near border regions', 'Breakdown of ceasefire negotiations', 'External arms supplies to proxy groups'],
  deescalationFactors: ['International mediation efforts ongoing', 'Economic incentives for peace', 'War-weary population favoring dialogue'],
  economicImpact: 'GDP growth projected to slow by 1.5-2% due to trade disruptions. Foreign direct investment declining as risk premiums increase. Energy sector faces supply chain vulnerabilities.',
  militaryPosture: 'Armed forces on heightened readiness. Border deployments increased 30% in recent weeks. Air defense systems activated in key strategic areas.',
  diplomaticStatus: 'Bilateral talks stalled. UN special envoy conducting shuttle diplomacy. Regional bloc emergency session scheduled.',
  humanitarianConcerns: 'Approximately 200,000 internally displaced persons. Aid corridors partially restricted. Medical supply shortages reported in conflict-adjacent areas.',
  topStocks: [
    { ticker: 'LMT', name: 'Lockheed Martin', reasoning: 'Increased regional defense spending drives demand for advanced weapons systems and missile defense.' },
    { ticker: 'XOM', name: 'Exxon Mobil', reasoning: 'Energy supply disruptions from regional instability push crude prices higher, benefiting major producers.' },
    { ticker: 'GLD', name: 'SPDR Gold Trust', reasoning: 'Safe haven flows accelerate as institutional investors hedge geopolitical risk exposure.' }
  ],
  affectedSectors: ['Defense', 'Energy', 'Precious Metals', 'Insurance', 'Logistics'],
  historicalParallel: 'Current dynamics bear similarities to the 2014 Crimean crisis — rapid territorial assertions combined with economic sanctions creating a protracted standoff with global market implications.',
  confidenceLevel: 72
};

const DEMO_SIGNAL = {
  signal: 'HOLD',
  confidence: 68,
  reasoning: 'Current geopolitical conditions suggest elevated uncertainty in this sector. While no immediate catalysts for significant price movement are present, ongoing regional tensions and potential policy shifts warrant a cautious approach.',
  geopoliticalFactors: ['Ongoing regional conflict creating supply chain uncertainty', 'Sanctions regime potentially expanding to new sectors', 'Diplomatic negotiations showing mixed signals'],
  riskFactors: ['Sudden escalation could trigger market-wide selloff', 'Policy reversal by major economy', 'Unexpected ceasefire could deflate defense premiums'],
  timeHorizon: 'MEDIUM',
  correlatedAssets: ['Defense ETFs (ITA, XAR)', 'Energy commodities (CL, NG)', 'Safe havens (GLD, TLT)'],
  stopLossReasoning: 'Exit if diplomatic breakthrough resolves the primary conflict driver, as this would rapidly deflate the risk premium currently priced in.'
};

// ============================================================
//  HELPER: Gather all live context from cache
// ============================================================

function gatherLiveContext(country) {
  const events = cache.get('events') || [];
  const news = cache.get('news') || [];
  const flights = cache.get('flights') || [];
  const cyber = cache.get('cyber') || [];
  const financeOverview = cache.get('finance_overview') || {};

   // Filter context relevant to this country
  const countryLower = (country || '').toLowerCase();

  const countryEvents = events.filter(e =>
    (e.country || '').toLowerCase().includes(countryLower) ||
    (e.title || '').toLowerCase().includes(countryLower)
  );

  const countryNews = news.filter(n =>
    (n.title || '').toLowerCase().includes(countryLower) ||
    (n.region || '').toLowerCase().includes(countryLower)
  );

  const countryFlights = flights.filter(f => {
    if (!f.nearConflictZone) return false;
    return f.nearConflictZone.toLowerCase().includes(countryLower) ||
           (f.origin || '').toLowerCase().includes(countryLower);
  });

  const countryCyber = cyber.filter(c =>
    (c.country || '').toLowerCase().includes(countryLower)
  );

  return {
    allEvents: events,
    allNews: news,
    allFlights: flights,
    allCyber: cyber,
    financeOverview,
    countryEvents,
    countryNews,
    countryFlights,
    countryCyber
  };
}

// ============================================================
//  POST /api/ai/brief — DEEP COUNTRY INTELLIGENCE BRIEF
// ============================================================

router.post('/brief', async (req, res) => {
  try {
    const { country, headlines } = req.body;
    if (!country) return res.status(400).json({ error: 'Country name is required' });

    // Check MongoDB cache first (with 1-hour expiry consideration)
    if (BriefCache) {
      try {
        const cached = await BriefCache.findOne({ countryName: country });
        if (cached && cached.updatedAt && (Date.now() - new Date(cached.updatedAt).getTime() < 60 * 60 * 1000)) {
          return res.json({ ...cached.toObject(), cached: true });
        }
      } catch (e) { /* DB unavailable */ }
    }

//---- GATHER ALL LIVE CONTEXT ----
    const ctx = gatherLiveContext(country);

    const eventSummary = ctx.countryEvents.length > 0
      ? ctx.countryEvents.slice(0, 10).map(e => `[${e.severity}] ${e.title} (${e.type})`).join('\n  - ')
      : 'No direct events currently tracked for this country.';

    const newsSummary = ctx.countryNews.length > 0
      ? ctx.countryNews.slice(0, 8).map(n => `[${n.severity}] ${n.title} (${n.source || 'OSINT'})`).join('\n  - ')
      : (headlines || []).slice(0, 10).join('\n  - ') || 'No recent headlines available.';

    const flightSummary = ctx.countryFlights.length > 0
      ? ctx.countryFlights.slice(0, 5).map(f => `${f.callsign} — ${f.aircraftType} at ${f.altitude}ft from ${f.origin}`).join('\n  - ')
      : 'No military flights currently detected near this country.';

    const cyberSummary = ctx.countryCyber.length > 0
      ? ctx.countryCyber.map(c => `${c.type.toUpperCase()} threat (${c.severity}) — host ${c.host}`).join('\n  - ')
      : 'No active cyber threats originating from this country.';

    const globalTensionEvents = ctx.allEvents.filter(e => e.severity === 'CRITICAL').length;
    const cryptoContext = ctx.financeOverview?.crypto
      ? ctx.financeOverview.crypto.map(c => `${c.symbol}: $${c.price?.toLocaleString()} (${c.change >= 0 ? '+' : ''}${c.change?.toFixed(2)}%)`).join(', ')
      : '';
    const fearGreedContext = ctx.financeOverview?.fearGreed
      ? `Fear & Greed Index: ${ctx.financeOverview.fearGreed.value} (${ctx.financeOverview.fearGreed.label})`
      : '';

