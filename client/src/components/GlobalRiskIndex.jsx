import React from 'react';

export default function GlobalRiskIndex({ context }) {
  if (!context) return null;
  
  const { criticalEvents = 0, militaryFlights = 0, cyberThreats = 0 } = context;
  
  // Calculate a mock Risk Score (0-100)
  const baseScore = 20;
  const eventImpact = Math.min(40, criticalEvents * 10);
  const militaryImpact = Math.min(20, militaryFlights / 5);
  const cyberImpact = Math.min(20, cyberThreats / 3);
  const totalScore = Math.min(98, baseScore + eventImpact + militaryImpact + cyberImpact);
  
  const getStatus = (score) => {
    if (score > 75) return { label: 'CRITICAL', color: 'var(--color-red)' };
    if (score > 40) return { label: 'ELEVATED', color: 'var(--color-orange)' };
    return { label: 'STABLE', color: 'var(--color-green)' };
  };
  const status = getStatus(totalScore);

  return (
    <div className="mb-6 p-4 bg-gradient-to-br from-black/60 to-[#0A0F1E] border border-white/10 rounded-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--color-cyan)]/30 to-transparent animate-pulse"></div>
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[10px] font-heading uppercase tracking-[0.3em] text-white/50 mb-1">Geopolitical Strategic Index</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono-num font-bold tracking-tighter" style={{ color: status.color }}>{totalScore}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: status.color }}>/ 100</span>
          </div>
        </div>
        <div className="text-right">
          <div className="px-2 py-1 border rounded-sm text-[9px] font-bold tracking-[0.2em]" style={{ color: status.color, borderColor: `${status.color}40`, background: `${status.color}10` }}>
            STATUS: {status.label}
          </div>
          <div className="text-[8px] text-white/30 font-mono mt-1 uppercase tracking-widest">Global Stability Metric</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <RiskStat label="KINETIC EVENTS" val={criticalEvents} max={10} color="var(--color-red)" />
        <RiskStat label="AIR THEATER" val={militaryFlights} max={100} color="var(--color-cyan)" />
        <RiskStat label="CYBER NODES" val={cyberThreats} max={50} color="var(--color-purple)" />
      </div>
    </div>
  );
}

function RiskStat({ label, val, max, color }) {
  const percent = Math.min(100, (val / max) * 100);
  return (
    <div className="bg-white/5 p-2 rounded-sm border border-white/5">
      <div className="text-[7px] text-white/40 uppercase tracking-widest mb-1.5">{label}</div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[11px] font-mono-num font-bold text-white">{val}</span>
        <span className="text-[7px] text-white/20">TARGET: {max}</span>
      </div>
      <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className="h-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: color, boxShadow: `0 0 5px ${color}` }}></div>
      </div>
    </div>
  );
}
