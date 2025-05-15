import React from 'react';

/**
 * GlobalRiskIndex
 * ---------------
 * Displays a composite geopolitical risk score (0–98) derived from three
 * live intelligence feeds: critical events, military flights, and cyber threats.
 *
 * Props:
 *   context {Object}
 *     criticalEvents  {number} – count of active CRITICAL-severity geopolitical events
 *     militaryFlights {number} – number of tracked military aircraft in air theater
 *     cyberThreats    {number} – count of detected active cyber threat nodes
 */
export default function GlobalRiskIndex({ context }) {
  // Render nothing if intelligence context has not loaded yet
  if (!context) return null;

  // Destructure feed values with safe defaults
  const { criticalEvents = 0, militaryFlights = 0, cyberThreats = 0 } = context;

  // ── Composite Risk Score Calculation (0–98) ──────────────────────────────
  // Base offset ensures score never reads as "no risk" on an active platform
  const baseScore = 20;

  // Each feed is weighted and individually capped to prevent a single signal
  // from dominating the overall index
  const eventImpact    = Math.min(40, criticalEvents * 10);   // max 40 pts — highest weight (kinetic events are most acute)
  const militaryImpact = Math.min(20, militaryFlights / 5);   // max 20 pts
  const cyberImpact    = Math.min(20, cyberThreats / 3);      // max 20 pts

  // Hard cap at 98 — score of 100 is reserved to indicate total system failure / data unavailable
  const totalScore = Math.min(98, baseScore + eventImpact + militaryImpact + cyberImpact);

  /**
   * getStatus
   * Maps a numeric score to a human-readable threat label and its associated
   * CSS color token for consistent theming across the dashboard.
   */
  const getStatus = (score) => {
    if (score > 75) return { label: 'CRITICAL', color: 'var(--color-red)' };
    if (score > 40) return { label: 'ELEVATED', color: 'var(--color-orange)' };
    return { label: 'STABLE',    color: 'var(--color-green)' };
  };

  const status = getStatus(totalScore);

  return (
    // Outer card — dark gradient with subtle border for the glass-panel aesthetic
    <div className="mb-6 p-4 bg-gradient-to-br from-black/60 to-[#0A0F1E] border border-white/10 rounded-sm relative overflow-hidden">

      {/* Animated cyan scan-line along the top edge — signals live data feed */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--color-cyan)]/30 to-transparent animate-pulse"></div>

      {/* ── Header Row ── */}
      <div className="flex items-center justify-between mb-4">

        {/* Left: section label + large numeric score */}
        <div>
          <h3 className="text-[10px] font-heading uppercase tracking-[0.3em] text-white/50 mb-1">Geopolitical Strategic Index</h3>
          <div className="flex items-baseline gap-2">
            {/* Primary score — color reflects current threat status */}
            <span className="text-3xl font-mono-num font-bold tracking-tighter" style={{ color: status.color }}>{totalScore}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: status.color }}>/ 100</span>
          </div>
        </div>

        {/* Right: status badge + metric sub-label */}
        <div className="text-right">
          {/* Badge — border and background tinted from status color at reduced opacity */}
          <div
            className="px-2 py-1 border rounded-sm text-[9px] font-bold tracking-[0.2em]"
            style={{ color: status.color, borderColor: `${status.color}40`, background: `${status.color}10` }}
          >
            STATUS: {status.label}
          </div>
          <div className="text-[8px] text-white/30 font-mono mt-1 uppercase tracking-widest">Global Stability Metric</div>
        </div>
      </div>

      {/* ── 3-Column RiskStat Grid ── */}
      {/* Each RiskStat visualises one feed as a labelled bar relative to its ceiling */}
      <div className="grid grid-cols-3 gap-2">
        <RiskStat label="KINETIC EVENTS" val={criticalEvents}   max={10}  color="var(--color-red)"    />
        <RiskStat label="AIR THEATER"    val={militaryFlights}  max={100} color="var(--color-cyan)"   />
        <RiskStat label="CYBER NODES"    val={cyberThreats}     max={50}  color="var(--color-purple)" />
      </div>
    </div>
  );
}

/**
 * RiskStat
 * --------
 * Reusable stat card used by GlobalRiskIndex to display a single intelligence
 * feed as a labelled progress bar with a neon glow effect.
 *
 * Props:
 *   label {string} – uppercase display name (e.g. "KINETIC EVENTS")
 *   val   {number} – current live value
 *   max   {number} – ceiling used to compute fill percentage
 *   color {string} – CSS color token applied to bar fill and glow
 */
function RiskStat({ label, val, max, color }) {
  // Clamp to 100% so the bar never overflows its track
  const percent = Math.min(100, (val / max) * 100);

  return (
    <div className="bg-white/5 p-2 rounded-sm border border-white/5">

      {/* Stat label */}
      <div className="text-[7px] text-white/40 uppercase tracking-widest mb-1.5">{label}</div>

      {/* Current value (left) and target ceiling (right) */}
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[11px] font-mono-num font-bold text-white">{val}</span>
        <span className="text-[7px] text-white/20">TARGET: {max}</span>
      </div>

      {/* Progress bar track */}
      <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
        {/* Fill — 1s transition animates smoothly on live data updates; glow via box-shadow */}
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${percent}%`, backgroundColor: color, boxShadow: `0 0 5px ${color}` }}
        ></div>
      </div>
    </div>
  );
}