import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ── Circular Progress Ring ──────────────────────────────────────────
function AccuracyRing({ value, size = 100, strokeWidth = 6, color, label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)', filter: `drop-shadow(0 0 6px ${color}50)` }} />
        <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
          fill={color} fontSize={size * 0.28} fontWeight="800" fontFamily="'JetBrains Mono', monospace">
          {value}%
        </text>
      </svg>
      <span className="text-[8px] text-white/30 uppercase tracking-[0.2em] font-bold">{label}</span>
    </div>
  );
}

// ── Stat Metric ─────────────────────────────────────────────────────
function Metric({ label, value, color, icon }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-md p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <i className={`fa-solid ${icon}`} style={{ color, fontSize: 10 }} />
        <span className="text-[8px] text-white/25 uppercase tracking-[0.15em] font-bold">{label}</span>
      </div>
      <div className="font-mono-num text-lg font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

// ── Signal Type Bar ─────────────────────────────────────────────────
function TypeAccuracyBar({ type, data }) {
  const colors = { BUY: '#00FF88', SELL: '#EF4444', HOLD: '#EAB308' };
  const color = colors[type] || '#fff';
  if (!data || data.total === 0) return null;

  return (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-md p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[9px] font-bold rounded-sm uppercase"
            style={{ color, background: `${color}12`, border: `1px solid ${color}30` }}>
            {type}
          </span>
          <span className="text-white/20 text-[10px] font-mono">{data.total} signals</span>
        </div>
        <span className="font-mono-num text-sm font-bold" style={{ color }}>{data.rate}%</span>
      </div>
      <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${data.rate}%`, background: color, boxShadow: `0 0 8px ${color}30` }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[9px] font-mono">
        <span className="text-white/20">{data.correct}/{data.total} correct</span>
        <span style={{ color: data.avgChange >= 0 ? '#00FF88' : '#EF4444' }}>
          avg {data.avgChange >= 0 ? '+' : ''}{data.avgChange}%
        </span>
      </div>
    </div>
  );
}

// ── Backtest Row ────────────────────────────────────────────────────
function BacktestRow({ bt }) {
  const signalColors = { BUY: '#00FF88', SELL: '#EF4444', HOLD: '#EAB308' };
  const color = signalColors[bt.signal] || '#fff';
  const changeColor = bt.actualChange >= 0 ? '#00FF88' : '#EF4444';
  const timeAgo = getTimeAgo(bt.createdAt);

  return (
    <div className={`flex items-center gap-3 py-2.5 px-3 bg-white/[0.01] border border-white/[0.04] rounded-md ${bt.wasCorrect ? '' : 'opacity-60'}`}>
      {/* Ticker */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${bt.wasCorrect ? '' : ''}`}
          style={{ background: bt.wasCorrect ? 'rgba(0,255,136,0.1)' : 'rgba(239,68,68,0.1)' }}>
          <i className={`fa-solid ${bt.wasCorrect ? 'fa-check' : 'fa-xmark'}`}
            style={{ fontSize: 8, color: bt.wasCorrect ? '#00FF88' : '#EF4444' }} />
        </div>
        <span className="text-white font-bold text-[12px] font-mono-num">${bt.ticker}</span>
      </div>

      {/* Signal */}
      <span className="px-1.5 py-0.5 text-[8px] font-bold rounded-sm"
        style={{ color, background: `${color}12`, border: `1px solid ${color}25` }}>
        {bt.signal}
      </span>

      {/* Confidence */}
      <span className="text-white/30 font-mono-num text-[10px]">{bt.confidence}%</span>

      {/* Actual Change */}
      <span className="font-mono-num text-[11px] font-bold min-w-[48px] text-right" style={{ color: changeColor }}>
        {bt.actualChange >= 0 ? '+' : ''}{bt.actualChange}%
      </span>

      {/* Time */}
      <span className="text-white/15 text-[9px] font-mono">{timeAgo}</span>
    </div>
  );
}

function getTimeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  return '<1h';
}

// ═══════════════════════════════════════════════════════════════════════
//  SIGNAL ACCURACY DASHBOARD — Main
// ═══════════════════════════════════════════════════════════════════════

export default function SignalAccuracyDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get('/api/ai/signals/backtest');
        setData(res.data);
      } catch { /* handled */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <i className="fa-solid fa-flask text-white/10 text-3xl animate-pulse" />
          <span className="text-[10px] text-white/20 font-mono uppercase tracking-widest">Running Backtests...</span>
        </div>
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="p-6">
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-lg p-8 text-center">
          <i className="fa-solid fa-flask text-white/10 text-4xl mb-4" />
          <h3 className="text-white/50 font-bold text-sm mb-2">No Backtest Data Yet</h3>
          <p className="text-white/25 text-[11px] leading-relaxed max-w-sm mx-auto">
            Signals are automatically backtested 1 hour after generation by comparing the predicted direction against actual price movement.
            Generate some signals first, then check back.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-cyan)]/[0.06] border border-[var(--color-cyan)]/[0.15] rounded-md">
            <i className="fa-solid fa-clock text-[var(--color-cyan)]" style={{ fontSize: 10 }} />
            <span className="text-[var(--color-cyan)] text-[10px] font-mono font-bold">
              {data?.message || 'Generate signals to see accuracy data'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Hero Metrics */}
      <div className="flex items-center justify-center gap-8 py-4">
        <AccuracyRing value={data.winRate} size={110} color={data.winRate >= 60 ? '#00FF88' : data.winRate >= 40 ? '#EAB308' : '#EF4444'} label="Win Rate" />
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Total Tested" value={data.total} color="var(--color-cyan)" icon="fa-flask" />
        <Metric label="Correct" value={data.correct} color="#00FF88" icon="fa-check" />
        <Metric label="Avg Return" value={`${data.avgReturn >= 0 ? '+' : ''}${data.avgReturn}%`}
          color={data.avgReturn >= 0 ? '#00FF88' : '#EF4444'} icon="fa-chart-line" />
      </div>

      {/* By Signal Type */}
      <div>
        <h4 className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold mb-2 flex items-center gap-1.5">
          <i className="fa-solid fa-bars-staggered" style={{ fontSize: 9 }} /> Accuracy by Signal Type
        </h4>
        <div className="space-y-2">
          {['BUY', 'SELL', 'HOLD'].map(type => (
            <TypeAccuracyBar key={type} type={type} data={data.byType?.[type]} />
          ))}
        </div>
      </div>

      {/* By Trigger */}
      {data.byTrigger && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-md p-3 text-center">
            <div className="text-[8px] text-white/25 uppercase tracking-[0.15em] font-bold mb-1">
              <i className="fa-solid fa-robot mr-1" style={{ fontSize: 8 }} /> Auto Signals
            </div>
            <div className="font-mono-num text-lg font-bold text-[var(--color-cyan)]">{data.byTrigger.auto?.rate || 0}%</div>
            <div className="text-[9px] text-white/15 font-mono">{data.byTrigger.auto?.total || 0} tested</div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.04] rounded-md p-3 text-center">
            <div className="text-[8px] text-white/25 uppercase tracking-[0.15em] font-bold mb-1">
              <i className="fa-solid fa-hand-pointer mr-1" style={{ fontSize: 8 }} /> Manual Signals
            </div>
            <div className="font-mono-num text-lg font-bold text-[var(--color-gold)]">{data.byTrigger.manual?.rate || 0}%</div>
            <div className="text-[9px] text-white/15 font-mono">{data.byTrigger.manual?.total || 0} tested</div>
          </div>
        </div>
      )}

      {/* Recent Backtests */}
      {data.recentBacktests?.length > 0 && (
        <div>
          <h4 className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold mb-2 flex items-center gap-1.5">
            <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: 9 }} /> Recent Backtest Results
          </h4>
          <div className="space-y-1.5">
            {data.recentBacktests.map((bt, i) => (
              <BacktestRow key={i} bt={bt} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
