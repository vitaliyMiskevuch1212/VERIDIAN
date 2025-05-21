const mongoose = require('mongoose');

const signalHistorySchema = new mongoose.Schema({
  ticker:             { type: String, required: true, index: true },
  signal:             { type: String, enum: ['BUY', 'HOLD', 'SELL'], required: true },
  confidence:         { type: Number, min: 0, max: 100, required: true },
  reasoning:          { type: String, required: true },
  geopoliticalFactors: [{ type: String }],
  riskFactors:        [{ type: String }],
  timeHorizon:        { type: String, enum: ['SHORT', 'MEDIUM', 'LONG'], default: 'MEDIUM' },
  correlatedAssets:   [{ type: String }],
  stopLossReasoning:  { type: String, default: '' },

  // Trigger metadata — was this user-triggered or auto-generated?
  triggerType:  { type: String, enum: ['manual', 'auto'], default: 'manual' },
  triggerEvent: { type: String, default: '' },  // title of event that triggered auto-signal

  // Auto-cleanup: MongoDB TTL index deletes docs 7 days after creation
  createdAt: { type: Date, default: Date.now, expires: 604800 }  // 7 days in seconds
});

// Compound index for efficient history queries
signalHistorySchema.index({ createdAt: -1 });
signalHistorySchema.index({ triggerType: 1, createdAt: -1 });

module.exports = mongoose.model('SignalHistory', signalHistorySchema);
