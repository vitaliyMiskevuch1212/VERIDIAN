const express = require('express');
const router = express.Router();
const axios = require('axios');
const cache = require('../services/cacheService');

const DEMO_EVENTS = [
  { id: 'd1',  title: 'Military escalation near border region',      lat: 34.05,  lng: 44.36,   severity: 'CRITICAL', type: 'conflict',     country: 'Iraq',        iso2: 'iq' },
  { id: 'd2',  title: 'Anti-government protests in capital',         lat: 33.89,  lng: 35.50,   severity: 'HIGH',     type: 'protest',      country: 'Lebanon',     iso2: 'lb' },
  { id: 'd3',  title: 'Earthquake M5.2 detected',                   lat: 38.42,  lng: 43.35,   severity: 'HIGH',     type: 'earthquake',   country: 'Turkey',      iso2: 'tr' },
  { id: 'd4',  title: 'Critical escalation in Strait of Hormuz',    lat: 26.56,  lng: 56.25,   severity: 'CRITICAL', type: 'conflict',     country: 'Iran/Oman',   iso2: 'ir' },
  { id: 'd5',  title: 'Diplomatic tensions rise over trade deal',    lat: 48.86,  lng: 2.35,    severity: 'LOW',      type: 'political',    country: 'France',      iso2: 'fr' },
  { id: 'd6',  title: 'Wildfire spreading across northern region',   lat: 37.98,  lng: 23.73,   severity: 'HIGH',     type: 'wildfire',     country: 'Greece',      iso2: 'gr' },
  { id: 'd7',  title: 'Cyber attack on financial infrastructure',    lat: 51.51,  lng: -0.13,   severity: 'CRITICAL', type: 'cyber',        country: 'UK',          iso2: 'gb' },
  { id: 'd8',  title: 'Refugee crisis intensifies at border',        lat: 36.20,  lng: 36.16,   severity: 'HIGH',     type: 'humanitarian', country: 'Syria',       iso2: 'sy' },
  { id: 'd9',  title: 'Opposition leader arrested amid crackdown',   lat: 55.76,  lng: 37.62,   severity: 'MEDIUM',   type: 'political',    country: 'Russia',      iso2: 'ru' },
  { id: 'd10', title: 'Oil pipeline explosion disrupts supply',      lat: 6.52,   lng: 3.38,    severity: 'CRITICAL', type: 'conflict',     country: 'Nigeria',     iso2: 'ng' },
  { id: 'd11', title: 'Mass protest against economic policy',        lat: -34.60, lng: -58.38,  severity: 'MEDIUM',   type: 'protest',      country: 'Argentina',   iso2: 'ar' },
  { id: 'd12', title: 'Military coup attempt reported',              lat: 9.06,   lng: 7.49,    severity: 'CRITICAL', type: 'conflict',     country: 'Nigeria',     iso2: 'ng' },
  { id: 'd13', title: 'Flooding displaces thousands',               lat: 23.81,  lng: 90.41,   severity: 'HIGH',     type: 'disaster',     country: 'Bangladesh',  iso2: 'bd' },
  { id: 'd14', title: 'Nuclear talks stall',                        lat: 35.69,  lng: 51.39,   severity: 'HIGH',     type: 'political',    country: 'Iran',        iso2: 'ir' },
  { id: 'd15', title: 'Border skirmish reported',                   lat: 34.53,  lng: 69.17,   severity: 'CRITICAL', type: 'conflict',     country: 'Afghanistan', iso2: 'af' },
  { id: 'd16', title: 'Election violence in southern province',      lat: -4.44,  lng: 15.27,   severity: 'HIGH',     type: 'conflict',     country: 'DR Congo',    iso2: 'cd' },
  { id: 'd17', title: 'Earthquake M6.1 strikes coastal area',       lat: -8.65,  lng: 115.22,  severity: 'CRITICAL', type: 'earthquake',   country: 'Indonesia',   iso2: 'id' },
  { id: 'd18', title: 'Trade sanctions imposed on exports',          lat: 39.90,  lng: 116.40,  severity: 'MEDIUM',   type: 'political',    country: 'China',       iso2: 'cn' },
  { id: 'd19', title: 'Militants seize control of key town',        lat: 2.05,   lng: 45.32,   severity: 'CRITICAL', type: 'conflict',     country: 'Somalia',     iso2: 'so' },
  { id: 'd20', title: 'Volcanic eruption alert issued',             lat: -7.54,  lng: 110.45,  severity: 'HIGH',     type: 'disaster',     country: 'Indonesia',   iso2: 'id' },
  { id: 'd21', title: 'Drone strike targets militant compound',     lat: 33.26,  lng: 44.38,   severity: 'CRITICAL', type: 'conflict',     country: 'Iraq',        iso2: 'iq' },
  { id: 'd22', title: 'Currency crisis deepens',                    lat: 30.04,  lng: 31.24,   severity: 'MEDIUM',   type: 'political',    country: 'Egypt',       iso2: 'eg' },
  { id: 'd23', title: 'Humanitarian aid convoy blocked',            lat: 15.55,  lng: 32.53,   severity: 'HIGH',     type: 'humanitarian', country: 'Sudan',       iso2: 'sd' },
  { id: 'd24', title: 'Anti-terrorism operation launched',          lat: 33.72,  lng: 73.04,   severity: 'HIGH',     type: 'conflict',     country: 'Pakistan',    iso2: 'pk' },
  { id: 'd25', title: 'Typhoon warning issued for coastal regions', lat: 14.60,  lng: 120.98,  severity: 'HIGH',     type: 'disaster',     country: 'Philippines', iso2: 'ph' },
];

function scoreSeverity(text) {
  const t = (text || '').toLowerCase();
  if (/killed|bombing|attack|explosion|war|missiles|airstrike|massacre/.test(t)) return 'CRITICAL';
  if (/military|armed|troops|clash|strike|gunfire|hostage/.test(t)) return 'HIGH';
  if (/protest|tension|sanctions|arrest|unrest/.test(t)) return 'MEDIUM';
  return 'LOW';
}

function classifyEvent(text) {
  const t = (text || '').toLowerCase();
  if (/earthquake|quake|seismic/.test(t)) return 'earthquake';
  if (/wildfire|fire|blaze/.test(t)) return 'wildfire';
  if (/flood|tsunami|hurricane|typhoon|cyclone|storm|volcano/.test(t)) return 'disaster';
  if (/protest|demonstrat|rally|march/.test(t)) return 'protest';
  if (/cyber|hack|ransomware|breach/.test(t)) return 'cyber';
  if (/conflict|battle|military|war|attack|bomb|militant|drone|airstrike/.test(t)) return 'conflict';
  return 'political';
}

/**
 * GDELT GeoJSON API — free, no auth, updates every 15 min
 */
/**
 * GDELT — use TV API instead of DOC API, much faster
 */

/**
 * NASA EONET — natural events (fires, storms, volcanoes)
 */
async function fetchEONET() {
  try {
    const res = await axios.get('https://eonet.gsfc.nasa.gov/api/v3/events', {
      params: { limit: 20, days: 7, status: 'open' },
      timeout: 8000
    });

    const events = res.data?.events || [];
    console.log(`[events] EONET returned ${events.length} natural events`);

    return events
      .map((e, i) => {
        const geo = e.geometry?.[0];
        if (!geo?.coordinates) return null;
        return {
          id: `eonet_${i}`,
          title: e.title || 'Natural Event',
          lat: geo.coordinates[1],
          lng: geo.coordinates[0],
          severity: 'HIGH',
          type: classifyEvent(e.title || e.categories?.[0]?.title || ''),
          country: '',
          iso2: '',
          source: 'NASA EONET'
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.warn('[events] EONET fetch failed:', err.message);
    return [];
  }
}