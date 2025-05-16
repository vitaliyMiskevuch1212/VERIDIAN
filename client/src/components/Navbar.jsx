import React, { useState, useEffect } from 'react';

// =============================================================================
// TACTICAL BUTTON — Reusable nav-bar action button with icon + label + lock state
// =============================================================================
// A minimal, borderless-style button used across the navbar's right-side HUD.
// Accepts an optional accent color that tints the icon and label, falling back
// to white. The `isLocked` flag appends a lock icon for permission-gated actions.
// Hover state lightens label to full white via Tailwind group-hover utility.
// `pointer-events-auto` is set explicitly because parent containers may disable
// pointer events for overlay/z-index layering purposes.
// =============================================================================
const TacticalButton = ({ label, icon, isLocked, accentColor = 'white' }) => (
  <button className="h-8 px-3 border rounded-sm flex items-center gap-2 bg-transparent transition-all hover:bg-white/5 pointer-events-auto group outline-none"
          style={{ borderColor: `${accentColor}30` }}>
    {icon && <i className={`fa-solid ${icon} text-[10px]`} style={{ color: accentColor }}></i>}
    <span className="text-[9px] font-bold uppercase tracking-[0.2em] group-hover:text-white transition-colors" style={{ color: `${accentColor}80` }}>
      {label}
    </span>
    {isLocked && <i className="fa-solid fa-lock text-[8px] text-white/20 ml-1"></i>}
  </button>
);

// =============================================================================
// NAVBAR — Primary top-level navigation bar for the Veridian dashboard
// =============================================================================
// Layout: 3-column flex with absolute-centered metrics panel
//   [LEFT]   Branding + UTC clock + connection status
//   [CENTER] Mission metrics — active count & tension count with tactical bars
//   [RIGHT]  User count, comms toggle, predictions button, waveform indicator
//
// Props:
//   activeCount      — Number of active crisis events (0–5), drives red bar fill
//   tensionCount     — Number of intelligence tensions (0–5), drives gold bar fill
//   isCommsActive    — Boolean toggle for comms on/off state (affects icon + label)
//   onCommsToggle    — Callback fired when the comms button is clicked
//   onPredictionsClick — Callback fired when the predictions button is clicked
//   isConnected      — WebSocket connection status (drives LIVE/OFFLINE indicator)
//   serverClients    — Current connected user count from the server
//   defconLevel      — DEFCON level (1–5), reserved for future threat-level theming
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

  // ---------------------------------------------------------------------------
  // UTC CLOCK — Ticks every second, formatted as HH:MM:SS UTC
  // Uses ISO string slicing (chars 11–19) for zero-padded output.
  // Interval is cleaned up on unmount to prevent memory leaks.
  // ---------------------------------------------------------------------------
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
    // -------------------------------------------------------------------------
    // ROOT NAV — Fixed height (h-16), pinned above all content via z-[100].
    // Dark background (#051120) with a subtle bottom border for separation.
    // -------------------------------------------------------------------------
    <nav className="relative h-16 border-b border-white/10 bg-[#051120] flex items-center justify-between px-6 z-[100]">

      {/* ================================================================== */}
      {/* SECTION 1: BRANDING (Left)                                         */}
      {/* Logo icon + product name + tagline, followed by the UTC clock      */}
      {/* and the WebSocket connection status indicator (green/red dot).      */}
      {/* ================================================================== */}
      <div className="flex items-center gap-6">
        {/* Brand mark — satellite dish icon + VERIDIAN wordmark + subtitle */}
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-satellite-dish text-[var(--color-cyan)]" style={{ fontSize: 24 }}></i>
          <div className="flex flex-col">
            <span className="text-[var(--color-cyan)] font-heading font-black text-xl tracking-[0.1em] leading-none uppercase">VERIDIAN</span>
            <span className="text-white/30 font-mono text-[8px] tracking-[0.3em] uppercase mt-1">Geopolitical Intelligence</span>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-2">
          {/* UTC clock — gold monospace readout with ambient glow */}
          <div className="text-[var(--color-gold)] font-mono font-bold text-[13px] tracking-[0.2em] drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]">
            {utcTime}
          </div>
          {/* WebSocket connection status — pulsing green dot when live,
              static red dot when disconnected. Separated from the clock
              by a left border divider. */}
          <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[var(--color-green)] shadow-[0_0_6px_var(--color-green)] animate-pulse' : 'bg-[var(--color-red)] shadow-[0_0_6px_var(--color-red)]'}`}></div>
            <span className={`text-[8px] font-mono font-bold uppercase tracking-widest ${isConnected ? 'text-[var(--color-green)]/70' : 'text-[var(--color-red)]/70'}`}>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* SECTION 2: MISSION METRICS (Center — absolute positioned)          */}
      {/* Two tactical bar clusters showing active crises and tensions.       */}
      {/* Absolute-centered via left-1/2 + -translate-x-1/2 to remain       */}
      {/* perfectly centered regardless of left/right content width.          */}
      {/* Each cluster: numeric count + 5-segment bar (filled segments glow) */}
      {/* ================================================================== */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center h-full">
        <div className="flex items-center gap-16 px-12 border-x border-white/5 h-2/3">
          
          {/* ACTIVE BAR — Red-themed, count on left, bars on right.
              Each of the 5 bar segments lights up red with a box-shadow glow
              when its index is less than activeCount. Unfilled segments show
              as dim bordered placeholders. */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-mono-num font-black leading-none text-[var(--color-red)] drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                {activeCount}
              </span>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1.5 h-4 rounded-sm transition-all duration-500 ${i < activeCount ? 'bg-[var(--color-red)] shadow-[0_0_8px_var(--color-red)]' : 'bg-white/5 border border-white/5'}`}
                  ></div>
                ))}
              </div>
            </div>
            <span className="text-[8px] font-bold text-white/30 tracking-[0.3em] uppercase">Active Status</span>
          </div>
          
          {/* Vertical divider between the two metric clusters */}
          <div className="w-[1px] h-8 bg-white/10"></div>

          {/* TENSIONS BAR — Gold-themed, bars on left, count on right.
              Mirrors the active bar layout but with reversed element order
              for visual symmetry across the center divider. */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1.5 h-4 rounded-sm transition-all duration-500 ${i < tensionCount ? 'bg-[var(--color-gold)] shadow-[0_0_8px_var(--color-gold)]' : 'bg-white/5 border border-white/5'}`}
                  ></div>
                ))}
              </div>
              <span className="text-2xl font-mono-num font-black leading-none text-[var(--color-gold)] drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
                {tensionCount}
              </span>
            </div>
            <span className="text-[8px] font-bold text-white/30 tracking-[0.3em] uppercase">Intelligence Tensions</span>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* SECTION 3: TACTICAL HUD (Right)                                    */}
      {/* Connected user count, comms toggle, predictions CTA, and a         */}
      {/* waveform indicator that pulses when comms are active.               */}
      {/* ================================================================== */}
      <div className="flex items-center gap-3">

        {/* Connected users — falls back to "248+" when serverClients is 0
            (pre-connection placeholder to avoid showing an empty count) */}
        <div className="flex items-center gap-2 mr-4 text-white/30 font-mono text-[10px]">
           <i className="fa-solid fa-users text-[8px]"></i>
           <span className="tracking-tighter">{serverClients > 0 ? serverClients : 248}+ USERS</span>
        </div>

        {/* Comms toggle — swaps between "Comms Active" (cyan) and
            "Comms Off" (muted) states. onClick is on the wrapper div
            because TacticalButton doesn't forward onClick internally. */}
        <div onClick={onCommsToggle} className="mr-2">
            <TacticalButton 
              label={isCommsActive ? "Comms Active" : "Comms Off"} 
              icon={isCommsActive ? "fa-volume-high" : "fa-volume-xmark"} 
              accentColor={isCommsActive ? "var(--color-cyan)" : "var(--color-text-muted)"}
            />
        </div>

        {/* Predictions CTA — opens the predictions panel/modal */}
        <div onClick={onPredictionsClick}>
           <TacticalButton label="Predictions" icon="fa-bullseye-arrow" />
        </div>
        
        {/* Waveform indicator — visual audio/comms heartbeat.
            Pulses with a 1s infinite animation when comms are active,
            static and muted when comms are off. Separated from buttons
            by a left border divider for visual grouping. */}
        <div className="ml-4 pl-4 border-l border-white/10 h-8 flex items-center" style={{ color: isCommsActive ? 'var(--color-green)' : 'var(--color-text-muted)' }}>
           <i className={`fa-solid fa-waveform-path text-sm ${isCommsActive ? 'animate-[pulse_1s_infinite]' : ''}`}></i>
        </div>
      </div>
    </nav>
  );
}