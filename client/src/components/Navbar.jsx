import React, { useState, useEffect } from 'react';

// =============================================================================
// TACTICAL BUTTON — Reusable nav-bar action button
// =============================================================================
const TacticalButton = ({ label, icon, isLocked, accentColor = 'white' }) => (
  <button className="h-9 px-4 border rounded-md flex items-center gap-2 bg-gradient-to-r from-white/[0.04] to-transparent transition-all hover:from-white/[0.08] hover:to-white/[0.02] pointer-events-auto group outline-none btn-press"
          style={{ borderColor: `${accentColor}25` }}>
    {icon && <i className={`fa-solid ${icon} text-[11px]`} style={{ color: accentColor }}></i>}
    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] group-hover:text-white transition-colors" style={{ color: `${accentColor}90` }}>
      {label}
    </span>
    {isLocked && <i className="fa-solid fa-lock text-[8px] text-white/20 ml-1"></i>}
  </button>
);

// =============================================================================
// NAVBAR — Primary top-level navigation bar
// =============================================================================
export default function Navbar({ 
  activeCount = 0, 
  tensionCount = 0, 
  isCommsActive = false,
  onCommsToggle,
  onPredictionsClick,
  isConnected = false,
  serverClients = 0,
  defconLevel = 5,
}) {
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav className="relative h-16 border-b border-white/[0.06] bg-gradient-to-r from-[#040810] via-[#051120] to-[#040810] flex items-center justify-between px-6 z-[100]">

      {/* ── LEFT: Branding ── */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-satellite-dish text-[var(--color-cyan)] drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]" style={{ fontSize: 22 }}></i>
          <div className="flex flex-col">
            <span className="text-[var(--color-cyan)] font-heading font-black text-xl tracking-[0.12em] leading-none uppercase drop-shadow-[0_0_12px_rgba(0,212,255,0.15)]">VERIDIAN</span>
            <span className="text-white/25 font-mono text-[8px] tracking-[0.3em] uppercase mt-1">Geopolitical Intelligence</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2">
          {/* UTC Clock */}
          <div className="text-[var(--color-gold)] font-mono font-bold text-[13px] tracking-[0.15em] drop-shadow-[0_0_6px_rgba(245,158,11,0.35)]">
            {utcTime}
          </div>
          {/* Connection status */}
          <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-white/[0.08]">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[var(--color-green)] shadow-[0_0_6px_var(--color-green)] animate-pulse' : 'bg-[var(--color-red)] shadow-[0_0_6px_var(--color-red)]'}`}></div>
            <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${isConnected ? 'text-[var(--color-green)]/60' : 'text-[var(--color-red)]/60'}`}>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* ── CENTER: Mission Metrics ── */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center h-full">
        <div className="flex items-center gap-16 px-12 border-x border-white/[0.06] bg-white/[0.015] h-2/3 rounded-sm">
          
          {/* Active Status */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-mono-num font-black leading-none text-[var(--color-red)] drop-shadow-[0_0_10px_rgba(239,68,68,0.35)] metric-counter">
                {activeCount}
              </span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1.5 h-4 rounded-sm transition-all duration-500 ${i < activeCount ? 'bg-[var(--color-red)] shadow-[0_0_8px_var(--color-red)]' : 'bg-white/[0.04] border border-white/[0.06]'}`}
                  ></div>
                ))}
              </div>
            </div>
            <span className="text-[8px] font-semibold text-white/25 tracking-[0.3em] uppercase">Active Status</span>
          </div>
          
          {/* Divider */}
          <div className="w-[1px] h-8 bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

          {/* Tensions */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1.5 h-4 rounded-sm transition-all duration-500 ${i < tensionCount ? 'bg-[var(--color-gold)] shadow-[0_0_8px_var(--color-gold)]' : 'bg-white/[0.04] border border-white/[0.06]'}`}
                  ></div>
                ))}
              </div>
              <span className="text-2xl font-mono-num font-black leading-none text-[var(--color-gold)] drop-shadow-[0_0_10px_rgba(245,158,11,0.35)] metric-counter">
                {tensionCount}
              </span>
            </div>
            <span className="text-[8px] font-semibold text-white/25 tracking-[0.3em] uppercase">Intelligence Tensions</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Tactical HUD ── */}
      <div className="flex items-center gap-3">
        {/* Connected users */}
        <div className="flex items-center gap-2 mr-4 text-white/25 font-mono text-[10px]">
           <i className="fa-solid fa-users text-[9px]"></i>
           <span className="tracking-tighter">{serverClients > 0 ? serverClients : 248}+ USERS</span>
        </div>

        {/* FRIDAY status badge */}
        <div className="flex items-center gap-1.5 mr-2 pl-3 border-l border-white/[0.08]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)] shadow-[0_0_6px_var(--color-cyan)] animate-pulse"></div>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[var(--color-cyan)]/60">
            FRIDAY
          </span>
        </div>

        {/* Comms toggle */}
        <div onClick={onCommsToggle} className="mr-2 cursor-pointer">
            <TacticalButton 
              label={isCommsActive ? "Comms Active" : "Comms Off"} 
              icon={isCommsActive ? "fa-volume-high" : "fa-volume-xmark"} 
              accentColor={isCommsActive ? "var(--color-cyan)" : "var(--color-text-muted)"}
            />
        </div>

        {/* Predictions */}
        <div onClick={onPredictionsClick} className="cursor-pointer">
           <TacticalButton label="Predictions" icon="fa-bullseye" />
        </div>
        
        {/* Waveform */}
        <div className="ml-4 pl-4 border-l border-white/[0.08] h-8 flex items-center" style={{ color: isCommsActive ? 'var(--color-green)' : 'var(--color-text-muted)' }}>
           <i className={`fa-solid fa-wave-square text-sm ${isCommsActive ? 'animate-[pulse_1s_infinite]' : ''}`}></i>
        </div>
      </div>
    </nav>
  );
}