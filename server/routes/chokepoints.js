const express = require('express');
const router = express.Router();
const cache = require('../services/cacheService');

// ─── Critical Maritime Chokepoints ──────────────────────────────────
const CHOKEPOINTS = [
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    lat: 26.57, lng: 56.25,
    arcStart: { lat: 27.1, lng: 56.0 }, arcEnd: { lat: 26.0, lng: 56.5 },
    dailyVessels: 2400,
    commodity: 'Crude Oil',
    tradeVolume: '21M barrels/day',
    affectedTickers: ['XOM', 'USO', 'CL', 'CVX', 'BP'],
    description: 'World\'s most critical oil chokepoint — 21% of global petroleum liquids flow through daily.',
    keywords: ['hormuz', 'strait of hormuz', 'persian gulf', 'iran navy', 'basij'],
    region: 'Middle East',
  },
  {
    id: 'suez',
    name: 'Suez Canal',
    lat: 30.45, lng: 32.35,
    arcStart: { lat: 31.3, lng: 32.3 }, arcEnd: { lat: 29.9, lng: 32.5 },
    dailyVessels: 1500,
    commodity: 'Container Goods',
    tradeVolume: '12% of world trade',
    affectedTickers: ['ZIM', 'AFRM', 'FDX', 'MAERSK', 'USO'],
    description: 'Connects Mediterranean to Red Sea. Blockage (Ever Given 2021) cost $9.6B/day in trade.',
    keywords: ['suez', 'suez canal', 'egypt canal', 'red sea', 'ever given'],
    region: 'Middle East',
  },
  {
    id: 'bab-el-mandeb',
    name: 'Bab el-Mandeb',
    lat: 12.58, lng: 43.33,
    arcStart: { lat: 13.0, lng: 43.0 }, arcEnd: { lat: 12.2, lng: 43.6 },
    dailyVessels: 900,
    commodity: 'Oil & LNG',
    tradeVolume: '4.8M barrels/day',
    affectedTickers: ['USO', 'XOM', 'LNG', 'FLNG', 'ZIM'],
    description: 'Gateway to Suez. Houthi attacks dramatically curtailed shipping since 2024.',
    keywords: ['bab el mandeb', 'bab-el-mandeb', 'houthi', 'yemen strait', 'red sea attacks'],
    region: 'Middle East',
  },
  {
    id: 'taiwan',
    name: 'Taiwan Strait',
    lat: 24.25, lng: 119.5,
    arcStart: { lat: 25.0, lng: 119.0 }, arcEnd: { lat: 23.5, lng: 120.0 },
    dailyVessels: 1100,
    commodity: 'Semiconductors',
    tradeVolume: '~90% advanced chips',
    affectedTickers: ['TSM', 'NVDA', 'AMD', 'INTC', 'ASML'],
    description: 'TSMC fabs produce 90% of world\'s advanced semiconductors. Military tensions make this critical.',
    keywords: ['taiwan strait', 'taiwan', 'pla navy', 'chinese military', 'tsmc'],
    region: 'Asia-Pacific',
  },
  {
    id: 'malacca',
    name: 'Strait of Malacca',
    lat: 2.5, lng: 101.5,
    arcStart: { lat: 4.0, lng: 100.0 }, arcEnd: { lat: 1.2, lng: 103.8 },
    dailyVessels: 2000,
    commodity: 'Oil & Trade Goods',
    tradeVolume: '25% of world trade',
    affectedTickers: ['USO', 'FDX', 'UPS', 'ZIM', 'MAERSK'],
    description: 'Shortest route between Indian and Pacific Oceans. Closure would add 3 days and massive costs.',
    keywords: ['malacca', 'strait of malacca', 'malaysia strait', 'singapore strait'],
    region: 'Asia-Pacific',
  },
  {
    id: 'panama',
    name: 'Panama Canal',
    lat: 9.08, lng: -79.68,
    arcStart: { lat: 9.4, lng: -79.9 }, arcEnd: { lat: 8.9, lng: -79.5 },
    dailyVessels: 1000,
    commodity: 'Container Goods',
    tradeVolume: '5% of global trade',
    affectedTickers: ['ZIM', 'FDX', 'UPS', 'MAERSK', 'XOM'],
    description: '2024 drought restricted transits to 24/day from 38. Climate vulnerability proven.',
    keywords: ['panama canal', 'panama', 'panama drought', 'canal restrictions'],
    region: 'Americas',
  },
  {
    id: 'gibraltar',
    name: 'Strait of Gibraltar',
    lat: 35.96, lng: -5.5,
    arcStart: { lat: 36.1, lng: -5.8 }, arcEnd: { lat: 35.8, lng: -5.3 },
    dailyVessels: 800,
    commodity: 'Mixed Trade',
    tradeVolume: '€2T+ annually',
    affectedTickers: ['SPY', 'EWG', 'FXE', 'ZIM', 'USO'],
    description: 'Gateway between Atlantic and Mediterranean. NATO strategic priority.',
    keywords: ['gibraltar', 'strait of gibraltar', 'mediterranean entry'],
    region: 'Europe',
  },
  {
    id: 'dardanelles',
    name: 'Turkish Straits',
    lat: 40.2, lng: 26.4,
    arcStart: { lat: 41.2, lng: 29.0 }, arcEnd: { lat: 40.0, lng: 26.2 },
    dailyVessels: 500,
    commodity: 'Grain & Oil',
    tradeVolume: '3M+ barrels/day',
    affectedTickers: ['WEAT', 'USO', 'DBA', 'ADM', 'BG'],
    description: 'Bosphorus + Dardanelles. Controls Black Sea access. Critical for Ukraine grain exports.',
    keywords: ['bosphorus', 'dardanelles', 'turkish straits', 'black sea', 'montreux'],
    region: 'Europe',
  },
];

/**
 * GET /api/chokepoints
 * Returns all chokepoints with live disruption status
 */
router.get('/', (req, res) => {
  try {
    const events = cache.get('events') || [];
    const news = cache.get('news') || [];
    const allText = [...events, ...news];

    const result = CHOKEPOINTS.map(cp => {
      // Check if any event or news mentions this chokepoint
      const matchingEvents = events.filter(e => {
        const text = `${e.title || ''} ${e.country || ''}`.toLowerCase();
        return cp.keywords.some(k => text.includes(k));
      });
      const matchingNews = news.filter(n => {
        const text = `${n.title || ''}`.toLowerCase();
        return cp.keywords.some(k => text.includes(k));
      });

      const hasCritical = matchingEvents.some(e => e.severity === 'CRITICAL');
      const hasHigh = matchingEvents.some(e => e.severity === 'HIGH');
      const totalMentions = matchingEvents.length + matchingNews.length;

      let status = 'CLEAR';
      let threatLevel = 0;
      if (hasCritical || totalMentions >= 5) {
        status = 'DISRUPTED';
        threatLevel = 90 + Math.min(totalMentions * 2, 10);
      } else if (hasHigh || totalMentions >= 3) {
        status = 'ELEVATED';
        threatLevel = 50 + totalMentions * 5;
      } else if (totalMentions >= 1) {
        status = 'MONITORING';
        threatLevel = 20 + totalMentions * 10;
      }

      return {
        ...cp,
        status,
        threatLevel: Math.min(threatLevel, 100),
        matchingEvents: matchingEvents.slice(0, 3).map(e => ({
          title: e.title, severity: e.severity, country: e.country
        })),
        matchingNews: matchingNews.slice(0, 3).map(n => ({
          title: n.title, severity: n.severity
        })),
        totalMentions,
        lastUpdated: new Date().toISOString(),
      };
    });

    // Sort: disrupted first, then by threat level
    result.sort((a, b) => {
      const order = { DISRUPTED: 0, ELEVATED: 1, MONITORING: 2, CLEAR: 3 };
      return (order[a.status] || 3) - (order[b.status] || 3) || b.threatLevel - a.threatLevel;
    });

    res.json(result);
  } catch (err) {
    console.error('[chokepoints] Error:', err.message);
    res.json(CHOKEPOINTS.map(cp => ({ ...cp, status: 'CLEAR', threatLevel: 0, matchingEvents: [], matchingNews: [], totalMentions: 0 })));
  }
});

module.exports = router;
