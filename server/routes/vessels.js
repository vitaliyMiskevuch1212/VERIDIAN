const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const cache = require('../services/cacheService');

let activeVessels = new Map(); // mmsi -> vesselData
let staticData = new Map();    // mmsi -> { name, callSign, type, destination

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