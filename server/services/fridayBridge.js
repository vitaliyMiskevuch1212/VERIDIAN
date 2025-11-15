/**
 * fridayBridge.js — Socket.io bridge for FRIDAY voice agent
 */
let _io = null;

module.exports = {
  init(io) {
    _io = io;
    console.log('[FRIDAY] Bridge initialized — Socket.io relay ACTIVE');
  },
  emit(event, data) {
    if (_io) {
      _io.emit(event, data);
    } else {
      console.warn('[FRIDAY] Bridge not initialized — dropping event:', event);
    }
  },
  getIO() { return _io; }
};
