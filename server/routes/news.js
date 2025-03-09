const express = require('express');
const router = express.Router();
const axios = require('axios');
const RSSParser = require('rss-parser');
const cache = require('../services/cacheService');
const groqService = require('../services/groqService');

const rssParser = new RSSParser();

const DEMO_NEWS = [
  { title: 'NATO increases eastern flank deployments amid rising tensions', source: 'Reuters', severity: 'HIGH', url: '#', publishedAt: new Date().toISOString(), iso2: 'pl', region: 'Europe', isBreaking: false },
  { title: 'Oil prices surge after OPEC announces production cuts', source: 'BBC', severity: 'MEDIUM', url: '#', publishedAt: new Date().toISOString(), iso2: 'sa', region: 'Middle East', isBreaking: false },
  { title: 'BREAKING: Major cyberattack disrupts government systems', source: 'Al Jazeera', severity: 'CRITICAL', url: '#', publishedAt: new Date().toISOString(), iso2: 'ua', region: 'Europe', isBreaking: true },
  { title: 'UN Security Council emergency session on humanitarian crisis', source: 'Reuters', severity: 'HIGH', url: '#', publishedAt: new Date().toISOString(), iso2: 'sd', region: 'Africa', isBreaking: false },
  { title: 'Taiwan strait military exercises intensify', source: 'BBC', severity: 'CRITICAL', url: '#', publishedAt: new Date().toISOString(), iso2: 'tw', region: 'Asia-Pacific', isBreaking: true },
  { title: 'European Central Bank signals emergency rate decision', source: 'NewsAPI', severity: 'MEDIUM', url: '#', publishedAt: new Date().toISOString(), iso2: 'de', region: 'Europe', isBreaking: false },
  { title: 'Massive earthquake triggers tsunami warning in Pacific', source: 'USGS', severity: 'CRITICAL', url: '#', publishedAt: new Date().toISOString(), iso2: 'jp', region: 'Asia-Pacific', isBreaking: true },
  { title: 'Venezuelan opposition alleges election fraud', source: 'Al Jazeera', severity: 'HIGH', url: '#', publishedAt: new Date().toISOString(), iso2: 've', region: 'Americas', isBreaking: false },
  { title: 'Indian military conducts cross-border operation', source: 'Reuters', severity: 'HIGH', url: '#', publishedAt: new Date().toISOString(), iso2: 'in', region: 'Asia-Pacific', isBreaking: false },
  { title: 'Libyan oil export terminals shut down amid conflict', source: 'BBC', severity: 'HIGH', url: '#', publishedAt: new Date().toISOString(), iso2: 'ly', region: 'Africa', isBreaking: false },
  { title: 'US deploys carrier group to Mediterranean Sea', source: 'Reuters', severity: 'HIGH', url: '#', publishedAt: new Date().toISOString(), iso2: 'us', region: 'Americas', isBreaking: false },
  { title: 'Iran nuclear talks collapse as deadline passes', source: 'Al Jazeera', severity: 'CRITICAL', url: '#', publishedAt: new Date().toISOString(), iso2: 'ir', region: 'Middle East', isBreaking: true },
  { title: 'Border skirmish reported between Kyrgyzstan and Tajikistan', source: 'Reuters', severity: 'HIGH', url: '#', publishedAt: new Date().toISOString(), iso2: 'kg', region: 'Asia-Pacific', isBreaking: false },
  { title: 'Naval hostilities escalate in the Red Sea', source: 'BBC', severity: 'CRITICAL', url: '#', publishedAt: new Date().toISOString(), iso2: 'ye', region: 'Middle East', isBreaking: true },
  { title: 'Artillery shelling continues in the Donbas region', source: 'Al Jazeera', severity: 'HIGH', url: '#', publishedAt: new Date().toISOString(), iso2: 'ua', region: 'Europe', isBreaking: false },
];

const RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', source: 'Al Jazeera' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', source: 'NYTimes' },
];

const SEVERITY_KEYWORDS = {
  CRITICAL: /breaking|killed|bombing|attack|explosion|war|warfare|missiles|tsunami|coup|invasion|terrorist|hostilities/i,
  HIGH: /military|armed|troops|clash|strike|sanctions|crisis|nuclear|conflict|skirmish|shelling/i,
  MEDIUM: /protest|tension|election|economy|diplomatic|trade|summit/i,
};

const REGION_MAP = {
  'ir': 'Middle East', 'iq': 'Middle East', 'sy': 'Middle East', 'sa': 'Middle East', 'ye': 'Middle East',
  'lb': 'Middle East', 'ps': 'Middle East', 'il': 'Middle East', 'jo': 'Middle East', 'ae': 'Middle East',
  'ua': 'Europe', 'ru': 'Europe', 'pl': 'Europe', 'de': 'Europe', 'fr': 'Europe', 'gb': 'Europe',
  'cn': 'Asia-Pacific', 'jp': 'Asia-Pacific', 'kr': 'Asia-Pacific', 'tw': 'Asia-Pacific', 'in': 'Asia-Pacific',
  'ph': 'Asia-Pacific', 'id': 'Asia-Pacific', 'bd': 'Asia-Pacific', 'au': 'Asia-Pacific',
  'us': 'Americas', 'br': 'Americas', 'mx': 'Americas', 'ar': 'Americas', 've': 'Americas', 'co': 'Americas',
  'ng': 'Africa', 'sd': 'Africa', 'et': 'Africa', 'cd': 'Africa', 'so': 'Africa', 'ly': 'Africa', 'eg': 'Africa',
};

const COUNTRY_KEYWORDS = {
  'us': /usa|united states|biden|washington|pentagon|white house/i,
  'ru': /russia|putin|moscow|kremlin|siberia/i,
  'ua': /ukraine|kyiv|zelensky|donbas|kharkiv/i,
  'cn': /china|beijing|xi jinping|shanghai/i,
  'ir': /iran|tehran|khameini|isfahan/i,
  'il': /israel|tel aviv|netanyahu|gaza|idf/i,
  'gb': /uk|britain|london|sunak|starmer|downing st/i,
  'de': /germany|berlin|scholz/i,
  'fr': /france|paris|macron/i,
  'in': /india|delhi|modi|mumbai/i,
  'tw': /taiwan|taipei/i,
  'kp': /north korea|pyongyang|kim jong/i,
  'sa': /saudi|riyadh|mbs/i,
  'pl': /poland|warsaw/i,
  'ye': /yemen|houthi/i,
  'un': /un|united nations|security council/i,
  'eu': /eu|european union|brussels|ecb/i,
  'nato': /nato/i,
};

function detectCountry(title) {
  for (const [code, regex] of Object.entries(COUNTRY_KEYWORDS)) {
    if (regex.test(title)) return code.toLowerCase();
  }
  return 'un'; // Unknown/UN flag
}

function scoreSeverity(title) {
  if (SEVERITY_KEYWORDS.CRITICAL.test(title)) return 'CRITICAL';
  if (SEVERITY_KEYWORDS.HIGH.test(title)) return 'HIGH';
  if (SEVERITY_KEYWORDS.MEDIUM.test(title)) return 'MEDIUM';
  return 'LOW';
}
/**
 * Fetch from NewsAPI
 */
async function fetchNewsAPI() {
    const key = process.env.NEWS_API_KEY;
    if (!key) return [];
    try {
      const res = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: { category: 'general', language: 'en', pageSize: 20, apiKey: key },
        timeout: 10000
      });
      return (res.data?.articles || []).map(a => {
        const countryCode = detectCountry(a.title || '');
        return {
          title: a.title || '',
          source: a.source?.name || 'NewsAPI',
          severity: scoreSeverity(a.title || ''),
          url: a.url || '#',
          publishedAt: a.publishedAt || new Date().toISOString(),
          iso2: countryCode,
          region: REGION_MAP[countryCode] || 'Global',
          sourceType: 'newsapi',
          isBreaking: false
        };
      });
    } catch (err) {
      console.warn('[news] NewsAPI fetch failed:', err.message);
      return [];
    }
  }
  /**
 * Fetch from RSS feeds
 */
async function fetchRSSFeeds() {
    const results = [];
    for (const feed of RSS_FEEDS) {
      try {
        const parsed = await rssParser.parseURL(feed.url);
        const items = (parsed.items || []).slice(0, 10).map(item => {
          const countryCode = detectCountry(item.title || '');
          return {
            title: item.title || '',
            source: feed.source,
            severity: scoreSeverity(item.title || ''),
            url: item.link || '#',
            publishedAt: item.pubDate || new Date().toISOString(),
            iso2: countryCode,
            region: REGION_MAP[countryCode] || 'Global',
            sourceType: 'rss',
            isBreaking: false
          };
        });
        results.push(...items);
      } catch (err) {
        console.warn(`[news] RSS ${feed.source} failed:`, err.message);
      }
    }
    return results;
  }
  /**
 * Detect BREAKING: same story across 3+ sources in 15min
 */
function detectBreaking(articles) {
    const window = 15 * 60 * 1000;
    const buckets = {};
    articles.forEach(a => {
      if (!a.title) return;
      const words = a.title.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 5);
      const key = words.sort().join('|');
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(a);
    });
    Object.values(buckets).forEach(group => {
      if (group.length >= 3) {
        const times = group.map(a => new Date(a.publishedAt).getTime());
        if (Math.max(...times) - Math.min(...times) < window) {
          group.forEach(a => { a.isBreaking = true; });
        }
      }
    });
    return articles;
  }
  /**
 * Enrich news articles with DEEP AI analysis (Groq/Gemini fallback)
 * Cross-references live events for correlation, escalation tracking, and impact analysis
 */
async function enrichWithAI(articles) {
    if (!articles || articles.length === 0) return articles;
    const subset = articles.slice(0, 15);
    const titles = subset.map(a => a.title);
  
    // Gather live events context for cross-referencing
    const liveEvents = cache.get('events') || [];
    const criticalEvents = liveEvents.filter(e => e.severity === 'CRITICAL').map(e => e.title).slice(0, 5);
  
    const prompt = `You are VERIDIAN AI Intelligence Analyst. Perform DEEP ANALYSIS on each news headline below.
  
  TODAY'S DATE: ${new Date().toISOString().split('T')[0]}
  
  === LIVE GEOPOLITICAL EVENTS FOR CROSS-REFERENCE ===
  ${criticalEvents.length > 0 ? criticalEvents.map(e => `  - ${e}`).join('\n') : '  - No critical events active'}
  
  === NEWS HEADLINES TO ANALYZE ===
  ${titles.map((t, i) => `${i + 1}. "${t}"`).join('\n')}
  
  === YOUR TASK ===
  For EACH headline, provide deep intelligence analysis. Cross-reference with the live events above to find correlations. Assign a unique tactical ID.
  
  Return a JSON object where keys are the EXACT headline strings and values are:
  {
    "tacticalId": "#INT-XXXX (unique 4-digit ID)",
    "confidence": <0-100, how confident you are in the analysis>,
    "intelSummary": "2-3 sentence deep analysis of what this event means strategically. Connect to broader geopolitical dynamics.",
    "riskLevel": "CRITICAL|HIGH|MEDIUM|LOW",
    "escalationRisk": "HIGH|MEDIUM|LOW — how likely this event escalates into something worse",
    "impactSectors": ["2-3 economic sectors most affected, e.g. Energy, Defense, Tech, Agriculture, Finance, Logistics"],
    "affectedCountries": ["2-4 country ISO2 codes affected by this event, e.g. us, ir, sa"],
    "relatedEvents": "One sentence connecting this to other headlines in the batch or live events above, or 'Isolated event' if no connection",
    "actionableInsight": "One sentence: what should a trader/analyst DO based on this news"
  }`;
  
    try {
      const aiData = await groqService.generateAI(prompt);
      if (!aiData) return articles;
      return articles.map(a => {
        const enrichment = aiData[a.title];
        if (enrichment) {
          return {
            ...a,
            tacticalId: enrichment.tacticalId || `#INT-${Math.floor(1000 + Math.random() * 9000)}`,
            confidence: enrichment.confidence || 85,
            intelSummary: enrichment.intelSummary || 'Deep analysis pending — intelligence synthesis ongoing.',
            severity: enrichment.riskLevel || a.severity,
            escalationRisk: enrichment.escalationRisk || 'MEDIUM',
            impactSectors: Array.isArray(enrichment.impactSectors) ? enrichment.impactSectors : [],
            affectedCountries: Array.isArray(enrichment.affectedCountries) ? enrichment.affectedCountries : [],
            relatedEvents: enrichment.relatedEvents || '',
            actionableInsight: enrichment.actionableInsight || ''
          };
        }
        return a;
      });
    } catch (err) {
      return articles;
    }
  }
  // GET /api/news
router.get('/', async (req, res) => {
    try {
      const cached = cache.get('news');
      if (cached) return res.json(cached);
  
      const [newsapi, rss] = await Promise.allSettled([fetchNewsAPI(), fetchRSSFeeds()]);
  
      let articles = [
        ...(newsapi.status === 'fulfilled' ? newsapi.value : []),
        ...(rss.status === 'fulfilled' ? rss.value : []),
      ];
  
      articles = detectBreaking(articles);
      articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  
      let enriched = articles.length > 0 ? articles : DEMO_NEWS;
      enriched = await enrichWithAI(enriched);
  
      cache.set('news', enriched);
      res.json(enriched);
    } catch (err) {
      res.json(DEMO_NEWS);
    }
  });