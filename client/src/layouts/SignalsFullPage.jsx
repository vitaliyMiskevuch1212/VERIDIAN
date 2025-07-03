import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import TerminalLoader from '../components/TerminalLoader';
import SignalAccuracyDashboard from '../components/SignalAccuracyDashboard';
import { useData } from '../context/DataContext';
import { exportSignal, copyToClipboard, downloadReport } from '../utils/exportReport';
import ExportButton from '../components/ExportButton';

// ─── Sub-Components ─────────────────────────────────────────────

const SignalBadge = ({ signal, size = 'md' }) => {
  const cfg = {
    BUY:  { color: 'var(--color-green)', icon: 'fa-arrow-trend-up',   bg: 'rgba(0,255,136,0.12)' },
    SELL: { color: 'var(--color-red)',   icon: 'fa-arrow-trend-down', bg: 'rgba(239,68,68,0.12)' },
    HOLD: { color: 'var(--color-yellow)',icon: 'fa-pause',            bg: 'rgba(234,179,8,0.12)' },
  };
  const c = cfg[signal] || cfg.HOLD;
  const sz = size === 'lg' ? 'px-4 py-1.5 text-[12px]' : size === 'sm' ? 'px-1.5 py-0.5 text-[7px]' : 'px-2 py-0.5 text-[9px]';
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-widest border rounded-sm ${sz}`}
      style={{ background: c.bg, color: c.color, borderColor: `${c.color}40` }}>
      <i className={`fa-solid ${c.icon}`} /> {signal}
    </span>
  );
};

const TriggerBadge = ({ type }) => {
  const isAuto = type === 'auto';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.15em] rounded-sm border"
      style={{
        color: isAuto ? 'var(--color-cyan)' : 'var(--color-text-muted)',
        background: isAuto ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.03)',
        borderColor: isAuto ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.08)',
      }}>
      <i className={`fa-solid ${isAuto ? 'fa-bolt' : 'fa-user'}`} style={{ fontSize: 7 }} />
      {isAuto ? 'AUTO' : 'MANUAL'}
    </span>
  );
};

const ConfidenceMeter = ({ value, large }) => {
  const color = value >= 70 ? 'var(--color-green)' : value >= 45 ? 'var(--color-yellow)' : 'var(--color-red)';
  return (
    <div className="flex items-center gap-3">
      <div className={`flex-1 ${large ? 'h-[5px]' : 'h-[3px]'} bg-white/5 rounded-full overflow-hidden`}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color, boxShadow: `0 0 8px ${color}40` }} />
      </div>
      <span className={`font-mono-num font-bold ${large ? 'text-sm' : 'text-[9px]'}`} style={{ color }}>{value}%</span>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, sub }) => (
  <div className="bg-white/[0.02] border border-white/[0.05] rounded-md p-4 flex flex-col items-center justify-center text-center hover:bg-white/[0.04] transition-all card-interactive">
    <i className={`fa-solid ${icon} mb-2`} style={{ fontSize: 18, color: color || 'var(--color-cyan)' }} />
    <div className="text-2xl font-bold font-mono-num text-white mb-1">{value}</div>
    <div className="text-[9px] text-white/30 font-mono uppercase tracking-widest">{label}</div>
    {sub && <div className="text-[8px] font-mono mt-1" style={{ color: color || 'var(--color-cyan)' }}>{sub}</div>}
  </div>
);

const DistributionBar = ({ buy, hold, sell }) => {
  const total = buy + hold + sell || 1;
  return (
    <div className="flex h-3 rounded-full overflow-hidden bg-white/[0.04]">
      {buy > 0 && <div className="h-full" style={{ width: `${(buy / total) * 100}%`, background: 'var(--color-green)' }} />}
      {hold > 0 && <div className="h-full" style={{ width: `${(hold / total) * 100}%`, background: 'var(--color-yellow)' }} />}
      {sell > 0 && <div className="h-full" style={{ width: `${(sell / total) * 100}%`, background: 'var(--color-red)' }} />}
    </div>
  );
};

// ─── Signal Detail Card ─────────────────────────────────────────

function SignalDetailCard({ signal }) {
  const [expanded, setExpanded] = useState(false);
  const timeAgo = useMemo(() => {
    const diff = Date.now() - new Date(signal.createdAt).getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }, [signal.createdAt]);

  const timestamp = new Date(signal.createdAt).toLocaleString([], {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const chartData = useMemo(() => {
    let base = 100;
    const data = [];
    const seed = (signal.ticker.charCodeAt(0) || 65) + (signal.confidence || 50);
    for (let i = 0; i < 30; i++) {
        let jitter = Math.sin(seed + i * 0.5) * 2 + Math.cos(seed * i) * 1.5;
        base += jitter;
        if (signal.signal === 'BUY') base += (i * 0.15);
        if (signal.signal === 'SELL') base -= (i * 0.15);
        data.push({ x: i, y: base });
    }
    return data;
  }, [signal]);

  const signalColor = signal.signal === 'BUY' ? 'var(--color-green)' : signal.signal === 'SELL' ? 'var(--color-red)' : 'var(--color-yellow)';

  return (
    <div className="bg-[var(--color-card)] border border-white/[0.05] rounded-md overflow-hidden hover:bg-[var(--color-card-hover)] transition-all group card-interactive">
      <div className="p-4">
        {/* Header & Chart Grid */}
        <div className="grid grid-cols-12 gap-6 mb-3">
          <div className="col-span-8 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-white font-bold text-2xl tracking-tight leading-none">{signal.ticker}</span>
                <SignalBadge signal={signal.signal} size="md" />
                <TriggerBadge type={signal.triggerType} />
              </div>
              <div className="flex items-center gap-3 text-white/25 text-[10px] font-mono">
                <span>{timestamp}</span>
                <span className="text-white/15 mr-2">{timeAgo}</span>
                <ExportButton
                  label="Export"
                  onCopy={() => copyToClipboard(exportSignal(signal))}
                  onDownload={() => downloadReport(exportSignal(signal), `veridian-signal-${signal.ticker}.txt`)}
                />
              </div>
            </div>
            {/* Confidence */}
            <div className="mt-2">
              <ConfidenceMeter value={signal.confidence} large />
            </div>
          </div>
          
          <div className="col-span-4 h-20 opacity-70">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`grad-${signal._id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={signalColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={signalColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="y" stroke={signalColor} strokeWidth={2} fill={`url(#grad-${signal._id})`} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reasoning */}
        <p className="text-white/60 text-[12px] leading-relaxed mt-3">
          {signal.reasoning}
        </p>

        {/* Trigger Event */}
        {signal.triggerEvent && (
          <div className="mt-2 flex items-center gap-2 bg-[var(--color-cyan)]/[0.04] border border-[var(--color-cyan)]/[0.1] rounded-md px-3 py-1.5">
            <i className="fa-solid fa-bolt text-[var(--color-cyan)]" style={{ fontSize: 9 }} />
            <span className="text-[10px] text-[var(--color-cyan)]/70">Triggered by: {signal.triggerEvent}</span>
          </div>
        )}

        {/* Time Horizon tag */}
        {signal.timeHorizon && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[8px] text-white/25 font-mono uppercase">Time Horizon:</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm border"
              style={{
                color: signal.timeHorizon === 'SHORT' ? 'var(--color-orange)' : signal.timeHorizon === 'LONG' ? 'var(--color-green)' : 'var(--color-yellow)',
                borderColor: `${signal.timeHorizon === 'SHORT' ? 'var(--color-orange)' : signal.timeHorizon === 'LONG' ? 'var(--color-green)' : 'var(--color-yellow)'}30`,
                background: `${signal.timeHorizon === 'SHORT' ? 'var(--color-orange)' : signal.timeHorizon === 'LONG' ? 'var(--color-green)' : 'var(--color-yellow)'}10`,
              }}>
              {signal.timeHorizon} TERM
            </span>
          </div>
        )}

        {/* Expand */}
        <button onClick={() => setExpanded(!expanded)}
            className="mt-3 text-[9px] text-white/25 bg-transparent border-none cursor-pointer hover:text-white/50 transition-colors flex items-center gap-1.5 btn-press">
          <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`} style={{ fontSize: 8 }} />
          {expanded ? 'Collapse Details' : 'Expand Full Analysis'}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-white/[0.05] grid grid-cols-2 gap-3 animate-fade-in">
            {/* Geopolitical Drivers */}
            {signal.geopoliticalFactors?.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-md p-3">
                <div className="text-[8px] font-bold text-[var(--color-cyan)] uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                  <i className="fa-solid fa-globe" style={{ fontSize: 9 }} /> Geopolitical Drivers
                </div>
                {signal.geopoliticalFactors.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-white/50 mb-1.5">
                    <i className="fa-solid fa-caret-right text-[var(--color-cyan)] mt-0.5" style={{ fontSize: 8 }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Risk Factors */}
            {signal.riskFactors?.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-md p-3">
                <div className="text-[8px] font-bold text-[var(--color-red)] uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                  <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 9 }} /> Risk Factors
                </div>
                {signal.riskFactors.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-white/40 mb-1.5">
                    <i className="fa-solid fa-xmark text-[var(--color-red)] mt-0.5" style={{ fontSize: 8 }} />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Correlated Assets */}
            {signal.correlatedAssets?.length > 0 && (
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-md p-3">
                <div className="text-[8px] font-bold text-[var(--color-purple)] uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                  <i className="fa-solid fa-link" style={{ fontSize: 9 }} /> Correlated Assets
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {signal.correlatedAssets.map((a, i) => (
                    <span key={i} className="px-2 py-1 text-[9px] rounded-sm border font-bold"
                      style={{ color: 'var(--color-purple)', background: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.2)' }}>{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Stop-Loss */}
            {signal.stopLossReasoning && (
              <div className="bg-[var(--color-red)]/[0.04] border border-[var(--color-red)]/[0.1] rounded-md p-3">
                <div className="text-[8px] font-bold text-[var(--color-red)] uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1.5">
                  <i className="fa-solid fa-shield-halved" style={{ fontSize: 9 }} /> Stop-Loss Trigger
                </div>
                <p className="text-white/40 text-[11px] leading-relaxed">{signal.stopLossReasoning}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ─── MAIN SIGNALS FULL PAGE ─────────────────────────────────────

export default function SignalsFullPage({ onClose }) {
  const {
    signalHistory, signalStats, historyLoading,
    fetchSignalHistory, fetchSignalStats, autoSignals,
  } = useData();

  const [filterType, setFilterType] = useState(null);
  const [filterTrigger, setFilterTrigger] = useState(null);

  useEffect(() => {
    fetchSignalHistory({ type: filterType, trigger: filterTrigger });
  }, [filterType, filterTrigger]);

  useEffect(() => {
    fetchSignalHistory();
    fetchSignalStats();
  }, []);

  const signals = signalHistory?.signals || [];
  const stats = signalStats || {};
  const hasSignals = signals.length > 0;

  // Build mini confidence chart from recent signals
  const confidenceChart = useMemo(() => {
    if (!stats.recentSignals) return [];
    return [...stats.recentSignals].reverse().map((s, i) => ({
      idx: i,
      confidence: s.confidence,
      signal: s.signal,
    }));
  }, [stats.recentSignals]);

  return (
    <div className="absolute inset-0 z-50 bg-[#060B14] overflow-hidden flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/[0.05] bg-black/40 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-brain text-[var(--color-cyan)] text-lg" />
          <h1 className="text-white font-heading uppercase tracking-[0.4em] text-sm">Signal Intelligence</h1>
          <span className="text-[8px] text-white/20 font-mono uppercase tracking-wider bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.05]">Full View</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => { fetchSignalHistory({ type: filterType, trigger: filterTrigger }); fetchSignalStats(); }}
            className="px-3 py-1.5 text-white/30 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-md transition-all cursor-pointer flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold btn-press">
            <i className="fa-solid fa-arrow-rotate-right" /> Refresh
          </button>
          <button onClick={onClose}
            className="px-4 py-1.5 text-white/30 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-md transition-all cursor-pointer flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold btn-press">
            <i className="fa-solid fa-xmark" /> Close
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto p-6 space-y-6">

          {/* Stats Dashboard */}
          <div className="grid grid-cols-5 gap-3">
            <StatCard icon="fa-brain" label="Total Signals" value={stats.total || 0} color="var(--color-cyan)" sub={`${stats.retentionDays || 7}d retention`} />
            <StatCard icon="fa-arrow-trend-up" label="BUY Signals" value={stats.distribution?.buy || 0} color="var(--color-green)" />
            <StatCard icon="fa-pause" label="HOLD Signals" value={stats.distribution?.hold || 0} color="var(--color-yellow)" />
            <StatCard icon="fa-arrow-trend-down" label="SELL Signals" value={stats.distribution?.sell || 0} color="var(--color-red)" />
            <StatCard icon="fa-bolt" label="Auto Signals" value={stats.triggerBreakdown?.auto || 0} color="var(--color-cyan)" sub={`${stats.triggerBreakdown?.manual || 0} manual`} />
          </div>

          {/* Distribution + Confidence Chart */}
          <div className="grid grid-cols-2 gap-4">
            {/* Distribution */}
            <div className="bg-[var(--color-card)] border border-white/[0.05] rounded-md p-5">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4">Signal Distribution</div>
              <DistributionBar
                buy={stats.distribution?.buy || 0}
                hold={stats.distribution?.hold || 0}
                sell={stats.distribution?.sell || 0}
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-4">
                  {[
                    { label: 'BUY', color: 'var(--color-green)', count: stats.distribution?.buy || 0 },
                    { label: 'HOLD', color: 'var(--color-yellow)', count: stats.distribution?.hold || 0 },
                    { label: 'SELL', color: 'var(--color-red)', count: stats.distribution?.sell || 0 },
                  ].map(d => (
                    <div key={d.label} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-[10px] text-white/40 font-mono">{d.count} {d.label}</span>
                    </div>
                  ))}
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-white/20 font-mono uppercase">Avg Confidence</div>
                  <div className="text-lg font-mono-num font-bold text-[var(--color-cyan)]">{stats.avgConfidence || 0}%</div>
                </div>
              </div>
            </div>

            {/* Confidence Trend Chart */}
            <div className="bg-[var(--color-card)] border border-white/[0.05] rounded-md p-5">
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4">Recent Confidence Trend</div>
              {confidenceChart.length > 0 ? (
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={confidenceChart}>
                      <defs>
                        <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="confidence" stroke="var(--color-cyan)" strokeWidth={2} fill="url(#confGrad)" dot={false} />
                      <Tooltip contentStyle={{ background: '#0D1520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 11, color: '#fff' }}
                        formatter={(v) => [`${v}%`, 'Confidence']} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-white/10 text-[10px] font-mono">No data yet</div>
              )}
            </div>
          </div>

          {/* Backtest Accuracy Dashboard */}
          <div className="bg-[var(--color-card)] border border-white/[0.05] rounded-md overflow-hidden">
            <details>
              <summary className="p-4 cursor-pointer flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-flask text-[var(--color-green)]" style={{ fontSize: 16 }} />
                  <div>
                    <h3 className="text-white font-bold text-sm">Backtest Accuracy</h3>
                    <p className="text-white/25 text-[10px] font-mono uppercase tracking-wider">Signal verification against actual price movement</p>
                  </div>
                </div>
                <i className="fa-solid fa-chevron-down text-white/20 text-xs" />
              </summary>
              <div className="border-t border-white/[0.05]">
                <SignalAccuracyDashboard />
              </div>
            </details>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 bg-[var(--color-card)] border border-white/[0.05] rounded-md px-4 py-3">
            <span className="text-[9px] text-white/25 font-mono uppercase tracking-wider mr-2">Filter:</span>
            {['BUY', 'HOLD', 'SELL'].map(type => (
              <button key={type} onClick={() => setFilterType(prev => prev === type ? null : type)}
                className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider border rounded-md cursor-pointer transition-all btn-press"
                style={{
                  background: filterType === type ? `${type === 'BUY' ? 'var(--color-green)' : type === 'SELL' ? 'var(--color-red)' : 'var(--color-yellow)'}15` : 'transparent',
                  color: filterType === type ? (type === 'BUY' ? 'var(--color-green)' : type === 'SELL' ? 'var(--color-red)' : 'var(--color-yellow)') : 'var(--color-text-muted)',
                  borderColor: filterType === type ? `${type === 'BUY' ? 'var(--color-green)' : type === 'SELL' ? 'var(--color-red)' : 'var(--color-yellow)'}40` : 'rgba(255,255,255,0.08)',
                }}>
                {type}
              </button>
            ))}
            <div className="w-px h-5 bg-white/10 mx-2" />
            {[{ key: 'auto', label: 'Auto', icon: 'fa-bolt' }, { key: 'manual', label: 'Manual', icon: 'fa-user' }].map(t => (
              <button key={t.key} onClick={() => setFilterTrigger(prev => prev === t.key ? null : t.key)}
                className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider border rounded-md cursor-pointer transition-all flex items-center gap-1.5 btn-press"
                style={{
                  background: filterTrigger === t.key ? 'rgba(0,212,255,0.1)' : 'transparent',
                  color: filterTrigger === t.key ? 'var(--color-cyan)' : 'var(--color-text-muted)',
                  borderColor: filterTrigger === t.key ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)',
                }}>
                <i className={`fa-solid ${t.icon}`} style={{ fontSize: 8 }} /> {t.label}
              </button>
            ))}
            {(filterType || filterTrigger) && (
              <button onClick={() => { setFilterType(null); setFilterTrigger(null); }}
                className="ml-auto px-3 py-1 text-[9px] text-white/30 hover:text-white bg-transparent border border-white/[0.08] rounded-md cursor-pointer transition-all uppercase tracking-wider font-bold btn-press">
                Clear All
              </button>
            )}
          </div>

          {/* Loading */}
          {historyLoading && (
            <div className="h-48 border border-white/[0.05] rounded-md overflow-hidden">
              <TerminalLoader context="LOADING SIGNAL INTELLIGENCE DATABASE" />
            </div>
          )}

          {/* Empty State */}
          {!historyLoading && !hasSignals && (
            <div className="py-16 text-center border border-white/[0.05] border-dashed rounded-md">
              <i className="fa-solid fa-brain text-white/10 text-5xl mb-4" />
              <p className="text-white/20 text-sm uppercase tracking-widest font-mono mb-2">No Signals Generated</p>
              <p className="text-white/10 text-[11px] max-w-md mx-auto">
                Search a ticker in the Trade tab and click "Synthesize Deep Signal", or wait for CRITICAL events to trigger auto-signals.
              </p>
            </div>
          )}

          {/* Signal Feed */}
          {!historyLoading && hasSignals && (
            <div className="space-y-3">
              <div className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-1">
                Showing {signals.length} of {signalHistory.total} signals
              </div>
              {signals.map((sig, i) => (
                <SignalDetailCard key={sig._id || `sig-${i}`} signal={sig} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
