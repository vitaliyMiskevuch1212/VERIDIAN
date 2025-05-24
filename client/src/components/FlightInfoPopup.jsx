import React, { useEffect, useRef } from 'react';

// SVG Aircraft silhouettes by type
const SILHOUETTES = {
  fighter: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M60 10 L58 40 L30 55 L30 60 L58 52 L57 85 L42 95 L42 100 L60 92 L78 100 L78 95 L63 85 L62 52 L90 60 L90 55 L62 40 Z" 
        fill="currentColor" stroke="currentColor" strokeWidth="0.5" opacity="0.9"/>
    </svg>
  ),
  transport: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M60 8 L56 35 L20 52 L20 58 L56 48 L55 88 L35 100 L35 106 L60 95 L85 106 L85 100 L65 88 L64 48 L100 58 L100 52 L64 35 Z"
        fill="currentColor" stroke="currentColor" strokeWidth="0.5" opacity="0.9"/>
    </svg>
  ),
  bomber: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M60 12 L55 30 L10 50 L15 58 L55 45 L54 80 L30 95 L32 102 L60 90 L88 102 L90 95 L66 80 L65 45 L105 58 L110 50 L65 30 Z"
        fill="currentColor" stroke="currentColor" strokeWidth="0.5" opacity="0.9"/>
    </svg>
  ),
  helicopter: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M60 15 L58 20 L20 20 L20 24 L58 24 L58 40 L45 45 L45 50 L58 47 L58 80 L50 85 L50 95 L55 90 L55 100 L58 100 L58 105 L62 105 L62 100 L65 100 L65 90 L70 95 L70 85 L62 80 L62 47 L75 50 L75 45 L62 40 L62 24 L100 24 L100 20 L62 20 Z"
        fill="currentColor" stroke="currentColor" strokeWidth="0.5" opacity="0.9"/>
    </svg>
  ),
  drone: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M60 15 L57 40 L25 48 L25 53 L57 47 L56 75 L42 82 L42 88 L56 82 L56 95 L58 100 L62 100 L64 95 L64 82 L78 88 L78 82 L64 75 L63 47 L95 53 L95 48 L63 40 Z"
        fill="currentColor" stroke="currentColor" strokeWidth="0.5" opacity="0.9"/>
      <circle cx="60" cy="30" r="4" fill="currentColor" opacity="0.6"/>
    </svg>
  ),
  recon: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M60 8 L56 32 L15 48 L15 54 L56 44 L55 82 L38 92 L38 98 L60 88 L82 98 L82 92 L65 82 L64 44 L105 54 L105 48 L64 32 Z"
        fill="currentColor" stroke="currentColor" strokeWidth="0.5" opacity="0.9"/>
      <ellipse cx="60" cy="20" rx="5" ry="8" fill="currentColor" opacity="0.4"/>
    </svg>
  ),
  unknown: (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <path d="M60 15 L57 40 L32 52 L32 57 L57 48 L56 82 L44 90 L44 96 L60 88 L76 96 L76 90 L64 82 L63 48 L88 57 L88 52 L63 40 Z"
        fill="currentColor" stroke="currentColor" strokeWidth="0.5" opacity="0.9"/>
    </svg>
  ),
};

function SectionHeader({ title, color = '#00D4FF' }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5" style={{ background: color, }}>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-black/90">{title}</span>
    </div>
  );
}

function DataRow({ label, value, valueColor, mono = true }) {
  return (
    <div className="flex items-center justify-between px-4 py-[5px] border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
      <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">{label}</span>
      <span className={`text-[11px] ${mono ? 'font-mono' : ''} font-bold text-right`} style={{ color: valueColor || 'rgba(255,255,255,0.85)' }}>
        {value || 'n/a'}
      </span>
    </div>
  );
}

export default function FlightInfoPopup({ flight, onClose, onFlyTo }) {
  const popupRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    }
    function handleEsc(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!flight) return null;

  const silhouetteKey = flight.silhouette || 'unknown';
  const silhouetteColor = flight.isNearConflict ? '#f97316' : flight.isSurge ? '#ef4444' : '#00D4FF';
  const vertStatus = flight.verticalRate > 100 ? '▲ CLIMBING' : flight.verticalRate < -100 ? '▼ DESCENDING' : '— LEVEL';
  const vertColor = flight.verticalRate > 100 ? '#34d399' : flight.verticalRate < -100 ? '#f87171' : '#00D4FF';
  const altDisplay = flight.altitude ? `${flight.altitude.toLocaleString()} ft` : 'on ground';
  const vertRateDisplay = flight.verticalRate ? `${flight.verticalRate > 0 ? '▲' : '▼'} ${Math.abs(flight.verticalRate)} ft/min` : 'n/a';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div
        ref={popupRef}
        className="relative w-[440px] max-h-[90vh] overflow-y-auto rounded-xl border border-white/10 custom-scrollbar"
        style={{
          background: 'linear-gradient(160deg, rgba(6,11,20,0.98) 0%, rgba(10,15,30,0.99) 100%)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 40px rgba(0,212,255,0.08)',
          animation: 'popIn 0.25s ease-out'
        }}
      >
        {/* ── Top Bar: Callsign + Close ──────────────────── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10" style={{ background: 'rgba(0,212,255,0.05)' }}>
          <div className="flex items-center gap-3">
            <span className="text-white font-mono text-lg font-black tracking-widest">{flight.callsign}</span>
            {flight.isNearConflict && (
              <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-orange-300 border border-orange-500/30 animate-pulse"
                style={{ background: 'rgba(249,115,22,0.15)' }}>
                <i className="fa-solid fa-triangle-exclamation mr-1" />{flight.nearConflictZone}
              </span>
            )}
            {flight.isSurge && (
              <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-red-300 border border-red-500/30 animate-pulse"
                style={{ background: 'rgba(239,68,68,0.15)' }}>
                SURGE
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-white/30 hover:text-white transition-colors bg-transparent border-none cursor-pointer rounded hover:bg-white/5">
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* ── Aircraft Visual + ID ──────────────────────── */}
        <div className="flex border-b border-white/5">
          {/* Silhouette */}
          <div className="w-[140px] flex-shrink-0 border-r border-white/5 flex flex-col items-center justify-center p-4 gap-2"
            style={{ background: 'rgba(0,0,0,0.3)', color: silhouetteColor }}>
            <div className="w-20 h-20">
              {SILHOUETTES[silhouetteKey] || SILHOUETTES.unknown}
            </div>
            <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/30">{silhouetteKey.toUpperCase()}</span>
          </div>

          {/* Aircraft ID Data */}
          <div className="flex-1 flex flex-col">
            <DataRow label="Hex / ICAO" value={flight.icao24 || 'UNKNOWN'} valueColor="#00D4FF" />
            <DataRow label="Origin" value={flight.origin} />
            <DataRow label="Type" value={flight.aircraftType} mono={false} />
            <DataRow label="Squawk" value={flight.squawk || 'n/a'} valueColor={flight.squawk === '7700' ? '#ef4444' : flight.squawk === '7600' ? '#f97316' : undefined} />
            <DataRow label="Source" value={flight.source || 'OpenSky'} valueColor="#00D4FF" />
          </div>
        </div>

        {/* ── SPATIAL Section ───────────────────────────── */}
        <SectionHeader title="Spatial" color="#00D4FF" />
        <div className="grid grid-cols-2">
          <div className="border-r border-white/5">
            <DataRow label="Groundspeed" value={flight.velocity ? `${flight.velocity} kts` : 'n/a'} />
            <DataRow label="Baro. Altitude" value={altDisplay} />
            <DataRow label="Vert. Rate" value={vertRateDisplay} valueColor={vertColor} />
          </div>
          <div>
            <DataRow label="Track" value={flight.heading != null ? `${flight.heading}°` : 'n/a'} />
            <DataRow label="Bearing" value={flight.headingCompass || 'n/a'} />
            <DataRow label="Status" value={vertStatus} valueColor={vertColor} />
          </div>
        </div>
        <div className="border-t border-white/5">
          <DataRow label="Position" value={`${flight.lat?.toFixed(3)}°, ${flight.lng?.toFixed(3)}°`} />
        </div>

        {/* ── HEADING Compass ───────────────────────────── */}
        <div className="border-t border-white/5 px-4 py-3 flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg viewBox="0 0 64 64" className="w-full h-full">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(0,212,255,0.12)" strokeWidth="1"/>
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(0,212,255,0.25)" strokeWidth="1" strokeDasharray="4 4"/>
              <text x="32" y="8" fill="rgba(255,255,255,0.35)" fontSize="6" textAnchor="middle" fontFamily="monospace">N</text>
              <text x="32" y="60" fill="rgba(255,255,255,0.35)" fontSize="6" textAnchor="middle" fontFamily="monospace">S</text>
              <text x="6" y="34" fill="rgba(255,255,255,0.35)" fontSize="6" textAnchor="middle" fontFamily="monospace">W</text>
              <text x="58" y="34" fill="rgba(255,255,255,0.35)" fontSize="6" textAnchor="middle" fontFamily="monospace">E</text>
              {flight.heading != null && (
                <g transform={`rotate(${flight.heading}, 32, 32)`}>
                  <line x1="32" y1="32" x2="32" y2="10" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round"/>
                  <polygon points="32,7 28,15 36,15" fill="#00D4FF"/>
                  <line x1="32" y1="32" x2="32" y2="50" stroke="rgba(0,212,255,0.3)" strokeWidth="1"/>
                </g>
              )}
              <circle cx="32" cy="32" r="2" fill="#00D4FF"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-white/30 uppercase tracking-wider font-bold mb-1">Projected Route</div>
            <div className="text-white/70 text-xs font-mono">
              Bearing {flight.heading ?? '—'}° ({flight.headingCompass || 'N/A'})
            </div>
            {flight.destLat != null && flight.destLng != null && (
              <div className="text-white/40 text-[10px] font-mono mt-0.5">
                Est. Dest: {flight.destLat.toFixed(2)}°, {flight.destLng.toFixed(2)}°
              </div>
            )}
          </div>
        </div>

        {/* ── ROUTE Arc Visualization ──────────────────── */}
        {flight.destLat != null && flight.destLng != null && (
          <div className="border-t border-white/5">
            <SectionHeader title="Flight Vector" color={flight.isNearConflict ? '#f97316' : '#00D4FF'} />
            <div className="px-4 py-3">
              <svg viewBox="0 0 380 55" className="w-full h-12" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#00D4FF" stopOpacity="0.6" />
                    <stop offset="100%" stopColor={flight.isNearConflict ? '#f97316' : '#34d399'} stopOpacity="0.3" />
                  </linearGradient>
                  <linearGradient id="altGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="15%" stopColor="#f97316" />
                    <stop offset="30%" stopColor="#eab308" />
                    <stop offset="50%" stopColor="#22c55e" />
                    <stop offset="75%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                {/* Grid */}
                {[0,1,2,3,4,5,6,7].map(i => (
                  <line key={i} x1={i*50+15} y1="0" x2={i*50+15} y2="55" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5"/>
                ))}
                {/* Route arc */}
                <path d="M 15,45 Q 190,-5 365,45" fill="none" stroke="url(#routeGrad)" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M 15,45 Q 190,-5 365,45" fill="none" stroke="url(#routeGrad)" strokeWidth="8" strokeLinecap="round" opacity="0.08"/>
                {/* Origin pulse */}
                <circle cx="15" cy="45" r="4" fill="#00D4FF">
                  <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
                </circle>
                {/* Destination */}
                <circle cx="365" cy="45" r="3" fill={flight.isNearConflict ? '#f97316' : '#34d399'} opacity="0.6"/>
                {/* Moving aircraft dot */}
                <circle r="2.5" fill="#ffffff">
                  <animateMotion dur="4s" repeatCount="indefinite" path="M 15,45 Q 190,-5 365,45"/>
                </circle>
                {/* Altitude color bar */}
                <rect x="15" y="50" width="350" height="3" rx="1.5" fill="url(#altGrad)" opacity="0.4"/>
              </svg>
              <div className="flex justify-between text-[7px] font-mono text-white/25 mt-1 px-1">
                <span>CURRENT POS ({flight.lat?.toFixed(1)}°, {flight.lng?.toFixed(1)}°)</span>
                <span className="text-center">ALT {altDisplay}</span>
                <span>EST DEST ({flight.destLat?.toFixed(1)}°, {flight.destLng?.toFixed(1)}°)</span>
              </div>
            </div>
          </div>
        )}

        {/* ── SIGNAL Section ───────────────────────────── */}
        <SectionHeader title="Signal" color="#22c55e" />
        <div className="grid grid-cols-2">
          <div className="border-r border-white/5">
            <DataRow label="Source" value={flight.source || 'ADS-B'} valueColor="#22c55e" />
            <DataRow label="ICAO24" value={flight.icao24 || 'n/a'} />
          </div>
          <div>
            <DataRow label="Data Feed" value="LIVE" valueColor="#22c55e" />
            <DataRow label="Refresh" value="60s" />
          </div>
        </div>

        {/* ── Action Bar ────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-white/10 flex items-center gap-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
          <button
            onClick={() => { onFlyTo?.(flight); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer bg-transparent hover:scale-[1.02]"
            style={{ 
              borderColor: 'rgba(0,212,255,0.3)', 
              color: '#00D4FF',
              boxShadow: '0 0 15px rgba(0,212,255,0.05)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <i className="fa-solid fa-crosshairs text-xs" />
            Track on Globe
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-white/10 text-white/40 hover:text-white/70 cursor-pointer bg-transparent"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Dismiss
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}