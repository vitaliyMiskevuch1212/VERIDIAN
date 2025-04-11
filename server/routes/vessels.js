const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const cache = require('../services/cacheService');

let activeVessels = new Map(); // mmsi -> vesselData
let staticData = new Map();    // mmsi -> { name, callSign, type, destination