import React from 'react';

// Common mapping for vessel types to SVGs
const VESSEL_ICONS = {
  cargo: "M4 6 L20 6 L20 18 L16 22 L8 22 L4 18 Z",
  tanker: "M2 8 L22 8 L22 16 L20 20 L4 20 L2 16 Z",
  military: "M2 12 L12 4 L22 12 L20 20 L4 20 Z",
  passenger: "M4 8 L20 8 L22 16 L20 20 L4 20 L2 16 Z",
  utility: "M6 8 L18 8 L18 16 L14 22 L10 22 L6 16 Z"
};

const DataRow = ({ label, value, color = 'rgba(255,255,255,0.8)', highlight = false }) => (
  <div className={`flex justify-between items-center py-1.5 border-b border-white/5`}>
    <span className="text-[9px] uppercase tracking-widest text-[#00ff7f]/60 font-medium">
      {label}
    </span>
    <span className={`text-[10px] font-mono font-bold tracking-tight text-right ${highlight ? 'animate-pulse' : ''}`} style={{ color }}>
      {value}
    </span>
  </div>
);

export default function VesselInfoPopup({ vessel, onClose, onFlyTo }) {
  if (!vessel) return null;

  const typeLow = (vessel.vesselType || 'cargo').toLowerCase();
  const IconPath = VESSEL_ICONS[typeLow] || VESSEL_ICONS['cargo'];

  const color = vessel.isSurge ? '#ef4444' : '#00ff7f';
  const glow = vessel.isSurge ? 'rgba(239,68,68,0.3)' : 'rgba(0,255,127,0.3)';

  return (
    <div className="absolute top-20 right-4 z-50 w-80 animate-fade-in-up">
      <div 
        className="backdrop-blur-2xl bg-[#060B14]/85 border border-white/10 rounded overflow-hidden shadow-2xl relative"
        style={{ boxShadow: `0 0 40px ${glow}` }}
      >
        {/* Header Ribbon */}
        <div className="h-1 w-full" style={{ background: color }}></div>

        {/* Top Header */}
        <div className="flex items-start justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0" style={{ borderColor: color }}>
               <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={color} strokeWidth="1.5">
                 <path d={IconPath} />
               </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-black font-mono tracking-tight text-white uppercase">{vessel.callsign}</span>
                {vessel.isSurge && (
                   <span className="px-1.5 py-0.5 bg-red-500/20 text-red-500 border border-red-500/30 font-bold uppercase tracking-widest text-[8px] animate-pulse rounded-sm">
                     SURGE WARNING
                   </span>
                )}
              </div>
              <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color }}>
                 {vessel.vesselType} CLASS
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        {/* Tactical Telemetry Map/Heading Viz */}
        <div className="h-20 bg-black/40 border-y border-white/10 relative overflow-hidden flex items-center justify-center">
            {/* Grid Pattern */}
            <div className="absolute inset-0" style={{ 
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', 
              backgroundSize: '10px 10px',
              opacity: 0.5
            }}></div>
            
            {/* Compass Base */}
            <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center relative">
               <div className="absolute top-0 text-[6px] text-white/30 font-mono -mt-1 bg-[#060B14] px-1">N</div>
               <div className="absolute bottom-0 text-[6px] text-white/30 font-mono -mb-1 bg-[#060B14] px-1">S</div>
               <div className="absolute right-0 text-[6px] text-white/30 font-mono -mr-1 bg-[#060B14] py-1">E</div>
               <div className="absolute left-0 text-[6px] text-white/30 font-mono -ml-1 bg-[#060B14] py-1">W</div>
               
               {/* Ship SVG rotated to heading */}
               <svg 
                  viewBox="0 0 24 24" 
                  width="20" height="20" 
                  fill={color} 
                  opacity="0.8"
                  style={{ transform: `rotate(${Math.round(vessel.heading)}deg)`, transition: 'transform 0.5s' }}
               >
                 <path d="M12 2 L9 8 L9 20 L15 20 L15 8 Z" />
               </svg>
            </div>

            <div className="absolute top-2 right-2 text-right">
                <div className="text-[8px] tracking-widest uppercase text-white/40 font-bold mb-0.5">Heading</div>
                <div className="text-[12px] text-white font-mono font-bold">{Math.round(vessel.heading)}°</div>
            </div>
            
            <div className="absolute bottom-2 left-2 text-left">
                <div className="text-[8px] tracking-widest uppercase text-white/40 font-bold mb-0.5">Speed</div>
                <div className="text-[12px] text-white font-mono font-bold">{Math.round(vessel.speed)} <span className="text-[8px] text-[#00ff7f]">KTS</span></div>
            </div>
        </div>

        {/* Data Grid */}
        <div className="p-4 grid grid-cols-1 gap-0">
          <DataRow label="Ship MMSI" value={vessel.mmsi} color="#fff" />
          <DataRow label="Origin" value={vessel.origin || 'UNKNOWN'} color="#fff" />
          
          <div className="flex gap-4 mt-2">
            <div className="flex-1">
              <span className="block text-[8px] uppercase tracking-widest text-white/40 mb-1">LATITUDE</span>
              <span className="block text-[11px] font-mono font-bold text-white tracking-widest">{vessel.lat.toFixed(4)}</span>
            </div>
            <div className="flex-1">
              <span className="block text-[8px] uppercase tracking-widest text-white/40 mb-1">LONGITUDE</span>
              <span className="block text-[11px] font-mono font-bold text-white tracking-widest">{vessel.lng.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex border-t border-white/10 bg-black/20">
          <button 
            onClick={() => onFlyTo(vessel)}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-[9px] uppercase tracking-widest font-bold text-white hover:bg-white/5 transition-colors"
          >
            <i className="fa-solid fa-crosshairs text-[10px]" style={{ color }}></i>
            TRACK
          </button>
        </div>

      </div>
      
      {/* Laser line pointing from popup to target */}
      <div className="absolute top-1/2 -left-12 w-12 h-[1px] -mt-[0.5px] pointer-events-none" style={{
        background: `linear-gradient(90deg, transparent, ${color})`
      }}></div>
    </div>
  );
}