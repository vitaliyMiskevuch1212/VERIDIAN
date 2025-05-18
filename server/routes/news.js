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
  // Middle East
  'ir': 'Middle East', 'iq': 'Middle East', 'sy': 'Middle East', 'sa': 'Middle East', 'ye': 'Middle East',
  'lb': 'Middle East', 'ps': 'Middle East', 'il': 'Middle East', 'jo': 'Middle East', 'ae': 'Middle East',
  'om': 'Middle East', 'bh': 'Middle East', 'kw': 'Middle East', 'qa': 'Middle East',
  // Europe
  'ua': 'Europe', 'ru': 'Europe', 'pl': 'Europe', 'de': 'Europe', 'fr': 'Europe', 'gb': 'Europe',
  'it': 'Europe', 'es': 'Europe', 'pt': 'Europe', 'nl': 'Europe', 'be': 'Europe', 'se': 'Europe',
  'no': 'Europe', 'fi': 'Europe', 'dk': 'Europe', 'at': 'Europe', 'ch': 'Europe', 'gr': 'Europe',
  'tr': 'Europe', 'ro': 'Europe', 'hu': 'Europe', 'cz': 'Europe', 'bg': 'Europe', 'rs': 'Europe',
  'hr': 'Europe', 'sk': 'Europe', 'ie': 'Europe', 'lt': 'Europe', 'lv': 'Europe', 'ee': 'Europe',
  'ba': 'Europe', 'al': 'Europe', 'md': 'Europe', 'by': 'Europe', 'ge': 'Europe', 'am': 'Europe', 'az': 'Europe',
  // Asia-Pacific
  'cn': 'Asia-Pacific', 'jp': 'Asia-Pacific', 'kr': 'Asia-Pacific', 'tw': 'Asia-Pacific', 'in': 'Asia-Pacific',
  'ph': 'Asia-Pacific', 'id': 'Asia-Pacific', 'bd': 'Asia-Pacific', 'au': 'Asia-Pacific', 'nz': 'Asia-Pacific',
  'kp': 'Asia-Pacific', 'pk': 'Asia-Pacific', 'af': 'Asia-Pacific', 'mm': 'Asia-Pacific', 'th': 'Asia-Pacific',
  'vn': 'Asia-Pacific', 'my': 'Asia-Pacific', 'sg': 'Asia-Pacific', 'kh': 'Asia-Pacific', 'la': 'Asia-Pacific',
  'np': 'Asia-Pacific', 'lk': 'Asia-Pacific', 'mn': 'Asia-Pacific', 'kg': 'Asia-Pacific', 'tj': 'Asia-Pacific',
  'uz': 'Asia-Pacific', 'tm': 'Asia-Pacific', 'kz': 'Asia-Pacific',
  // Americas
  'us': 'Americas', 'br': 'Americas', 'mx': 'Americas', 'ar': 'Americas', 've': 'Americas', 'co': 'Americas',
  'ca': 'Americas', 'cl': 'Americas', 'pe': 'Americas', 'ec': 'Americas', 'cu': 'Americas', 'ht': 'Americas',
  'do': 'Americas', 'bo': 'Americas', 'py': 'Americas', 'uy': 'Americas', 'pa': 'Americas', 'cr': 'Americas',
  'gt': 'Americas', 'hn': 'Americas', 'sv': 'Americas', 'ni': 'Americas',
  // Africa
  'ng': 'Africa', 'sd': 'Africa', 'ss': 'Africa', 'et': 'Africa', 'cd': 'Africa', 'so': 'Africa',
  'ly': 'Africa', 'eg': 'Africa', 'ke': 'Africa', 'za': 'Africa', 'gh': 'Africa', 'tz': 'Africa',
  'mz': 'Africa', 'ma': 'Africa', 'dz': 'Africa', 'tn': 'Africa', 'cm': 'Africa', 'ml': 'Africa',
  'bf': 'Africa', 'ne': 'Africa', 'td': 'Africa', 'sn': 'Africa', 'rw': 'Africa', 'ug': 'Africa',
  'zw': 'Africa', 'ao': 'Africa', 'ci': 'Africa',
};

const COUNTRY_KEYWORDS = [
  // ── Major Powers ──
  { code: 'us', regex: /\b(usa|u\.s\.|united states|americans?|biden|trump|washington|pentagon|white house|capitol hill|congress|cia|fbi|new york|california|texas|florida|hawaii|alaska|dhs|homeland)/i },
  { code: 'ru', regex: /\b(russia|russians?|putin|moscow|kremlin|siberia|st\. petersburg|lavrov|wagner|chechnya|dagestan|ural)/i },
  { code: 'cn', regex: /\b(china|chinese|beijing|xi jinping|shanghai|guangdong|shenzhen|hong kong|pla|tibet|xinjiang|uyghur|chengdu|nanjing|wuhan)\b/i },
  { code: 'gb', regex: /\b(u\.k\.|britain|british|england|english|london|scotland|wales|sunak|starmer|downing st|westminster|oxford|cambridge|manchester|birmingham|northern ireland)/i },
  { code: 'fr', regex: /\b(france|french|paris|macron|lyon|marseille|toulouse|bastille|elysee)\b/i },
  { code: 'de', regex: /\b(germany|german|berlin|scholz|munich|frankfurt|hamburg|merkel|bundeswehr|bundestag)\b/i },
  { code: 'jp', regex: /\b(japan|japanese|tokyo|osaka|kishida|hokkaido|okinawa|kyoto|fukushima|hiroshima|nagasaki)\b/i },

  // ── Middle East ──
  { code: 'ir', regex: /\b(iran|iranians?|tehran|khamenei|isfahan|persian gulf|irgc|hormuz)/i },
  { code: 'il', regex: /\b(israel|israelis?|tel aviv|netanyahu|gaza|idf|west bank|hamas|mossad|jerusalem|haifa|negev)/i },
  { code: 'sa', regex: /\b(saudi|riyadh|mbs|jeddah|mecca|medina|aramco)\b/i },
  { code: 'ye', regex: /\b(yemen|yemeni|houthi|sanaa|aden|red sea)\b/i },
  { code: 'iq', regex: /\b(iraq|iraqi|baghdad|mosul|basra|kurdistan|erbil)\b/i },
  { code: 'sy', regex: /\b(syria|syrian|damascus|aleppo|idlib|assad)\b/i },
  { code: 'lb', regex: /\b(lebanon|lebanese|beirut|hezbollah)\b/i },
  { code: 'jo', regex: /\b(jordan|jordanian|amman)\b/i },
  { code: 'ae', regex: /\b(uae|emirates|dubai|abu dhabi)\b/i },
  { code: 'om', regex: /\b(oman|omani|muscat)\b/i },
  { code: 'bh', regex: /\b(bahrain|bahraini|manama)\b/i },
  { code: 'kw', regex: /\b(kuwait|kuwaiti)\b/i },
  { code: 'qa', regex: /\b(qatar|qatari|doha)\b/i },
  { code: 'ps', regex: /\b(palestin|ramallah|west bank|fatah)\b/i },

  // ── Europe ──
  { code: 'ua', regex: /\b(ukraine|ukrainian|kyiv|zelensky|donbas|kharkiv|odessa|mariupol|zaporizhzhia|crimea)\b/i },
  { code: 'pl', regex: /\b(poland|polish|warsaw|krakow)\b/i },
  { code: 'it', regex: /\b(italy|italian|rome|milan|naples|meloni|sicily|vatican|pope)\b/i },
  { code: 'es', regex: /\b(spain|spanish|madrid|barcelona|catalonia|sanchez)\b/i },
  { code: 'pt', regex: /\b(portugal|portuguese|lisbon)\b/i },
  { code: 'nl', regex: /\b(netherlands|dutch|amsterdam|hague|rotterdam)\b/i },
  { code: 'be', regex: /\b(belgium|belgian|brussels)\b/i },
  { code: 'se', regex: /\b(sweden|swedish|stockholm)\b/i },
  { code: 'no', regex: /\b(norway|norwegian|oslo)\b/i },
  { code: 'fi', regex: /\b(finland|finnish|helsinki)\b/i },
  { code: 'dk', regex: /\b(denmark|danish|copenhagen)\b/i },
  { code: 'at', regex: /\b(austria|austrian|vienna)\b/i },
  { code: 'ch', regex: /\b(switzerland|swiss|geneva|zurich|bern)\b/i },
  { code: 'gr', regex: /\b(greece|greek|athens)\b/i },
  { code: 'tr', regex: /\b(turkey|turkish|ankara|istanbul|erdogan|bosphorus)\b/i },
  { code: 'ro', regex: /\b(romania|romanian|bucharest)\b/i },
  { code: 'hu', regex: /\b(hungary|hungarian|budapest|orban)\b/i },
  { code: 'cz', regex: /\b(czech|prague)\b/i },
  { code: 'bg', regex: /\b(bulgaria|bulgarian|sofia)\b/i },
  { code: 'rs', regex: /\b(serbia|serbian|belgrade)\b/i },
  { code: 'hr', regex: /\b(croatia|croatian|zagreb)\b/i },
  { code: 'sk', regex: /\b(slovakia|slovak|bratislava)\b/i },
  { code: 'ie', regex: /\b(ireland|irish|dublin)\b/i },
  { code: 'lt', regex: /\b(lithuania|lithuanian|vilnius)\b/i },
  { code: 'lv', regex: /\b(latvia|latvian|riga)\b/i },
  { code: 'ee', regex: /\b(estonia|estonian|tallinn)\b/i },
  { code: 'ba', regex: /\b(bosnia|bosnian|sarajevo)\b/i },
  { code: 'al', regex: /\b(albania|albanian|tirana)\b/i },
  { code: 'md', regex: /\b(moldova|moldovan|chisinau|transnistria)\b/i },
  { code: 'by', regex: /\b(belarus|belarusian|minsk|lukashenko)\b/i },
  { code: 'ge', regex: /\b(georgia|georgian|tbilisi)\b/i },
  { code: 'am', regex: /\b(armenia|armenian|yerevan)\b/i },
  { code: 'az', regex: /\b(azerbaijan|azerbaijani|baku|nagorno.karabakh)\b/i },

  // ── Asia-Pacific ──
  { code: 'in', regex: /\b(india|indian|delhi|modi|mumbai|kolkata|chennai|bangalore|hyderabad|kashmir)\b/i },
  { code: 'tw', regex: /\b(taiwan|taiwanese|taipei)\b/i },
  { code: 'kr', regex: /\b(south korea|korean|seoul|busan|samsung|yoon)\b/i },
  { code: 'kp', regex: /\b(north korea|pyongyang|kim jong)\b/i },
  { code: 'pk', regex: /\b(pakistan|pakistani|islamabad|karachi|lahore|sharif)\b/i },
  { code: 'af', regex: /\b(afghanistan|afghan|kabul|taliban|kandahar)\b/i },
  { code: 'bd', regex: /\b(bangladesh|bangladeshi|dhaka|chittagong)\b/i },
  { code: 'mm', regex: /\b(myanmar|burmese|burma|naypyidaw|yangon)\b/i },
  { code: 'th', regex: /\b(thailand|thai|bangkok|phuket)\b/i },
  { code: 'vn', regex: /\b(vietnam|vietnamese|hanoi|ho chi minh)\b/i },
  { code: 'ph', regex: /\b(philippines|filipino|manila|marcos|mindanao|duterte)\b/i },
  { code: 'id', regex: /\b(indonesia|indonesian|jakarta|sumatra|java|borneo|bali)\b/i },
  { code: 'my', regex: /\b(malaysia|malaysian|kuala lumpur)\b/i },
  { code: 'sg', regex: /\b(singapore|singaporean)\b/i },
  { code: 'au', regex: /\b(australia|australian|canberra|sydney|melbourne|perth)\b/i },
  { code: 'nz', regex: /\b(new zealand|wellington|auckland|kiwi)\b/i },
  { code: 'kh', regex: /\b(cambodia|cambodian|phnom penh)\b/i },
  { code: 'la', regex: /\b(laos|laotian|vientiane)\b/i },
  { code: 'np', regex: /\b(nepal|nepalese|kathmandu)\b/i },
  { code: 'lk', regex: /\b(sri lanka|colombo|sinhalese|tamil)\b/i },
  { code: 'mn', regex: /\b(mongolia|mongolian|ulaanbaatar)\b/i },
  { code: 'kg', regex: /\b(kyrgyzstan|bishkek)\b/i },
  { code: 'tj', regex: /\b(tajikistan|dushanbe)\b/i },
  { code: 'uz', regex: /\b(uzbekistan|tashkent)\b/i },
  { code: 'tm', regex: /\b(turkmenistan|ashgabat)\b/i },
  { code: 'kz', regex: /\b(kazakhstan|kazakh|astana|almaty)\b/i },

  // ── Americas ──
  { code: 'ca', regex: /\b(canada|canadian|ottawa|toronto|montreal|vancouver|trudeau)\b/i },
  { code: 'mx', regex: /\b(mexico|mexican|mexico city|tijuana|juarez|cartel)\b/i },
  { code: 'br', regex: /\b(brazil|brazilian|brasilia|sao paulo|rio de janeiro|lula|bolsonaro|amazon)\b/i },
  { code: 'ar', regex: /\b(argentina|argentine|buenos aires|milei)\b/i },
  { code: 've', regex: /\b(venezuela|venezuelan|caracas|maduro)\b/i },
  { code: 'co', regex: /\b(colombia|colombian|bogota|medellin)\b/i },
  { code: 'cl', regex: /\b(chile|chilean|santiago)\b/i },
  { code: 'pe', regex: /\b(peru|peruvian|lima)\b/i },
  { code: 'ec', regex: /\b(ecuador|ecuadorian|quito)\b/i },
  { code: 'cu', regex: /\b(cuba|cuban|havana)\b/i },
  { code: 'ht', regex: /\b(haiti|haitian|port.au.prince)\b/i },
  { code: 'do', regex: /\b(dominican republic|santo domingo)\b/i },
  { code: 'bo', regex: /\b(bolivia|bolivian|la paz)\b/i },
  { code: 'py', regex: /\b(paraguay|paraguayan|asuncion)\b/i },
  { code: 'uy', regex: /\b(uruguay|uruguayan|montevideo)\b/i },
  { code: 'pa', regex: /\b(panama|panamanian|panama canal)\b/i },
  { code: 'cr', regex: /\b(costa rica|costa rican|san jose)\b/i },
  { code: 'gt', regex: /\b(guatemala|guatemalan)\b/i },
  { code: 'hn', regex: /\b(honduras|honduran|tegucigalpa)\b/i },
  { code: 'sv', regex: /\b(el salvador|salvadoran|bukele)\b/i },
  { code: 'ni', regex: /\b(nicaragua|nicaraguan|managua|ortega)\b/i },

  // ── Africa ──
  { code: 'ng', regex: /\b(nigeria|nigerian|lagos|abuja)\b/i },
  { code: 'sd', regex: /\b(sudan|sudanese|khartoum)\b/i },
  { code: 'ss', regex: /\b(south sudan|juba)\b/i },
  { code: 'et', regex: /\b(ethiopia|ethiopian|addis ababa|tigray)\b/i },
  { code: 'eg', regex: /\b(egypt|egyptian|cairo|suez|sisi)\b/i },
  { code: 'ly', regex: /\b(libya|libyan|tripoli|benghazi)\b/i },
  { code: 'cd', regex: /\b(congo|congolese|kinshasa|drc|kivu)\b/i },
  { code: 'so', regex: /\b(somalia|somali|mogadishu|al.shabaab)\b/i },
  { code: 'ke', regex: /\b(kenya|kenyan|nairobi|mombasa)\b/i },
  { code: 'za', regex: /\b(south africa|johannesburg|cape town|pretoria|mandela)\b/i },
  { code: 'gh', regex: /\b(ghana|ghanaian|accra)\b/i },
  { code: 'tz', regex: /\b(tanzania|tanzanian|dar es salaam)\b/i },
  { code: 'mz', regex: /\b(mozambique|mozambican|maputo)\b/i },
  { code: 'ma', regex: /\b(morocco|moroccan|rabat|casablanca|sahara)\b/i },
  { code: 'dz', regex: /\b(algeria|algerian|algiers)\b/i },
  { code: 'tn', regex: /\b(tunisia|tunisian|tunis)\b/i },
  { code: 'cm', regex: /\b(cameroon|cameroonian|yaounde)\b/i },
  { code: 'ml', regex: /\b(mali|malian|bamako)\b/i },
  { code: 'bf', regex: /\b(burkina faso|ouagadougou)\b/i },
  { code: 'ne', regex: /\b(niger|niamey)\b/i },
  { code: 'td', regex: /\b(chad|chadian|ndjamena)\b/i },
  { code: 'sn', regex: /\b(senegal|senegalese|dakar)\b/i },
  { code: 'rw', regex: /\b(rwanda|rwandan|kigali|kagame)\b/i },
  { code: 'ug', regex: /\b(uganda|ugandan|kampala|museveni)\b/i },
  { code: 'zw', regex: /\b(zimbabwe|zimbabwean|harare|mnangagwa)\b/i },
  { code: 'ao', regex: /\b(angola|angolan|luanda)\b/i },
  { code: 'ci', regex: /\b(ivory coast|cote d.ivoire|abidjan)\b/i },

  // ── Organizations / Geopolitical Entities ──
  { code: 'un', regex: /\bunited nations\b|\bsecurity council\b/i },
];

function detectCountry(title) {
  if (!title) return 'un';
  for (const { code, regex } of COUNTRY_KEYWORDS) {
    if (regex.test(title)) return code;
  }
  return 'un';
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

// Helper route to force clear cache
router.get('/clear', (req, res) => {
  cache.del('news');
  res.json({ message: 'News cache cleared' });
});

module.exports = router;
