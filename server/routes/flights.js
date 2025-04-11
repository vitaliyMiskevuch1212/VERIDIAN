const express = require('express');
const router = express.Router();
const axios = require('axios');
const cache = require('../services/cacheService');

// ─── OpenSky OAuth2 Token Cache ────────────────────────────
let tokenCache = { token: null, expiresAt: 0 };

async function getOpenSkyToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const response = await axios.post(
    'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.OPENSKY_CLIENT_ID,
      client_secret: process.env.OPENSKY_CLIENT_SECRET,
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    }
  );

  tokenCache.token = response.data.access_token;
  tokenCache.expiresAt = Date.now() + (response.data.expires_in - 30) * 1000;
  console.log('[flights] ✅ OpenSky OAuth2 token refreshed.');
  return tokenCache.token;
}

// ─── Known Conflict Zones ──────────────────────────────────
const CONFLICT_ZONES = [
  { name: 'Ukraine',      lat: 48.38, lng: 31.17, radius: 200 },
  { name: 'Gaza',         lat: 31.35, lng: 34.31, radius: 100 },
  { name: 'Syria',        lat: 35.00, lng: 38.00, radius: 150 },
  { name: 'Yemen',        lat: 15.37, lng: 44.19, radius: 150 },
  { name: 'Sudan',        lat: 15.50, lng: 32.56, radius: 200 },
  { name: 'Somalia',      lat: 5.15,  lng: 46.20, radius: 150 },
  { name: 'Myanmar',      lat: 19.76, lng: 96.07, radius: 150 },
  { name: 'Taiwan Strait',lat: 24.00, lng: 120.00,radius: 150 },
];

// ─── Military Callsign Patterns ────────────────────────────
const MILITARY_PATTERNS = /^(RCH|EVAC|JAKE|DOOM|EPIC|IRON|VIPER|TOPCAT|HAWK|RAZOR|COBRA|DUKE|KING|REACH|FORGE|NORM|NATO|AXE|BOLT|CADDY|AE|AF|SPAR|GLIDE|DRAGON|GHOST|DEATH|BONES|U2|SR71|VENOM|REAPER|HERC|TALON)/i;

// ─── Category & Silhouette Maps ────────────────────────────
const CATEGORY_MAP = {
  0: 'Unidentified',
  2: 'Light Recon',
  3: 'Small Tactical',
  4: 'Large Strategic',
  6: 'Heavy Transport',
  7: 'High Maneuverable',
  8: 'Rotorcraft',
  13: 'UAV / Recon Drone',
};

const AIRCRAFT_SILHOUETTE = {
  0: 'unknown', 2: 'recon', 3: 'fighter', 4: 'bomber',
  6: 'transport', 7: 'fighter', 8: 'helicopter', 13: 'drone',
};

const CALLSIGN_TYPE_MAP = [
  { pattern: /^(RCH|REACH|SPAR|EVAC|GLIDE)/i, type: 'Heavy Transport',     silhouette: 'transport' },
  { pattern: /^(KING|HERC|NORM|CADDY|AF|AE)/i, type: 'Heavy Transport',     silhouette: 'transport' },
  { pattern: /^(GHOST|REAPER|U2|SR71|DEATH)/i,  type: 'UAV / Recon Drone',  silhouette: 'drone'     },
  { pattern: /^(HAWK|VIPER|COBRA|IRON|BOLT|VENOM|TALON)/i, type: 'High Maneuverable', silhouette: 'fighter' },
  { pattern: /^(DOOM|EPIC|AXE|RAZOR|BONES)/i,   type: 'High Maneuverable',  silhouette: 'fighter'   },
  { pattern: /^(NATO|DRAGON|TOPCAT|FORGE)/i,     type: 'Strategic AWACS',    silhouette: 'bomber'    },
  { pattern: /^(DUKE|JAKE)/i,                    type: 'Large Strategic',    silhouette: 'bomber'    },
];

// ─── Helper Functions ──────────────────────────────────────
function inferFromCallsign(callsign) {
  if (!callsign) return null;
  for (const entry of CALLSIGN_TYPE_MAP) {
    if (entry.pattern.test(callsign)) return entry;
  }
  return null;
}

function getAircraftType(cat, callsign) {
  if (cat != null && CATEGORY_MAP[cat] && cat !== 0) return CATEGORY_MAP[cat];
  const inferred = inferFromCallsign(callsign);
  if (inferred) return inferred.type;
  return CATEGORY_MAP[cat] || 'Multi-Role Tactical';
}

function getAircraftSilhouette(cat, callsign) {
  if (cat != null && AIRCRAFT_SILHOUETTE[cat] && cat !== 0) return AIRCRAFT_SILHOUETTE[cat];
  const inferred = inferFromCallsign(callsign);
  if (inferred) return inferred.silhouette;
  return AIRCRAFT_SILHOUETTE[cat] || 'fighter';
}

function headingToCompass(deg) {
  if (deg == null) return 'N/A';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateDestination(lat, lng, heading, speedKnots) {
  if (heading == null || speedKnots == null || speedKnots === 0) return null;
  const R = 6371;
  const d = (speedKnots * 1.852 * 2) / R;
  const brng = heading * Math.PI / 180;
  const lat1 = lat * Math.PI / 180;
  const lng1 = lng * Math.PI / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );
  return { lat: lat2 * 180 / Math.PI, lng: lng2 * 180 / Math.PI };
}

function classifyRegion(lat, lng) {
  if (lat > 25  && lat < 72  && lng > -30  && lng < 45)  return 'Europe';
  if (lat > 10  && lat < 55  && lng > 45   && lng < 150) return 'Asia';
  if (lat > 15  && lat < 72  && lng > -170 && lng < -50) return 'NorthAmerica';
  if (lat > -10 && lat < 40  && lng > 20   && lng < 65)  return 'MiddleEast';
  if (lat > -35 && lat < 15  && lng > -20  && lng < 55)  return 'Africa';
  if (lat > -55 && lat < 15  && lng > -85  && lng < -30) return 'SouthAmerica';
  if (lat > -50 && lat < 0   && lng > 100  && lng < 180) return 'Oceania';
  return 'Other';
}

function selectDistributed(allFlights, maxTotal = 100, minPerRegion = 10) {
  const byRegion = {};
  allFlights.forEach(f => {
    const region = classifyRegion(f.lat, f.lng);
    if (!byRegion[region]) byRegion[region] = [];
    byRegion[region].push(f);
  });

  const selected = [];
  const regions = Object.keys(byRegion);

  regions.forEach(region => {
    const pool = byRegion[region];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    selected.push(...pool.slice(0, minPerRegion));
  });

  if (selected.length < maxTotal) {
    const remaining = allFlights.filter(f => !selected.includes(f));
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    selected.push(...remaining.slice(0, maxTotal - selected.length));
  }

  return selected.slice(0, maxTotal);
}

function detectSurge(flights) {
  flights.forEach(f => {
    const nearby = flights.filter(
      o => o !== f && haversine(f.lat, f.lng, o.lat, o.lng) < 200
    );
    if (nearby.length >= 6) {
      f.isSurge = true;
      nearby.forEach(n => { n.isSurge = true; });
    }
  });
}

function parseOpenSkyState(s) {
  const callsign    = (s[1] || '').trim() || 'UNKNOWN';
  const lat         = s[6] || 0;
  const lng         = s[5] || 0;
  const altitude    = s[7]  ? Math.round(s[7]  * 3.281) : 0;
  const velocity    = s[9]  ? Math.round(s[9]  * 1.944) : 0;
  const heading     = s[10] != null ? Math.round(s[10]) : null;
  const verticalRate= s[11] ? Math.round(s[11] * 196.85) : 0;
  const origin      = s[2]  || 'Unknown';
  const aircraftType= getAircraftType(s[17], callsign);
  const silhouette  = getAircraftSilhouette(s[17], callsign);
  const icao24      = s[0]  || '';
  const squawk      = s[14] || '';
  const headingCompass = headingToCompass(heading);
  const dest        = estimateDestination(lat, lng, heading, velocity);

  let isNearConflict = false;
  let nearConflictZone = null;
  for (const zone of CONFLICT_ZONES) {
    if (haversine(lat, lng, zone.lat, zone.lng) < zone.radius) {
      isNearConflict = true;
      nearConflictZone = zone.name;
      break;
    }
  }

  return {
    callsign, icao24, lat, lng, altitude, velocity, heading, headingCompass,
    verticalRate, squawk, origin, aircraftType, silhouette,
    isNearConflict, nearConflictZone, isSurge: false,
    destLat: dest ? dest.lat : null,
    destLng: dest ? dest.lng : null,
    source: 'OpenSky',
  };
}

// ─── Demo Flights (last resort fallback) ──────────────────
const DEMO_FLIGHTS = [
  { callsign: 'NATO05',    icao24: 'AE0002', lat: 50.45, lng: 30.52,   altitude: 42000, velocity: 440, heading: 45,  headingCompass: 'NE',  verticalRate: 0,    squawk: '6100', origin: 'NATO',          aircraftType: 'Strategic AWACS',    silhouette: 'bomber',    isNearConflict: true,  nearConflictZone: 'Ukraine',       isSurge: true,  destLat: 52.00, destLng: 35.00,  source: 'DEMO' },
  { callsign: 'RAF22',     icao24: 'AE0010', lat: 52.10, lng: -1.50,   altitude: 34000, velocity: 420, heading: 120, headingCompass: 'ESE', verticalRate: 0,    squawk: '3200', origin: 'United Kingdom', aircraftType: 'Multi-Role Tactical', silhouette: 'fighter',   isNearConflict: false, nearConflictZone: null,            isSurge: false, destLat: 48.00, destLng: 5.00,   source: 'DEMO' },
  { callsign: 'HAWK12',    icao24: 'AE0001', lat: 35.20, lng: 36.80,   altitude: 28000, velocity: 520, heading: 270, headingCompass: 'W',   verticalRate: -500, squawk: '1200', origin: 'United Kingdom', aircraftType: 'High Maneuverable',  silhouette: 'fighter',   isNearConflict: true,  nearConflictZone: 'Syria',         isSurge: false, destLat: 34.00, destLng: 32.00,  source: 'DEMO' },
  { callsign: 'GHOST_UAV', icao24: 'AE0003', lat: 31.80, lng: 34.78,   altitude: 18000, velocity: 120, heading: 180, headingCompass: 'S',   verticalRate: 200,  squawk: '0000', origin: 'Unknown',        aircraftType: 'UAV / Recon Drone',  silhouette: 'drone',     isNearConflict: true,  nearConflictZone: 'Gaza',          isSurge: false, destLat: 30.50, destLng: 34.78,  source: 'DEMO' },
  { callsign: 'REACH3',    icao24: 'AE0004', lat: 15.90, lng: 44.60,   altitude: 38000, velocity: 460, heading: 135, headingCompass: 'SE',  verticalRate: 100,  squawk: '1200', origin: 'United States',  aircraftType: 'Heavy Transport',    silhouette: 'transport', isNearConflict: true,  nearConflictZone: 'Yemen',         isSurge: false, destLat: 12.00, destLng: 48.00,  source: 'DEMO' },
  { callsign: 'RCH401',    icao24: 'AE0000', lat: 38.90, lng: -77.04,  altitude: 35000, velocity: 480, heading: 90,  headingCompass: 'E',   verticalRate: 0,    squawk: '7700', origin: 'United States',  aircraftType: 'Heavy Transport',    silhouette: 'transport', isNearConflict: false, nearConflictZone: null,            isSurge: false, destLat: 40.00, destLng: -70.00, source: 'DEMO' },
  { callsign: 'SPAR19',    icao24: 'AE0011', lat: 33.94, lng: -118.40, altitude: 41000, velocity: 470, heading: 270, headingCompass: 'W',   verticalRate: 0,    squawk: '4500', origin: 'United States',  aircraftType: 'Large Strategic',    silhouette: 'bomber',    isNearConflict: false, nearConflictZone: null,            isSurge: false, destLat: 21.30, destLng: -157.80,source: 'DEMO' },
  { callsign: 'DUKE88',    icao24: 'AE0005', lat: 24.50, lng: 119.50,  altitude: 30000, velocity: 500, heading: 315, headingCompass: 'NW',  verticalRate: 0,    squawk: '5400', origin: 'United States',  aircraftType: 'Large Strategic',    silhouette: 'bomber',    isNearConflict: true,  nearConflictZone: 'Taiwan Strait', isSurge: false, destLat: 27.00, destLng: 116.00, source: 'DEMO' },
  { callsign: 'DRAGON7',   icao24: 'AE0012', lat: 35.68, lng: 139.69,  altitude: 36000, velocity: 450, heading: 200, headingCompass: 'SSW', verticalRate: 0,    squawk: '2100', origin: 'Japan',          aircraftType: 'Multi-Role Tactical', silhouette: 'fighter',  isNearConflict: false, nearConflictZone: null,            isSurge: false, destLat: 30.00, destLng: 135.00, source: 'DEMO' },
  { callsign: 'IRON44',    icao24: 'AE0013', lat: 9.00,  lng: 38.70,   altitude: 32000, velocity: 400, heading: 320, headingCompass: 'NW',  verticalRate: 200,  squawk: '3300', origin: 'Ethiopia',       aircraftType: 'Multi-Role Tactical', silhouette: 'fighter',  isNearConflict: false, nearConflictZone: null,            isSurge: false, destLat: 12.00, destLng: 35.00,  source: 'DEMO' },
];

// ─── Primary Source: OpenSky (OAuth2) ─────────────────────
async function fetchFromOpenSky(retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const token = await getOpenSkyToken();

      const osRes = await axios.get('https://opensky-network.org/api/states/all', {
        timeout: 12000,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept-Encoding': 'gzip',
        },
      });

      const states = osRes.data?.states || [];

      const allMilitary = states
        .filter(s => {
          const callsign = (s[1] || '').trim();
          const category = s[17];
          return MILITARY_PATTERNS.test(callsign) || category === 7 || category === 13;
        })
        .map(parseOpenSkyState);

      const flights = selectDistributed(allMilitary, 100, 10);
      detectSurge(flights);
      return flights;

    } catch (err) {
      const status = err.response?.status;

      // If token expired mid-session, clear it and retry
      if (status === 401) {
        console.warn(`[flights] ⚠️ Token expired, clearing cache and retrying...`);
        tokenCache = { token: null, expiresAt: 0 };
      }

      // Backoff on 429 or 401
      if ((status === 429 || status === 401) && attempt < retries) {
        const delay = (attempt + 1) * 3000;
        console.warn(`[flights] ⚠️ OpenSky ${status}, retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      throw err;
    }
  }
}

// ─── Fallback Source: ADS-B.fi ────────────────────────────
async function fetchFromADSBfi() {
  const adsbRes = await axios.get('https://opendata.adsb.fi/api/mil', {
    timeout: 12000,
    headers: { 'Accept-Encoding': 'gzip' },
  });

  const aircraft = adsbRes.data?.aircraft || adsbRes.data?.ac || [];

  const allMilitary = aircraft.map(a => {
    const callsign    = (a.flight || a.callsign || '').trim() || 'UNKNOWN';
    const lat         = a.lat || 0;
    const lng         = a.lon || a.lng || 0;
    const altitude    = a.alt_baro ? Math.round(a.alt_baro) : 0;
    const velocity    = a.gs ? Math.round(a.gs) : 0;
    const heading     = a.track != null ? Math.round(a.track) : null;
    const verticalRate= a.baro_rate ? Math.round(a.baro_rate) : 0;
    const icao24      = a.hex || '';
    const squawk      = a.squawk || '';
    const headingCompass = headingToCompass(heading);
    const dest        = estimateDestination(lat, lng, heading, velocity);

    let isNearConflict = false;
    let nearConflictZone = null;
    for (const zone of CONFLICT_ZONES) {
      if (haversine(lat, lng, zone.lat, zone.lng) < zone.radius) {
        isNearConflict = true;
        nearConflictZone = zone.name;
        break;
      }
    }

    return {
      callsign, icao24, lat, lng, altitude, velocity, heading, headingCompass,
      verticalRate, squawk,
      origin: a.r || 'Unknown',
      aircraftType: a.t || getAircraftType(null, callsign),
      silhouette: getAircraftSilhouette(null, callsign),
      isNearConflict, nearConflictZone, isSurge: false,
      destLat: dest ? dest.lat : null,
      destLng: dest ? dest.lng : null,
      source: 'ADS-B.fi',
    };
  });

  const flights = selectDistributed(allMilitary, 100, 10);
  detectSurge(flights);
  return flights;
}

// ─── GET /api/flights ──────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const cached = cache.get('flights');
    if (cached) return res.json(cached);

    let flights = [];
    let source = 'DEMO';

    // 1️⃣ Try OpenSky (authenticated)
    try {
      flights = await fetchFromOpenSky();
      source = 'OpenSky';
      console.log(`[flights] ✅ OpenSky: ${flights.length} tactical signals traced globally.`);
    } catch (err) {
      console.warn('[flights] ⚠️ OpenSky failed:', err.message);

      // 2️⃣ Try ADS-B.fi fallback
      try {
        flights = await fetchFromADSBfi();
        source = 'ADS-B.fi';
        console.log(`[flights] ✅ ADS-B.fi fallback: ${flights.length} signals recovered.`);
      } catch (err2) {
        console.warn('[flights] ⚠️ ADS-B.fi also failed:', err2.message);
      }
    }

    // 3️⃣ Last resort: demo data
    const result = flights.length > 0 ? flights : DEMO_FLIGHTS;
    if (flights.length === 0) {
      console.warn('[flights] ⚠️ Both sources failed — serving DEMO data.');
    }

    // Cache for 5 minutes to protect API credits
    cache.set('flights', result, 5 * 60 * 1000);
    res.json(result);

  } catch (err) {
    console.error('[flights] ❌ Critical Error:', err.message);
    res.json(DEMO_FLIGHTS);
  }
});

module.exports = router;