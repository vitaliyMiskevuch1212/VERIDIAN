import React, { useMemo, useState } from 'react';
import VesselInfoPopup from './VesselInfoPopup';

const CATEGORIES = [
  { id: 'all', label: 'All Tracked', icon: 'fa-anchor', color: '#00ff7f' },
  { id: 'cargo', label: 'Cargo', icon: 'fa-box', color: '#60a5fa' },
  { id: 'tanker', label: 'Tanker', icon: 'fa-oil-can', color: '#fbbf24' },
  { id: 'military', label: 'Military', icon: 'fa-ship', color: '#ef4444' },
  { id: 'passenger', label: 'Passenger', icon: 'fa-ferry', color: '#a78bfa' },
  { id: 'utility', label: 'Utility', icon: 'fa-sailboat', color: '#34d399' },
];

export default function VesselConsole({ vessels = [], activeCategory, onCategoryChange, onFlyTo }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showList, setShowList] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState(null);

  const categoryCounts = useMemo(() => {
    const counts = { all: vessels.length, cargo: 0, tanker: 0, military: 0, passenger: 0, utility: 0 };
    vessels.forEach(v => {
      const cat = (v.vesselType || 'cargo').toLowerCase();
      if (counts[cat] !== undefined) counts[cat]++;
    });
    return counts;
  }, [vessels]);

  const surgeCount = useMemo(() => vessels.filter(v => v.isSurge).length, [vessels]);

  // Filter vessels by active category for the list
  const displayedVessels = useMemo(() => {
    if (activeCategory === 'all') return vessels;
    return vessels.filter(v => (v.vesselType || 'cargo').toLowerCase() === activeCategory);
  }, [vessels, activeCategory]);

  return (
    <>
      {/* Position it to the right, safely above the bottom graphs */}
      <div className="absolute bottom-20 right-4 z-[60] pointer-events-auto">
        <div 
          className="backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden transition-all duration-300 bg-gradient-to-b from-[#060B14]/80 to-[#0A0F1E]/90"
          style={{ 
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            minWidth: isExpanded ? 500 : 200,
            maxWidth: 600
          }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-anchor text-[#00ff7f] text-xs"></i>
              <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em]">Maritime Traffic</span>
              <span className="text-[#00ff7f] font-mono text-xs font-bold">{vessels.length}</span>
              
              {/* Surge Badge */}
              {surgeCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider animate-pulse"
                  style={{ 
                    background: 'rgba(239,68,68,0.15)', 
                    color: '#f87171', 
                    border: '1px solid rgba(239,68,68,0.3)',
                    boxShadow: '0 0 8px rgba(239,68,68,0.2)'
                  }}>
                  <i className="fa-solid fa-burst text-[7px]" />
                  CHOKEPOINT SURGE {surgeCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/30 text-[8px] font-mono uppercase">AISSTREAM.IO</span>
              <i className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'up'} text-white/30 text-[10px] transition-transform`}></i>
            </div>
          </div>

          {/* Category Pills */}
          {isExpanded && (
            <div className="px-3 pb-3 pt-1 flex flex-wrap gap-2">
              {CATEGORIES.map(cat => {
                const count = categoryCounts[cat.id] || 0;
                const active = activeCategory === cat.id;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                        onCategoryChange(cat.id);
                        if(activeCategory === cat.id) setShowList(!showList);
                        else setShowList(true);
                    }}
                    className={`
                      flex items-center gap-2 px-2.5 py-1.5 rounded-sm border transition-all duration-200
                      ${active 
                        ? 'bg-white/10 border-white/20' 
                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'}
                    `}
                  >
                    <i className={`fa-solid ${cat.icon} text-[10px]`} style={{ color: cat.color }}></i>
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                      {cat.label}
                    </span>
                    <span className="font-mono text-[9px]" style={{ color: cat.color }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Expanded List View */}
          {isExpanded && showList && (
            <div className="max-h-[250px] overflow-y-auto border-t border-white/5 bg-black/40 custom-scrollbar">
              {displayedVessels.length === 0 ? (
                <div className="p-4 text-center text-white/40 text-xs font-mono">NO TARGETS IN CATEGORY</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#060B14] z-10">
                    <tr>
                      <th className="px-4 py-2 text-[8px] uppercase tracking-widest text-white/40 border-b border-white/5">Callsign</th>
                      <th className="px-4 py-2 text-[8px] uppercase tracking-widest text-white/40 border-b border-white/5">Type</th>
                      <th className="px-4 py-2 text-[8px] uppercase tracking-widest text-white/40 border-b border-white/5">Speed</th>
                      <th className="px-4 py-2 text-[8px] uppercase tracking-widest text-white/40 border-b border-white/5">Origin</th>
                      <th className="px-4 py-2 text-[8px] uppercase tracking-widest text-white/40 border-b border-white/5 right-align">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedVessels.slice(0, 50).map((v, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors group cursor-pointer border-b border-white/5"
                          onClick={() => setSelectedVessel(v)}>
                        <td className="px-4 py-2 border-r border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold font-mono text-white group-hover:text-[#00ff7f] transition-colors">{v.callsign}</span>
                            <span className="text-[8px] text-white/40 uppercase">MMSI: {v.mmsi}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 border-r border-white/5">
                          <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest">{v.vesselType}</span>
                        </td>
                        <td className="px-4 py-2 border-r border-white/5 text-[9px] text-white/70 font-mono">
                          {Math.round(v.speed)} kts
                        </td>
                        <td className="px-4 py-2 border-r border-white/5 text-[9px] text-white/70">
                          {v.origin}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onFlyTo) onFlyTo({ lat: v.lat, lng: v.lng });
                            }}
                            className="bg-white/10 hover:bg-[#00ff7f]/20 hover:text-[#00ff7f] text-white/50 w-6 h-6 rounded flex items-center justify-center transition-colors"
                          >
                            <i className="fa-solid fa-location-crosshairs text-[10px]"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
