const express = require('express');
const router = express.Router();
const axios = require('axios');
const cache = require('../services/cacheService');
const groqService = require('../services/groqService');

let yahooFinance;
try {
  const yf = require('yahoo-finance2');
  yahooFinance = yf.default || yf; // ✅ handles both module formats
  console.log('[finance] yahoo-finance2 loaded OK');
} catch (e) {
  console.warn('[finance] yahoo-finance2 not available:', e.message);
}

const DEMO_QUOTES = {
  AAPL:  { symbol: 'AAPL',  price: 178.52, change: 1.24,  volume: '52.3M', name: 'Apple Inc.' },
  MSFT:  { symbol: 'MSFT',  price: 415.60, change: -0.87, volume: '21.1M', name: 'Microsoft Corp.' },
  GOOGL: { symbol: 'GOOGL', price: 141.80, change: 2.15,  volume: '18.7M', name: 'Alphabet Inc.' },
  TSLA:  { symbol: 'TSLA',  price: 248.42, change: -3.21, volume: '95.2M', name: 'Tesla Inc.' },
  AMZN:  { symbol: 'AMZN',  price: 185.07, change: 0.93,  volume: '34.5M', name: 'Amazon.com' },
  NVDA:  { symbol: 'NVDA',  price: 875.28, change: 4.56,  volume: '42.8M', name: 'NVIDIA Corp.' },
};

const DEMO_CRYPTO = [
  { symbol: 'BTC', name: 'Bitcoin',  price: 67432.18, change: 2.34 },
  { symbol: 'ETH', name: 'Ethereum', price: 3456.72,  change: -1.05 },
  { symbol: 'SOL', name: 'Solana',   price: 142.89,   change: 5.67 },
  { symbol: 'XRP', name: 'XRP',      price: 0.6234,   change: -0.43 },
];

const DEMO_FOREX = [
  { pair: 'USD/JPY', rate: 154.23, change: 0.12, flags: ['us', 'jp'] },
  { pair: 'EUR/USD', rate: 1.0834, change: -0.08, flags: ['eu', 'us'] },
  { pair: 'GBP/USD', rate: 1.2645, change: 0.15, flags: ['gb', 'us'] },
];

const DEMO_COMMODITIES = [
  { name: 'Gold',        symbol: 'GC=F',  price: 2342.50, change: 0.87 },
  { name: 'Crude Oil',   symbol: 'CL=F',  price: 78.34,   change: -1.23 },
  { name: 'Natural Gas', symbol: 'NG=F',  price: 2.156,   change: 2.45 },
];

function generateSparkline(basePrice) {
  const data = [];
  let price = basePrice * (0.95 + Math.random() * 0.05);
  for (let i = 6; i >= 0; i--) {
    price = price * (0.98 + Math.random() * 0.04);
    data.push({ day: i, price: parseFloat(price.toFixed(2)) });
  }
  data.push({ day: 0, price: basePrice });
  return data.reverse();
}

