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
