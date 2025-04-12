const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const cache = require('../services/cacheService');

let activeVessels = new Map(); // mmsi -> vesselData
let staticData = new Map();    // mmsi -> { name, callSign, type, destination }

// ─── Math Helpers ──────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Ship Type Code → Category ─────────────────────────────
// AIS type codes: https://coast.noaa.gov/data/Documents/Formats/AIS_Messages.pdf
function getVesselCategoryFromCode(typeCode) {
  const code = parseInt(typeCode, 10);
  if (isNaN(code)) return 'Cargo';
  if (code >= 80 && code <= 89) return 'Tanker';
  if (code >= 70 && code <= 79) return 'Cargo';
  if (code >= 60 && code <= 69) return 'Passenger';
  if (code >= 35 && code <= 35) return 'Military';
  if (code >= 30 && code <= 32) return 'Utility'; // fishing/towing
  if (code === 51 || code === 52) return 'Utility'; // SAR/tug
  return 'Cargo'; // default
}

function getVesselCategoryFromName(name = '') {
  const t = name.toLowerCase();
  if (t.includes('tanker') || t.includes('oil') || t.includes('chem')) return 'Tanker';
  if (t.includes('cargo') || t.includes('container') || t.includes('bulk')) return 'Cargo';
  if (t.includes('passenger') || t.includes('ferry') || t.includes('cruise')) return 'Passenger';
  if (t.includes('military') || t.includes('navy') || t.includes('warship')) return 'Military';
  if (t.includes('fishing') || t.includes('coast') || t.includes('tug')) return 'Utility';
  return null;
}

function resolveVesselCategory(typeCode, name) {
  const fromName = getVesselCategoryFromName(name);
  if (fromName) return fromName;
  return getVesselCategoryFromCode(typeCode);
}

// ─── Surge Detection ───────────────────────────────────────
function detectNavalSurge(vesselsArr) {
  vesselsArr.forEach(v => {
    const nearby = vesselsArr.filter(
      o => o !== v && haversine(v.lat, v.lng, o.lat, o.lng) < 50
    );
    if (nearby.length >= 8) {
      v.isSurge = true;
      nearby.forEach(n => { n.isSurge = true; });
    }
  });
}

// ─── Estimate Projected Destination ───────────────────────
function estimateDestination(lat, lng, headingDeg, speedKnots) {
  if (!headingDeg || !speedKnots || speedKnots < 0.5) return { destLat: null, destLng: null };
  // Project 10 hours ahead
  const distDeg = (speedKnots * 1.852 * 10) / 111;
  return {
    destLat: lat + Math.cos(headingDeg * Math.PI / 180) * distDeg,
    destLng: lng + Math.sin(headingDeg * Math.PI / 180) * distDeg,
  };
}

// ─── WebSocket Connection to AISstream ────────────────────
function connectToAisStream() {
  const AIS_API_KEY = process.env.AIS_API_KEY || 'adefc2b475ba4de591127a2d1cff2a4796a8ec30'; 
  
  if (!AIS_API_KEY) {
    console.warn('[AIS] ⚠️ No AIS_API_KEY found in environment. Maritime tracking disabled.');
    return;
  }

  console.log('[AIS] Connecting to aisstream.io...');
  const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

  ws.on('open', () => {
    console.log('[AIS] ✅ Connected to global stream');

    // Revert to APIKey - official docs require exact capitalized notation
    const subscriptionMessage = {
      APIKey: AIS_API_KEY,
      BoundingBoxes: [[[-90, -180], [90, 180]]],               // Global
      FilterMessageTypes: ['PositionReport', 'ShipStaticData'] // Get positions + real names/types
    };

    ws.send(JSON.stringify(subscriptionMessage));
  });

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data);

      // ── Handle error messages from AISstream ──
      if (parsed.error) {
        console.error('[AIS] ❌ API Error:', parsed.error);
        return;
      }

      // ── ShipStaticData: enrich vessel name, callsign, type, destination ──
      if (parsed.MessageType === 'ShipStaticData') {
        const msg = parsed.Message.ShipStaticData;
        const mmsi = msg.UserID;
        if (mmsi) {
          staticData.set(mmsi, {
            name:        (msg.Name        || '').trim(),
            callSign:    (msg.CallSign    || '').trim(),
            typeCode:    msg.Type,
            destination: (msg.Destination || '').trim(),
          });
        }
        return;
      }

      // ── PositionReport: track live vessel positions ──
      if (parsed.MessageType === 'PositionReport') {
        const msg = parsed.Message.PositionReport;
        const mmsi = msg.UserID;

        // Filter out stationary/anchored vessels (speed < 0.5 knots)
        if (msg.Sog < 0.5) return;

        const lat = msg.Latitude;
        const lng = msg.Longitude;
        const heading = msg.TrueHeading === 511 ? Math.round(msg.Cog) : msg.TrueHeading;
        const speed = msg.Sog;

        // Merge with static data if available
        const info = staticData.get(mmsi) || {};
        const vesselName = info.name || `VSL-${mmsi.toString().slice(-4)}`;
        const callsign   = info.callSign || `MMSI-${mmsi}`;
        const vesselType = resolveVesselCategory(info.typeCode, info.name || '');
        const destination = info.destination || '';

        const { destLat, destLng } = estimateDestination(lat, lng, heading, speed);

        const vessel = {
          id:          `ship_${mmsi}`,
          mmsi,
          callsign,
          name:        vesselName,
          lat,
          lng,
          heading,
          speed,
          vesselType,
          destination,
          isSurge:     false,
          destLat,
          destLng,
          lastSeen:    Date.now(),
          source:      'AISstream',
        };

        activeVessels.set(mmsi, vessel);

        // Cap at 400 vessels — drop oldest when exceeded
        if (activeVessels.size > 400) {
          const oldestKey = [...activeVessels.entries()]
            .sort((a, b) => a[1].lastSeen - b[1].lastSeen)[0][0];
          activeVessels.delete(oldestKey);
        }
      }

    } catch (e) {
      // Silently ignore parse errors (malformed frames)
    }
  });

  ws.on('error', (err) => {
    console.error('[AIS] ❌ WebSocket error:', err.message);
  });

  ws.on('close', (code, reason) => {
    console.warn(`[AIS] ⚠️ Connection closed (code: ${code}). Reconnecting in 10s...`);
    setTimeout(connectToAisStream, 10000);
  });
}

// ─── Start Tracking ────────────────────────────────────────
connectToAisStream();

// ─── Cleanup Stale Vessels (older than 10 mins) ────────────
setInterval(() => {
  const now = Date.now();
  let removed = 0;
  for (const [mmsi, vessel] of activeVessels.entries()) {
    if (now - vessel.lastSeen > 10 * 60 * 1000) {
      activeVessels.delete(mmsi);
      removed++;
    }
  }
  if (removed > 0) {
    console.log(`[AIS] 🧹 Cleaned up ${removed} stale vessels. Active: ${activeVessels.size}`);
  }
}, 2 * 60 * 1000);

// ─── Cleanup Stale Static Data (older than 1 hour) ─────────
setInterval(() => {
  // staticData doesn't have timestamps, so just trim if it grows huge
  if (staticData.size > 5000) {
    const keys = [...staticData.keys()].slice(0, 1000);
    keys.forEach(k => staticData.delete(k));
    console.log(`[AIS] 🧹 Trimmed staticData cache to ${staticData.size} entries.`);
  }
}, 30 * 60 * 1000);

// ─── GET /api/vessels ──────────────────────────────────────
router.get('/', (req, res) => {
  const shipsArr = Array.from(activeVessels.values());

  // Run surge detection
  detectNavalSurge(shipsArr);

  // Update cache for any WebSocket push consumers
  cache.set('vessels', shipsArr, 60 * 1000);

  console.log(`[AIS] 📡 Serving ${shipsArr.length} active vessels.`);
  res.json(shipsArr);
});

module.exports = router;