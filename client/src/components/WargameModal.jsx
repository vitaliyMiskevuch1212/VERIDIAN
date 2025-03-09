import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TerminalLoader from './TerminalLoader';

export default function WargameModal({ event, onClose }) {
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNode, setActiveNode] = useState(null);

  useEffect(() => {
    if (!event) return;
    setLoading(true);
    axios.post('/api/ai/wargame', {
      eventId: event.id,
      eventTitle: event.title,
      eventCountry: event.country
    })
      .then(res => setSimulation(res.data))
      .catch(err => {
        console.warn('Wargame fetch failed:', err.message);
        // Fallback handled in backend
      })
      .finally(() => setLoading(false));
  }, [event]);
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="w-full max-w-5xl h-[80vh] flex flex-col bg-[#0A0F1E] border border-[var(--color-cyan)]/30 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(0,212,255,0.1)] relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-code-branch text-[var(--color-cyan)] text-xl animate-pulse"></i>
            <div>
              <h2 className="text-white font-heading tracking-wider uppercase text-lg">Predictive Wargame Simulation</h2>
              <div className="text-[10px] text-[var(--color-cyan)] font-mono tracking-widest mt-0.5">TARGET: {event.title.substring(0, 60)}...</div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-2">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>