import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

// ── Status Badge ────────────────────────────────────────────────────
const STATUS_CONFIG = {
  DISRUPTED:  { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  icon: 'fa-circle-xmark',      label: 'DISRUPTED', glow: 'rgba(239,68,68,0.2)' },
  ELEVATED:   { color: '#F97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', icon: 'fa-triangle-exclamation', label: 'ELEVATED',  glow: 'rgba(249,115,22,0.15)' },
  MONITORING: { color: '#EAB308', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)',  icon: 'fa-eye',                label: 'MONITORING', glow: 'rgba(234,179,8,0.1)' },
  CLEAR:      { color: '#00FF88', bg: 'rgba(0,255,136,0.08)',  border: 'rgba(0,255,136,0.2)',  icon: 'fa-circle-check',       label: 'CLEAR',     glow: 'rgba(0,255,136,0.08)' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.CLEAR;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.15em] rounded-sm border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border, boxShadow: `0 0 12px ${cfg.glow}` }}>
      <i className={`fa-solid ${cfg.icon}`} style={{ fontSize: 8 }} />
      {cfg.label}
    </span>
  );
}

// ── Threat Meter ────────────────────────────────────────────────────
function ThreatMeter({ value }) {
  const color = value >= 80 ? '#EF4444' : value >= 50 ? '#F97316' : value >= 20 ? '#EAB308' : '#00FF88';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-[3px] bg-white/[0.05] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}50` }} />
      </div>
      <span className="text-[9px] font-mono-num font-bold" style={{ color }}>{value}%</span>
    </div>
  );
}

// ── Chokepoint Card ─────────────────────────────────────────────────
function ChokepointCard({ cp, isExpanded, onToggle, onFlyTo }) {
  const cfg = STATUS_CONFIG[cp.status] || STATUS_CONFIG.CLEAR;
  const isDisrupted = cp.status === 'DISRUPTED' || cp.status === 'ELEVATED';

  return (
    <div
      className={`bg-[var(--color-card)] border rounded-md overflow-hidden transition-all duration-300 card-interactive ${isDisrupted ? 'signal-pulse' : ''}`}
      style={{ borderColor: isDisrupted ? `${cfg.color}20` : 'rgba(255,255,255,0.05)' }}
    >
      <div className="p-3.5">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: `${cfg.color}10`, border: `1px solid ${cfg.color}20` }}>
              <i className="fa-solid fa-ship" style={{ color: cfg.color, fontSize: 11 }} />
            </div>
            <div className="min-w-0">
              <div className="text-white font-bold text-[12px] leading-tight truncate">{cp.name}</div>
              <div className="text-white/20 text-[8px] font-mono uppercase tracking-wider">{cp.region}</div>
            </div>
          </div>
          <StatusBadge status={cp.status} />
        </div>

        {/* Threat Level */}
        <ThreatMeter value={cp.threatLevel} />

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mt-2.5">
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-sm px-2 py-1.5 text-center">
            <div className="text-white font-mono-num font-bold text-[10px]">{cp.dailyVessels?.toLocaleString()}</div>
            <div className="text-white/15 text-[7px] uppercase tracking-wider">Ships/Day</div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-sm px-2 py-1.5 text-center">
            <div className="text-[var(--color-gold)] font-mono-num font-bold text-[10px]">{cp.tradeVolume}</div>
            <div className="text-white/15 text-[7px] uppercase tracking-wider">Volume</div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-sm px-2 py-1.5 text-center">
            <div className="text-[var(--color-cyan)] font-mono-num font-bold text-[10px]">{cp.totalMentions || 0}</div>
            <div className="text-white/15 text-[7px] uppercase tracking-wider">Intel Hits</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-2.5">
          <button onClick={() => onFlyTo && onFlyTo({ lat: cp.lat, lng: cp.lng })}
            className="flex-1 py-1.5 text-[8px] font-bold uppercase tracking-widest text-[var(--color-cyan)] bg-[var(--color-cyan)]/[0.06] border border-[var(--color-cyan)]/[0.15] rounded-sm cursor-pointer transition-all hover:bg-[var(--color-cyan)]/[0.12] btn-press">
            <i className="fa-solid fa-crosshairs mr-1" style={{ fontSize: 8 }} /> Locate
          </button>
          <button onClick={onToggle}
            className="flex-1 py-1.5 text-[8px] font-bold uppercase tracking-widest text-white/30 bg-white/[0.03] border border-white/[0.06] rounded-sm cursor-pointer transition-all hover:text-white/50 hover:bg-white/[0.06] btn-press">
            <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} mr-1`} style={{ fontSize: 7 }} />
            {isExpanded ? 'Collapse' : 'Intel'}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-white/[0.05] animate-fade-in space-y-3">
            {/* Description */}
            <p className="text-white/40 text-[11px] leading-relaxed">{cp.description}</p>

            {/* Commodity & Affected Tickers */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-sm p-2.5">
              <div className="text-[8px] font-bold text-[var(--color-gold)] uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                <i className="fa-solid fa-chart-line" style={{ fontSize: 8 }} /> Primary Commodity: {cp.commodity}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {cp.affectedTickers?.map(t => (
                  <span key={t} className="px-2 py-0.5 text-[9px] font-bold rounded-sm border"
                    style={{ color: cfg.color, background: `${cfg.color}08`, borderColor: `${cfg.color}20` }}>
                    ${t}
                  </span>
                ))}
              </div>
            </div>

            {/* Matching Events */}
            {cp.matchingEvents?.length > 0 && (
              <div className="bg-[var(--color-red)]/[0.04] border border-[var(--color-red)]/[0.1] rounded-sm p-2.5">
                <div className="text-[8px] font-bold text-[var(--color-red)] uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5">
                  <i className="fa-solid fa-bolt" style={{ fontSize: 8 }} /> Active Intel
                </div>
                {cp.matchingEvents.map((e, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-white/40 mb-1.5">
                    <i className="fa-solid fa-caret-right mt-0.5" style={{ fontSize: 7, color: cfg.color }} />
                    <span>[{e.severity}] {e.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
//  CHOKEPOINT MONITOR — Main Component
// ═══════════════════════════════════════════════════════════════════════

export default function ChokepointMonitor({ onFlyTo }) {
  const [chokepoints, setChokepoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState('all'); // all, disrupted, monitoring

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/chokepoints');
        setChokepoints(res.data || []);
      } catch { /* fallback handled by backend */ }
      finally { setLoading(false); }
    };
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  const filteredChokepoints = useMemo(() => {
    if (filter === 'all') return chokepoints;
    if (filter === 'disrupted') return chokepoints.filter(c => c.status === 'DISRUPTED' || c.status === 'ELEVATED');
    if (filter === 'monitoring') return chokepoints.filter(c => c.status === 'MONITORING');
    return chokepoints;
  }, [chokepoints, filter]);

  const summary = useMemo(() => {
    const disrupted = chokepoints.filter(c => c.status === 'DISRUPTED').length;
    const elevated = chokepoints.filter(c => c.status === 'ELEVATED').length;
    const monitoring = chokepoints.filter(c => c.status === 'MONITORING').length;
    const clear = chokepoints.filter(c => c.status === 'CLEAR').length;
    return { disrupted, elevated, monitoring, clear };
  }, [chokepoints]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3.5 border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-anchor text-[var(--color-cyan)]" style={{ fontSize: 13 }} />
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-[0.15em]">
              Supply Chain Chokepoints
            </span>
          </div>
          <span className="text-[8px] font-mono text-white/20">
            {chokepoints.length} MONITORED
          </span>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-4 gap-1.5 mb-2.5">
          {[
            { label: 'Disrupted', count: summary.disrupted, color: '#EF4444' },
            { label: 'Elevated', count: summary.elevated, color: '#F97316' },
            { label: 'Watching', count: summary.monitoring, color: '#EAB308' },
            { label: 'Clear', count: summary.clear, color: '#00FF88' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.02] border border-white/[0.04] rounded-sm py-1.5 text-center">
              <div className="font-mono-num font-bold text-sm" style={{ color: s.color }}>{s.count}</div>
              <div className="text-[7px] text-white/20 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-1.5">
          {['all', 'disrupted', 'monitoring'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-1 py-1 text-[8px] font-bold uppercase tracking-wider border rounded-sm cursor-pointer transition-all btn-press"
              style={{
                background: filter === f ? 'rgba(0,212,255,0.08)' : 'transparent',
                color: filter === f ? 'var(--color-cyan)' : 'var(--color-text-muted)',
                borderColor: filter === f ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)',
              }}>
              {f === 'all' ? 'All' : f === 'disrupted' ? 'At Risk' : 'Watching'}
            </button>
          ))}
        </div>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <i className="fa-solid fa-anchor text-white/10 text-3xl animate-pulse" />
              <span className="text-[10px] text-white/20 font-mono uppercase tracking-widest">Scanning Maritime Corridors...</span>
            </div>
          </div>
        ) : filteredChokepoints.length === 0 ? (
          <div className="py-12 text-center">
            <i className="fa-solid fa-ship text-white/10 text-2xl mb-3" />
            <p className="text-white/20 text-[10px] font-mono uppercase tracking-widest">
              No chokepoints match filter
            </p>
          </div>
        ) : (
          filteredChokepoints.map(cp => (
            <ChokepointCard
              key={cp.id}
              cp={cp}
              isExpanded={expandedId === cp.id}
              onToggle={() => setExpandedId(prev => prev === cp.id ? null : cp.id)}
              onFlyTo={onFlyTo}
            />
          ))
        )}
      </div>
    </div>
  );
}
