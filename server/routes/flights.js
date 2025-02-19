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