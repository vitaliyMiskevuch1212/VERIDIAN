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
  