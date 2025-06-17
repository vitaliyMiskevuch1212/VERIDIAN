import React, { useState, useEffect, useMemo, useCallback } from 'react';
import TerminalLoader from './TerminalLoader';

const SignalBadge = ({ signal, size = 'sm' }) => {
  const config = {
    BUY:  { color: 'var(--color-green)', icon: 'fa-arrow-trend-up',   bg: 'rgba(0, 255, 136, 0.12)' },
    SELL: { color: 'var(--color-red)',   icon: 'fa-arrow-trend-down', bg: 'rgba(239, 68, 68, 0.12)' },
    HOLD: { color: 'var(--color-yellow)',icon: 'fa-pause',            bg: 'rgba(234, 179, 8, 0.12)' },
  };
  const c = config[signal] || config.HOLD;
  const isLg = size === 'lg';
  return (
    <span className={`inline-flex items-center gap-1 font-bold uppercase tracking-widest border rounded-sm ${isLg ? 'px-2.5 py-1 text-[10px]' : 'px-1.5 py-0.5 text-[8px]'}`}
      style={{ background: c.bg, color: c.color, borderColor: `${c.color}30` }}>
      <i className={`fa-solid ${c.icon}`} style={{ fontSize: isLg ? 9 : 7 }} />
      {signal}
    </span>
  );
};

const TriggerBadge = ({ type }) => {
  const isAuto = type === 'auto';
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.15em] rounded-sm border"
      style={{
        color: isAuto ? 'var(--color-cyan)' : 'var(--color-text-muted)',
        background: isAuto ? 'rgba(0, 212, 255, 0.08)' : 'rgba(255,255,255,0.03)',
        borderColor: isAuto ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255,255,255,0.08)',
      }}>
      <i className={`fa-solid ${isAuto ? 'fa-bolt' : 'fa-user'}`} style={{ fontSize: 6 }} />
      {isAuto ? 'AUTO' : 'MANUAL'}
    </span>
  );
};

const ConfidenceMeter = ({ value }) => {
  const color = value >= 70 ? 'var(--color-green)' : value >= 45 ? 'var(--color-yellow)' : 'var(--color-red)';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-[3px] bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color, boxShadow: `0 0 8px ${color}40` }} />
      </div>
      <span className="text-[9px] font-mono-num font-bold" style={{ color }}>{value}%</span>
    </div>
  );
};

const DistributionBar = ({ buy, hold, sell }) => {
  const total = buy + hold + sell || 1;
  return (
    <div className="flex h-[6px] rounded-full overflow-hidden bg-white/5">
      {buy > 0 && (
        <div className="h-full transition-all duration-500" style={{ width: `${(buy / total) * 100}%`, background: 'var(--color-green)', boxShadow: '0 0 4px rgba(0,255,136,0.3)' }} />
      )}
      {hold > 0 && (
        <div className="h-full transition-all duration-500" style={{ width: `${(hold / total) * 100}%`, background: 'var(--color-yellow)', boxShadow: '0 0 4px rgba(234,179,8,0.3)' }} />
      )}
      {sell > 0 && (
        <div className="h-full transition-all duration-500" style={{ width: `${(sell / total) * 100}%`, background: 'var(--color-red)', boxShadow: '0 0 4px rgba(239,68,68,0.3)' }} />
      )}
    </div>
  );
};

function SignalCard({ signal }) {
  const [expanded, setExpanded] = useState(false);
  const timeAgo = useMemo(() => {
    const diff = Date.now() - new Date(signal.createdAt).getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }, [signal.createdAt]);

  return (
    <div className="mx-3 mb-2 bg-[#0D1520] border border-white/5 rounded-sm overflow-hidden transition-all hover:bg-[#121B2A] group animate-fade-in">
      <div className="p-3">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm tracking-tight">{signal.ticker}</span>
            <SignalBadge signal={signal.signal} />
          </div>
          <div className="flex items-center gap-2">
            <TriggerBadge type={signal.triggerType} />
            <span className="text-white/20 font-mono text-[8px]">{timeAgo}</span>
          </div>
        </div>

        {/* Confidence */}
        <ConfidenceMeter value={signal.confidence} />

        {/* Reasoning excerpt */}
        <p className="text-white/50 text-[9px] leading-relaxed mt-2 line-clamp-2">
          {signal.reasoning}
        </p>

        {/* Trigger Event (auto-signals only) */}
        {signal.triggerEvent && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <i className="fa-solid fa-bolt text-[var(--color-cyan)]" style={{ fontSize: 7 }} />
            <span className="text-[8px] text-[var(--color-cyan)]/60 line-clamp-1">{signal.triggerEvent}</span>
          </div>
        )}

        {/* Expand toggle */}
        <button onClick={() => setExpanded(!expanded)}
          className="mt-2 text-[8px] text-white/25 bg-transparent border-none cursor-pointer hover:text-white/50 transition-colors flex items-center gap-1">
          <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`} style={{ fontSize: 7 }} />
          {expanded ? 'Collapse' : 'Details'}
        </button>

        {/* Expanded */}
        {expanded && (
          <div className="mt-2 pt-2 border-t border-white/5 space-y-2 animate-fade-in">
            {/* Geopolitical Factors */}
            {signal.geopoliticalFactors?.length > 0 && (
              <div>
                <div className="text-[7px] font-bold text-[var(--color-cyan)] uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                  <i className="fa-solid fa-globe" style={{ fontSize: 7 }} /> Drivers
                </div>
                {signal.geopoliticalFactors.map((f, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[9px] text-white/45 mb-0.5">
                    <i className="fa-solid fa-caret-right text-[var(--color-cyan)] mt-0.5" style={{ fontSize: 7 }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Risk Factors */}
            {signal.riskFactors?.length > 0 && (
              <div>
                <div className="text-[7px] font-bold text-[var(--color-red)] uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                  <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 7 }} /> Risks
                </div>
                {signal.riskFactors.map((r, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[9px] text-white/40 mb-0.5">
                    <i className="fa-solid fa-xmark text-[var(--color-red)] mt-0.5" style={{ fontSize: 7 }} />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Correlated Assets */}
            {signal.correlatedAssets?.length > 0 && (
              <div>
                <div className="text-[7px] font-bold text-[var(--color-purple)] uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                  <i className="fa-solid fa-link" style={{ fontSize: 7 }} /> Correlated
                </div>
                <div className="flex flex-wrap gap-1">
                  {signal.correlatedAssets.map((a, i) => (
                    <span key={i} className="px-1.5 py-0.5 text-[7px] rounded-sm border"
                      style={{ color: 'var(--color-purple)', background: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.2)' }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Time horizon + Stop loss */}
            <div className="flex items-center gap-3">
              {signal.timeHorizon && (
                <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-sm border"
                  style={{
                    color: signal.timeHorizon === 'SHORT' ? 'var(--color-orange)' : signal.timeHorizon === 'LONG' ? 'var(--color-green)' : 'var(--color-yellow)',
                    borderColor: `${signal.timeHorizon === 'SHORT' ? 'var(--color-orange)' : signal.timeHorizon === 'LONG' ? 'var(--color-green)' : 'var(--color-yellow)'}30`,
                    background: `${signal.timeHorizon === 'SHORT' ? 'var(--color-orange)' : signal.timeHorizon === 'LONG' ? 'var(--color-green)' : 'var(--color-yellow)'}10`,
                  }}>
                  {signal.timeHorizon}
                </span>
              )}
            </div>

            {signal.stopLossReasoning && (
              <div className="bg-[var(--color-red)]/5 border border-[var(--color-red)]/15 rounded-sm px-2 py-1.5">
                <div className="text-[7px] font-bold text-[var(--color-red)] uppercase tracking-[0.2em] mb-0.5 flex items-center gap-1">
                  <i className="fa-solid fa-shield-halved" style={{ fontSize: 7 }} /> Stop-Loss
                </div>
                <p className="text-white/35 text-[8px] leading-relaxed">{signal.stopLossReasoning}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


export default function SignalHistoryPanel({ data, stats, loading, onRefresh, onFilterChange }) {
  const [filterType, setFilterType] = useState(null); // BUY, SELL, HOLD, null
  const [filterTrigger, setFilterTrigger] = useState(null); // auto, manual, null

  // Reload when filters change
  useEffect(() => {
    onFilterChange?.({ type: filterType, trigger: filterTrigger });
  }, [filterType, filterTrigger]);

  const signals = data?.signals || [];
  const hasSignals = signals.length > 0;
  const isDbOffline = data?.dbOffline === true;

  return (
    <div className="flex flex-col h-full bg-[#0A0F1E]" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-brain text-[var(--color-cyan)] text-sm" />
          <h2 className="text-white font-heading uppercase tracking-[0.3em] text-[11px]">Signal Intel</h2>
        </div>
        <div className="flex items-center gap-2">
          {stats && (
            <span className="text-white/30 font-mono text-[8px]">{stats.total} SIGNALS • {stats.retentionDays}D RETENTION</span>
          )}
          <button onClick={() => onRefresh?.()} className="text-white/20 hover:text-white/60 bg-transparent border-none cursor-pointer transition-colors" title="Refresh">
            <i className="fa-solid fa-arrow-rotate-right text-[10px]" />
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && stats.total > 0 && (
        <div className="px-4 py-3 border-b border-white/5">
          {/* Distribution Bar */}
          <div className="mb-2">
            <DistributionBar buy={stats.distribution?.buy || 0} hold={stats.distribution?.hold || 0} sell={stats.distribution?.sell || 0} />
          </div>
          {/* Stats Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-green)' }} />
                <span className="text-[8px] text-white/40 font-mono">{stats.distribution?.buy || 0} BUY</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-yellow)' }} />
                <span className="text-[8px] text-white/40 font-mono">{stats.distribution?.hold || 0} HOLD</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-red)' }} />
                <span className="text-[8px] text-white/40 font-mono">{stats.distribution?.sell || 0} SELL</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-[8px] text-white/20 font-mono uppercase">Avg Conf</div>
                <div className="text-[11px] font-mono-num font-bold text-[var(--color-cyan)]">{stats.avgConfidence || 0}%</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] text-white/20 font-mono uppercase">Auto</div>
                <div className="text-[11px] font-mono-num font-bold text-[var(--color-cyan)]">{stats.triggerBreakdown?.auto || 0}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="px-4 py-2 border-b border-white/5 flex items-center gap-1.5">
        <span className="text-[7px] text-white/20 font-mono uppercase tracking-wider mr-1">Filter:</span>
        {/* Signal type filters */}
        {['BUY', 'HOLD', 'SELL'].map(type => (
          <button key={type}
            onClick={() => setFilterType(prev => prev === type ? null : type)}
            className="px-2 py-0.5 text-[7px] font-bold uppercase tracking-wider border rounded-sm cursor-pointer transition-all"
            style={{
              background: filterType === type ? `${type === 'BUY' ? 'var(--color-green)' : type === 'SELL' ? 'var(--color-red)' : 'var(--color-yellow)'}20` : 'transparent',
              color: filterType === type ? (type === 'BUY' ? 'var(--color-green)' : type === 'SELL' ? 'var(--color-red)' : 'var(--color-yellow)') : 'var(--color-text-muted)',
              borderColor: filterType === type ? `${type === 'BUY' ? 'var(--color-green)' : type === 'SELL' ? 'var(--color-red)' : 'var(--color-yellow)'}40` : 'rgba(255,255,255,0.08)',
            }}>
            {type}
          </button>
        ))}
        <div className="w-px h-3 bg-white/10 mx-1" />
        {/* Trigger type filters */}
        {[{ key: 'auto', label: 'Auto', icon: 'fa-bolt' }, { key: 'manual', label: 'Manual', icon: 'fa-user' }].map(t => (
          <button key={t.key}
            onClick={() => setFilterTrigger(prev => prev === t.key ? null : t.key)}
            className="px-2 py-0.5 text-[7px] font-bold uppercase tracking-wider border rounded-sm cursor-pointer transition-all flex items-center gap-1"
            style={{
              background: filterTrigger === t.key ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
              color: filterTrigger === t.key ? 'var(--color-cyan)' : 'var(--color-text-muted)',
              borderColor: filterTrigger === t.key ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255,255,255,0.08)',
            }}>
            <i className={`fa-solid ${t.icon}`} style={{ fontSize: 6 }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Signal Feed */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
        {loading && (
          <div className="mx-3 h-48 border border-white/5 rounded-sm overflow-hidden flex flex-col">
            <TerminalLoader context="LOADING SIGNAL HISTORY" />
          </div>
        )}

        {!loading && isDbOffline && (
          <div className="mx-5 my-8 p-6 border border-white/5 border-dashed rounded-sm text-center">
            <i className="fa-solid fa-database text-white/10 text-2xl mb-3" />
            <p className="text-white/20 text-[10px] uppercase tracking-widest font-mono mb-1">Database Offline</p>
            <p className="text-white/10 text-[9px]">Signal history requires MongoDB connection</p>
          </div>
        )}

        {!loading && !isDbOffline && !hasSignals && (
          <div className="mx-5 my-8 p-6 border border-white/5 border-dashed rounded-sm text-center">
            <i className="fa-solid fa-brain text-white/10 text-2xl mb-3" />
            <p className="text-white/20 text-[10px] uppercase tracking-widest font-mono mb-1">No Signals Generated</p>
            <p className="text-white/10 text-[9px]">Search a ticker in Trade tab and click "Synthesize Deep Signal"</p>
            <p className="text-white/10 text-[9px] mt-0.5">or wait for CRITICAL events to trigger auto-signals</p>
          </div>
        )}

        {!loading && hasSignals && signals.map((sig, i) => (
          <SignalCard key={sig._id || `sig-${i}`} signal={sig} />
        ))}

        {/* Pagination hint */}
        {!loading && data?.total > signals.length && (
          <div className="text-center py-3">
            <span className="text-[8px] text-white/15 font-mono">
              Showing {signals.length} of {data.total} signals
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
