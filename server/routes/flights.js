// code passed to prince for flight api
const express = require('express');
const router = express.Router();
const axios = require('axios');
const cache = require('../services/cacheService');

// Known conflict zones for proximity detection
const CONFLICT_ZONES = [
  { name: 'Ukraine', lat: 48.38, lng: 31.17, radius: 500 },
  { name: 'Gaza',    lat: 31.35, lng: 34.31, radius: 200 },
  { name: 'Syria',   lat: 35.00, lng: 38.00, radius: 400 },
  { name: 'Yemen',   lat: 15.37, lng: 44.19, radius: 300 },
  { name: 'Sudan',   lat: 15.50, lng: 32.56, radius: 400 },
  { name: 'Somalia', lat: 5.15,  lng: 46.20, radius: 300 },
  { name: 'Myanmar', lat: 19.76, lng: 96.07, radius: 300 },
  { name: 'Taiwan Strait', lat: 24.00, lng: 120.00, radius: 300 },
];
// Expanded Military callsign patterns (Global SIGINT)
const MILITARY_PATTERNS = /^(RCH|EVAC|JAKE|DOOM|EPIC|IRON|VIPER|TOPCAT|HAWK|RAZOR|COBRA|DUKE|KING|REACH|FORGE|NORM|NATO|AXE|BOLT|CADDY|AE|AF|SPAR|GLIDE|DRAGON|GHOST|DEATH|BONES|U2|SR71|VENOM|REAPER|HERC|TALON)/i;

const CATEGORY_MAP = {
  0: 'Unidentified',
  2: 'Light Recon',
  3: 'Small Tactical',
  4: 'Large Strategic',
  6: 'Heavy Transport',
  7: 'High Maneuverable',
  8: 'Rotorcraft',
  13: 'UAV / Recon Drone'
};

function getAircraftType(cat) {
  return CATEGORY_MAP[cat] || 'Multi-Role Tactical';
}
// Haversine distance in km
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  
  const DEMO_FLIGHTS = [
    { callsign: 'RCH401', lat: 49.05, lng: 33.42, altitude: 35000, velocity: 480, origin: 'United States', aircraftType: 'Heavy Transport', isNearConflict: true, nearConflictZone: 'Ukraine', isSurge: false },
    { callsign: 'HAWK12', lat: 35.20, lng: 36.80, altitude: 28000, velocity: 520, origin: 'United Kingdom', aircraftType: 'High Maneuverable', isNearConflict: true, nearConflictZone: 'Syria', isSurge: false },
    { callsign: 'NATO05', lat: 50.45, lng: 30.52, altitude: 42000, velocity: 440, origin: 'NATO', aircraftType: 'Strategic AWACS', isNearConflict: true, nearConflictZone: 'Ukraine', isSurge: true },
    { callsign: 'GHOST_UAV', lat: 31.80, lng: 34.78, altitude: 18000, velocity: 120, origin: 'Unknown', aircraftType: 'UAV / Recon Drone', isNearConflict: true, nearConflictZone: 'Gaza', isSurge: false },
    { callsign: 'REACH3', lat: 15.90, lng: 44.60, altitude: 38000, velocity: 460, origin: 'United States', aircraftType: 'Heavy Transport', isNearConflict: true, nearConflictZone: 'Yemen', isSurge: false },
    { callsign: 'DUKE88', lat: 24.50, lng: 119.50, altitude: 30000, velocity: 500, origin: 'United States', aircraftType: 'Large Strategic', isNearConflict: true, nearConflictZone: 'Taiwan Strait', isSurge: false },
  ];
  // GET /api/flights
router.get('/', async (req, res) => {
    try {
      const cached = cache.get('flights');
      if (cached) return res.json(cached);
  
      let flights = [];
      try {
        // 🛰️ REAL-TIME OPENSKY FETCH
        const osRes = await axios.get('https://opensky-network.org/api/states/all', { 
          timeout: 10000,
          headers: { 'Accept-Encoding': 'gzip' } 
        });
        const states = osRes.data?.states || [];
  
        flights = states
          .filter(s => {
            const callsign = (s[1] || '').trim();
            const category = s[17];
            // Filter by military pattern OR specific high-interest categories (7=Fighter, 13=UAV)
            return MILITARY_PATTERNS.test(callsign) || category === 7 || category === 13;
          })
          .slice(0, 50) // Increased for more tactical density
          .map(s => {
            const callsign = (s[1] || '').trim() || 'UNKNOWN';
            const lat = s[6] || 0;
            const lng = s[5] || 0;
            const altitude = s[7] ? Math.round(s[7] * 3.281) : 0; // m to ft
            const velocity = s[9] ? Math.round(s[9] * 1.944) : 0; // m/s to knots
            const origin = s[2] || 'Unknown';
            const aircraftType = getAircraftType(s[17]);
  
            let isNearConflict = false;
            let nearConflictZone = null;
            for (const zone of CONFLICT_ZONES) {
              if (haversine(lat, lng, zone.lat, zone.lng) < zone.radius) {
                isNearConflict = true;
                nearConflictZone = zone.name;
                break;
              }
            }
  
            return { callsign, lat, lng, altitude, velocity, origin, aircraftType, isNearConflict, nearConflictZone, isSurge: false };
          });
  // Detect surge: >4 high-interest aircraft within 400km of each other
  flights.forEach(f => {
    const nearby = flights.filter(o => o !== f && haversine(f.lat, f.lng, o.lat, o.lng) < 400);
    if (nearby.length >= 4) {
      f.isSurge = true;
      nearby.forEach(n => { n.isSurge = true; });
    }
  });
  
  console.log(`[flights] Successfully traced ${flights.length} tactical signals.`);
} catch (err) {
  console.warn('[flights] Real-time trace failed, deploying synthetic intel:', err.message);
}

const result = flights.length > 0 ? flights : DEMO_FLIGHTS;

cache.set('flights', result, 60); // Cache for 60s
res.json(result);
} catch (err) {
console.error('[flights] Critical Error:', err.message);
res.json(DEMO_FLIGHTS);
}
});

module.exports = router;
