require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const cache = require('./services/cacheService');

const app = express();
const PORT = process.env.PORT || 5000;

// --------------- HTTP + Socket.io ---------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// --------------- Routes ---------------
app.use('/api/events',  require('./routes/events'));
app.use('/api/news',    require('./routes/news'));
app.use('/api/ai',      require('./routes/ai'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/flights', require('./routes/flights'));
app.use('/api/cyber',   require('./routes/cyber'));
