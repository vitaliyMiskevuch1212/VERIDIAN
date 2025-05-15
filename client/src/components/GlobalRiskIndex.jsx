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