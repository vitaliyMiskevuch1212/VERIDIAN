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
        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          {loading ? (
            <TerminalLoader context={`SIMULATING FUTURE BRANCHES FOR EVENT: ${event.id}`} />
          ) : simulation ? (
            <div className="absolute inset-0 flex flex-col p-6 overflow-y-auto custom-scrollbar">
              
              {/* SVG Decision Tree Header */}
              <div className="w-full flex flex-col items-center mb-8 relative">
                {/* Root Node */}
                <div className="bg-[#050A14] border border-[var(--color-cyan)]/50 p-4 w-3/4 md:w-1/2 text-center rounded-sm shadow-[0_0_30px_rgba(0,212,255,0.15)] relative z-10">
                  <div className="text-[10px] text-[var(--color-cyan)] uppercase tracking-[0.2em] mb-2 font-bold flex justify-center items-center gap-2">
                    <i className="fa-solid fa-microchip shrink-0"></i> 
                    <span>Base Assessment // Ground Truth</span>
                  </div>
                  <p className="text-white/80 text-xs leading-relaxed">{simulation.baseAssessment}</p>
                </div>
                
                {/* Branching SVG Lines */}
                <svg className="w-full h-[60px] pointer-events-none -mt-1 relative z-0" preserveAspectRatio="none">
                  {/* Left branch */}
                  <path d="M 50% 0 Q 50% 30, 16.6% 60" stroke="var(--color-border)" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-pulse" />
                  {/* Center branch */}
                  <path d="M 50% 0 L 50% 60" stroke="var(--color-border)" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-[pulse_1.5s_ease-in-out_infinite]" />
                  {/* Right branch */}
                  <path d="M 50% 0 Q 50% 30, 83.3% 60" stroke="var(--color-border)" strokeWidth="2" fill="none" strokeDasharray="4 4" className="animate-[pulse_2s_ease-in-out_infinite]" />
                </svg>
              </div>

              {/* Branching Timelines Container */}
              <div className="flex-1 flex flex-col md:flex-row gap-6 relative z-10">
                {simulation.timelines?.map((timeline, idx) => {
                  const isPositive = timeline.path.toLowerCase().includes('de-escalat') || timeline.path.toLowerCase().includes('peace');
                  const isNegative = timeline.path.toLowerCase().includes('kinetic') || timeline.path.toLowerCase().includes('escalat') || timeline.path.toLowerCase().includes('war');
                  const color = isPositive ? 'var(--color-green)' : isNegative ? 'var(--color-red)' : 'var(--color-orange)';
                  
                  return (
                    <div 
                      key={idx} 
                      className={`flex-1 flex flex-col bg-[#0D1520] border-t-4 transition-all duration-300 rounded-b-sm relative overflow-hidden group cursor-pointer ${activeNode === idx ? 'scale-[1.02] shadow-2xl z-20 bg-[#121B2A]' : 'hover:bg-[#121B2A] opacity-90 z-10'}`}
                      style={{ borderTopColor: color, borderColor: activeNode === idx ? color : 'var(--color-border)' }}
                      onMouseEnter={() => setActiveNode(idx)}
                      onMouseLeave={() => setActiveNode(null)}
                    >
                      {/* Probability Header */}
                      <div className="p-4 flex items-center justify-between border-b border-white/5 bg-black/20">
                        <span className="font-heading font-bold text-[11px] uppercase tracking-wider text-white">{timeline.path}</span>
                        <span className="font-mono text-lg font-bold" style={{ color }}>{timeline.probability}%</span>
                      </div>
                      {/* Body */}
                      <div className="p-4 flex-1 space-y-4">
                        <p className="text-[11px] text-white/50 leading-relaxed font-medium">{timeline.description}</p>
                        
                        <div>
                          <div className="text-[8px] uppercase tracking-widest text-white/30 mb-1">Geopolitical Impact</div>
                          <div className="text-[10px] text-white/70 pl-2 border-l border-white/10">{timeline.geopoliticalImpact}</div>
                        </div>

                        <div>
                          <div className="text-[8px] uppercase tracking-widest text-white/30 mb-1">Market Impact</div>
                          <div className="text-[10px] text-white/70 pl-2 border-l border-white/10">{timeline.marketImpact}</div>
                        </div>
                      </div>

                      {/* Footer Trigger */}
                      <div className="p-3 bg-black/40 border-t border-white/5">
                        <div className="text-[8px] text-[var(--color-cyan)] uppercase tracking-widest font-bold mb-1"><i className="fa-solid fa-crosshairs mr-1"></i> Key Trigger Indicator</div>
                        <div className="text-[10px] text-white/60">{timeline.keyTrigger}</div>
                      </div>

                      {/* Glow effect */}
                      <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: color, opacity: activeNode === idx ? 1 : 0.2 }} />
                      
                      {/* Active SVG Connector Highlight (pseudo-overlay) */}
                      {activeNode === idx && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full animate-pulse shadow-[0_0_10px_currentColor]" style={{ backgroundColor: color }}></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center p-10 h-full text-white/30">Failed to generate simulation.</div>
          )}
        </div>
      </div>
    </div>
  );
}
