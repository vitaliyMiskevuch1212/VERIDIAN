const mongoose = require('mongoose');

const briefCacheSchema = new mongoose.Schema({
  countryName: { type: String, required: true, unique: true, index: true },
  briefText:   { type: String, required: true },
  stabilityScore: { type: Number, min: 0, max: 100, default: 50 },
  topRisks:    { type: [String], default: [] },
  outlook:     { type: String, enum: ['Stable', 'Deteriorating', 'Escalating', 'Crisis'], default: 'Stable' },
  sourceHeadlines: { type: [String], default: [] },
  topStocks: [{
    ticker: { type: String },
    name: { type: String },
    reasoning: { type: String }
  }],
  createdAt:   { type: Date, default: Date.now, index: { expires: 900 } } // TTL 15 minutes
});

module.exports = mongoose.model('BriefCache', briefCacheSchema);