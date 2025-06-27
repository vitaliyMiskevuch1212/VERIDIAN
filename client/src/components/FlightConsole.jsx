import React, { useMemo, useState } from 'react';

const CATEGORIES = [
  { id: 'all',       label: 'All Tracked', icon: 'fa-plane',      color: 'var(--color-cyan)' },
  { id: 'unknown',   label: 'Unknown',     icon: 'fa-question',   color: '#888'              },
  { id: 'isr',       label: 'ISR/AWACS',   icon: 'fa-satellite',  color: '#a78bfa'           },
  { id: 'transport', label: 'Transport',   icon: 'fa-truck-plane', color: '#60a5fa'           },
  { id: 'heli',      label: 'Helicopter',  icon: 'fa-helicopter', color: '#34d399'           },
  { id: 'tanker',    label: 'Tanker',      icon: 'fa-gas-pump',   color: '#fbbf24'           },
];

function mapToCategory(aircraftType = '') {
  const t = aircraftType.toLowerCase();
  if (t.includes('uav') || t.includes('recon') || t.includes('awacs') || t.includes('strategic')) return 'isr';
  if (t.includes('heavy') || t.includes('large') || t.includes('transport'))                       return 'transport';
  if (t.includes('rotor') || t.includes('heli'))                                                   return 'heli';
  if (t.includes('tanker') || t.includes('refuel'))                                                return 'tanker';
  if (t.includes('high') || t.includes('fighter') || t.includes('maneuv'))                        return 'isr';
  return 'unknown';
}

export default function FlightConsole({ flights = [], activeCategory, onCategoryChange }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const categoryCounts = useMemo(() => {
    const counts = { all: flights.length, unknown: 0, isr: 0, transport: 0, heli: 0, tanker: 0 };
    flights.forEach(f => {
      const cat = mapToCategory(f.aircraftType);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [flights]);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      <div
        className="backdrop-blur-xl border border-white/[0.08] rounded-md overflow-hidden transition-all duration-300 bg-gradient-to-b from-[#060B14]/85 to-[#0A0F1E]/92"
        style={{
          boxShadow: 'var(--shadow-lg), inset 0 1px 0 rgba(255,255,255,0.04)',
          minWidth: isExpanded ? 560 : 200,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-jet-fighter text-[var(--color-cyan)] text-xs drop-shadow-[0_0_4px_rgba(0,212,255,0.3)]"></i>
            <span className="text-white/70 text-[10px] font-semibold uppercase tracking-[0.2em]">Military Aircraft</span>
            <span className="text-[var(--color-cyan)] font-mono text-xs font-bold">{flights.length}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-white/20 text-[8px] font-mono uppercase">OpenSky Network</span>
            <i className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'up'} text-white/20 text-[10px] transition-transform`}></i>
          </div>
        </div>

        {/* Category pills */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-1 flex items-center gap-2 border-t border-white/[0.05]">
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;

              return (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all border btn-press ${
                    isActive
                      ? 'border-white/[0.12] bg-white/[0.08] text-white'
                      : 'border-white/[0.04] bg-white/[0.015] text-white/35 hover:text-white/60 hover:bg-white/[0.04]'
                  }`}
                >
                  <i
                    className={`fa-solid ${cat.icon}`}
                    style={{ color: isActive ? cat.color : undefined, fontSize: 9 }}
                  ></i>
                  <span>{cat.label}</span>
                  <span
                    className="font-mono"
                    style={{ color: isActive ? cat.color : 'inherit' }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export { mapToCategory };