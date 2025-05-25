const express = require('express');
const router = express.Router();
const axios = require('axios');
const cache = require('../services/cacheService');

const DEMO_CYBER = [
  { lat: 55.75, lng: 37.62, type: 'botnet',  severity: 'CRITICAL', host: '185.x.x.x', country: 'Russia' },
  { lat: 39.90, lng: 116.40, type: 'malware', severity: 'HIGH',     host: '42.x.x.x',  country: 'China' },
  { lat: 35.69, lng: 51.39, type: 'botnet',  severity: 'HIGH',     host: '91.x.x.x',  country: 'Iran' },
  { lat: 37.57, lng: 126.98, type: 'malware', severity: 'CRITICAL', host: '175.x.x.x', country: 'South Korea' },
  { lat: -23.55, lng: -46.63, type: 'botnet',  severity: 'MEDIUM',  host: '200.x.x.x', country: 'Brazil' },
  { lat: 28.61, lng: 77.21, type: 'malware', severity: 'HIGH',     host: '103.x.x.x', country: 'India' },
  { lat: 48.86, lng: 2.35,  type: 'botnet',  severity: 'MEDIUM',   host: '82.x.x.x',  country: 'France' },
  { lat: 52.52, lng: 13.41, type: 'botnet',  severity: 'MEDIUM',   host: '78.x.x.x',  country: 'Germany' },
  { lat: 40.71, lng: -74.01, type: 'malware', severity: 'HIGH',    host: '198.x.x.x', country: 'United States' },
  { lat: 1.35,  lng: 103.82, type: 'botnet',  severity: 'HIGH',    host: '159.x.x.x', country: 'Singapore' },
  { lat: -33.87, lng: 151.21, type: 'malware', severity: 'MEDIUM', host: '203.x.x.x', country: 'Australia' },
  { lat: 50.45, lng: 30.52, type: 'botnet',  severity: 'CRITICAL', host: '93.x.x.x',  country: 'Ukraine' },
];

/**
 * Fetch C2 botnet servers from abuse.ch Feodo Tracker
 */
async function fetchFeodoTracker() {
  try {
    const res = await axios.get('https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.json', { timeout: 10000 });
    const data = Array.isArray(res.data) ? res.data : [];
    // Take first 20 and geolocate
    const threats = [];
    for (const entry of data.slice(0, 15)) {
      const ip = entry.ip_address || entry.ip || '';
      if (!ip) continue;
      try {
        const geo = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 3000 });
        threats.push({
          lat: geo.data?.latitude || 0,
          lng: geo.data?.longitude || 0,
          type: 'botnet',
          severity: 'HIGH',
          host: ip.replace(/\d+\.\d+$/, 'x.x'),
          country: geo.data?.country_name || 'Unknown'
        });
      } catch (e) { /* skip */ }
    }
    return threats;
  } catch (err) {
    console.warn('[cyber] Feodo Tracker fetch failed:', err.message);
    return [];
  }
}

/**
 * Fetch malware distribution from URLhaus
 */
async function fetchURLhaus() {
  try {
    console.log('[cyber] Fetching URLhaus...');

    const res = await axios.get(
      'https://urlhaus-api.abuse.ch/v1/urls/recent/',
      {
        headers: { 'Auth-Key': process.env.URLHAUS_API_KEY },
        timeout: 10000
      }
    );

    console.log('[cyber] URLhaus query_status:', res.data?.query_status);
    console.log('[cyber] URLhaus urls count:', res.data?.urls?.length);

    const urls = res.data?.urls || [];

    const ipRegex = /^\d{1,3}(\.\d{1,3}){3}$/;
    const uniqueHosts = [];
    const seen = new Set();

    for (const entry of urls) {
      const host = entry.host || '';
      if (!host || seen.has(host)) continue;
      seen.add(host);

      // Accept both IPs and domains
      uniqueHosts.push({ host, threat: entry.threat });

      if (uniqueHosts.length >= 20) break; // ✅ increased to 20
    }

    console.log('[cyber] Unique hosts found:', uniqueHosts.length);
    if (uniqueHosts.length === 0) return [];

    // Separate IPs and domains
    const ipHosts = uniqueHosts.filter(e => ipRegex.test(e.host));
    const domainHosts = uniqueHosts.filter(e => !ipRegex.test(e.host));

    console.log('[cyber] IPs:', ipHosts.length, '| Domains:', domainHosts.length);

    const threats = [];

    // ✅ Batch geo for IPs
    if (ipHosts.length > 0) {
      const batchRes = await axios.post(
        'http://ip-api.com/batch',
        ipHosts.map(e => ({ query: e.host, fields: 'status,country,countryCode,lat,lon,query' })),
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 8000
        }
      );

      for (let i = 0; i < batchRes.data.length; i++) {
        const geo = batchRes.data[i];
        const meta = ipHosts[i];
        if (geo.status !== 'success') continue;

        threats.push({
          lat: geo.lat || 0,
          lng: geo.lon || 0,
          type: 'malware',
          severity: meta.threat === 'malware_download' ? 'CRITICAL' : 'HIGH',
          host: meta.host.replace(/(\d+\.\d+)$/, 'x.x'),
          country: geo.country,
          countryCode: geo.countryCode
        });
      }
    }

    // ✅ Geo for domains via DNS-based lookup
    for (const entry of domainHosts.slice(0, 5)) {
      try {
        const geo = await axios.get(
          `http://ip-api.com/json/${entry.host}?fields=status,country,countryCode,lat,lon`,
          { timeout: 3000 }
        );
        if (geo.data?.status !== 'success') continue;

        threats.push({
          lat: geo.data.lat || 0,
          lng: geo.data.lon || 0,
          type: 'malware',
          severity: entry.threat === 'malware_download' ? 'CRITICAL' : 'HIGH',
          host: entry.host.split('.').slice(-2).join('.'), // mask subdomain
          country: geo.data.country,
          countryCode: geo.data.countryCode
        });
      } catch (e) { /* skip */ }
    }

    console.log('[cyber] URLhaus threats built:', threats.length);
    return threats;

  } catch (err) {
    console.warn('[cyber] URLhaus fetch failed:', err.message);
    console.warn('[cyber] URLhaus error status:', err.response?.status);
    console.warn('[cyber] URLhaus error data:', err.response?.data);
    return [];
  }
}

// GET /api/cyber
router.get('/', async (req, res) => {
  try {
    const cached = cache.get('cyber');
    if (cached) return res.json(cached);

    const [feodo, urlhaus] = await Promise.allSettled([fetchFeodoTracker(), fetchURLhaus()]);

    const threats = [
      ...(feodo.status === 'fulfilled' ? feodo.value : []),
      ...(urlhaus.status === 'fulfilled' ? urlhaus.value : []),
    ];

    const result = threats.length > 0 ? threats : DEMO_CYBER;

    cache.set('cyber', result, 10 * 60 * 1000); // 10 min cache
    res.json(result);
  } catch (err) {
    console.error('[cyber] Error:', err.message);
    res.json(DEMO_CYBER);
  }
});

module.exports = router;
