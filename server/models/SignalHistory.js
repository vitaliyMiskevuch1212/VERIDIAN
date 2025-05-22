const mongoose = require('mongoose');

const signalHistorySchema = new mongoose.Schema({
  ticker:     { type: String, required: true, index: true },
  signal:     { type: String, enum: ['BUY', 'HOLD', 'SELL'], required: true },
  confidence: { type: Number, min: 0, max: 100, required: true },
  reasoning:  { type: String, required: true },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('SignalHistory', signalHistorySchema);