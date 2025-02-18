const mongoose = require('mongoose');

const eventCacheSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  latitude:  { type: Number, required: true },
  longitude: { type: Number, required: true },
  severity:  { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  country:   { type: String, default: '' },
  iso2:      { type: String, default: '' },
  type:      { type: String, default: 'general' },
  createdAt: { type: Date, default: Date.now, index: { expires: 3600 } } // TTL 1 hour
});

module.exports = mongoose.model('EventCache', eventCacheSchema);