import React from 'react';

export default function GlobalRiskIndex({ context }) {
  if (!context) return null;

  const { criticalEvents = 0, militaryFlights = 0, cyberThreats = 0 } = context;

  const baseScore = 20;
  const eventImpact    = Math.min(40, criticalEvents * 10);
  const militaryImpact = Math.min(20, militaryFlights / 5);
  const cyberImpact    = Math.min(20, cyberThreats / 3);
  const totalScore = Math.min(98, baseScore + eventImpact + militaryImpact + cyberImpact);

  const getStatus = (score) => {
    if (score > 75) return { label: 'CRITICAL', color: 'var(--color-red)' };
    if (score > 40) return { label: 'ELEVATED', color: 'var(--color-orange)' };
    return { label: 'STABLE',    color: 'var(--color-green)' };
  };

  const status = getStatus(totalScore);

  return (
    <div className="mb-6 p-5 bg-gradient-to-br from-black/50 to-[#0A0F1E] border border-white/[0.06] rounded-md relative overflow-hidden">

      {/* Animated scan-line */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--color-cyan)]/25 to-transparent animate-pulse"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[10px] font-heading uppercase tracking-[0.25em] text-white/40 mb-1.5">Geopolitical Strategic Index</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono-num font-bold tracking-tighter metric-counter" style={{ color: status.color }}>{totalScore}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50" style={{ color: status.color }}>/ 100</span>
          </div>
        </div>

        <div className="text-right">
          <div
            className="px-2.5 py-1 border rounded-md text-[9px] font-bold tracking-[0.15em]"
            style={{ color: status.color, borderColor: `${status.color}30`, background: `${status.color}08` }}
          >
            STATUS: {status.label}
          </div>
          <div className="text-[8px] text-white/25 font-mono mt-1.5 uppercase tracking-widest">Global Stability Metric</div>
        </div>
      </div>

      {/* Risk Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <RiskStat label="KINETIC EVENTS" val={criticalEvents}   max={10}  color="var(--color-red)"    />
        <RiskStat label="AIR THEATER"    val={militaryFlights}  max={100} color="var(--color-cyan)"   />
        <RiskStat label="CYBER NODES"    val={cyberThreats}     max={50}  color="var(--color-purple)" />
      </div>
    </div>
  );
}

function RiskStat({ label, val, max, color }) {
  const percent = Math.min(100, (val / max) * 100);

  return (
    <div className="bg-white/[0.03] p-2.5 rounded-md border border-white/[0.04]">
      <div className="text-[8px] text-white/35 uppercase tracking-widest mb-1.5">{label}</div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[12px] font-mono-num font-bold text-white">{val}</span>
        <span className="text-[7px] text-white/15">TARGET: {max}</span>
      </div>
      <div className="h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${percent}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}40` }}
        ></div>
      </div>
    </div>
  );
}