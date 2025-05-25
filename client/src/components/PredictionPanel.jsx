import React, { useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import SkeletonLoader from './SkeletonLoader';
import GlobalRiskIndex from './GlobalRiskIndex';

const PredictionCard = ({ item, onSimulate }) => {
  const isHigh = item.probability > 60;
  const isMed = item.probability > 30 && item.probability <= 60;
  const color = isHigh ? 'var(--color-green)' : isMed ? 'var(--color-yellow)' : 'var(--color-red)';
  
  // Transform sparkline array to recharts format
  const chartData = (item.sparkline || [50,52,48,55,60,58,62]).map((val, i) => ({ x: i, y: val }));

  return (
    <div className="mb-4 bg-[#0D1520] border border-white/5 rounded-sm p-4 relative group hover:bg-[#121B2A] transition-all">
      {/* Category & Stats */}
      <div className="flex items-center gap-3 mb-3 text-[9px] text-white/40 font-mono uppercase tracking-widest">
        <span className="flex items-center gap-1.5 text-[var(--color-cyan)]">
          <i className="fa-solid fa-shield-halved text-[8px]"></i>
          {item.category || 'GEN'}
        </span>
        <span>•</span>
        <span>{(item.question || '').length * 7 + (item.probability || 50)} VOTES</span>
        <span>•</span>
        <span>{item.daysRemaining || 30}d Left</span>
      </div>

      {/* Question */}
      <h3 className="text-white font-bold text-xs leading-tight mb-4 group-hover:text-[var(--color-cyan)] transition-colors">
        {item.question}
      </h3>

      {/* Probability & Sparkline */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-2xl font-mono-num font-bold flex items-baseline gap-2" style={{ color }}>
            {item.probability}%
            <span className="text-[10px] uppercase tracking-widest opacity-60">YES</span>
          </div>
        </div>
        <div className="w-24 h-10 opacity-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line type="monotone" dataKey="y" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sentiment Bar */}
      <div className="relative w-full h-1 bg-white/5 rounded-full overflow-hidden flex mb-4">
        <div className="h-full bg-[var(--color-green)] shadow-[0_0_8px_var(--color-green)]" style={{ width: `${item.sentiment?.yes || 50}%` }}></div>
        <div className="h-full bg-[var(--color-red)]/40" style={{ width: `${item.sentiment?.no || 50}%` }}></div>
      </div>

      {/* AI Reasoning */}
      {item.reasoning && (
        <div className="mb-4 px-3 py-2 bg-gradient-to-r from-[var(--color-cyan)]/10 to-transparent border-l-2 border-[var(--color-cyan)] shadow-sm">
          <div className="text-[7.5px] font-bold text-[var(--color-cyan)] uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5 font-heading">
            <i className="fa-solid fa-microchip" style={{ fontSize: 8 }}></i> Intelligence Access Rationale
          </div>
          <p className="text-white/80 text-[10px] leading-relaxed font-medium">{item.reasoning}</p>
        </div>
      )}

      {/* Probability Driving Factors */}
      <div className="grid grid-cols-2 gap-3 mb-5">
         <div className="p-2 bg-white/5 border border-white/5 rounded-sm">
            <div className="text-[7px] text-white/30 uppercase tracking-widest mb-1">CONV-STRENGTH</div>
            <div className="text-[10px] font-mono font-bold text-[var(--color-green)] tracking-wider">SECURE // HIGH</div>
         </div>
         <div className="p-2 bg-white/5 border border-white/5 rounded-sm">
            <div className="text-[7px] text-white/30 uppercase tracking-widest mb-1">DATA-NODES</div>
            <div className="text-[10px] font-mono font-bold text-[var(--color-cyan)] tracking-wider">12 NODE CLUSTER</div>
         </div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 py-2 bg-white/5 border border-white/10 rounded-sm text-center text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/10 transition-all pointer-events-auto">
          <i className="fa-solid fa-file-contract mr-2"></i> Report
        </button>
        {item.probability > 40 && (
          <button 
            onClick={() => onSimulate?.(item.question)}
            className="flex-1 py-2 bg-[var(--color-red)]/10 border border-[var(--color-red)]/30 rounded-sm text-center text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--color-red)] hover:bg-[var(--color-red)] hover:text-white transition-all pointer-events-auto shadow-[0_0_15px_rgba(255,80,80,0.1)]"
          >
            <i className="fa-solid fa-code-branch mr-2"></i> COMMENCE WARGAME
          </button>
        )}
      </div>
    </div>
  );
};

export default function PredictionPanel({ data, loading, onSimulate }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (loading || !data) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center mb-6">
           <div className="h-4 w-32 bg-white/5 animate-pulse rounded"></div>
           <div className="h-4 w-12 bg-white/5 animate-pulse rounded"></div>
        </div>
        <SkeletonLoader lines={12} />
      </div>
    );
  }

  const activePrediction = data.predictions?.[activeIndex];

  return (
    <div className="flex flex-col h-full bg-[#0A0F1E] font-sans relative overflow-hidden">
      {/* 0. GLOBAL STRATEGIC INDEX HEADER */}
      <div className="px-4 pt-4 flex-shrink-0">
        <GlobalRiskIndex context={data.dataContext} />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* 1. TOP PREDICTIONS CAROUSEL */}
        <div className="p-4 border-b border-white/10 bg-black/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-chart-line-up text-[var(--color-red)] text-sm"></i>
            <h2 className="text-white font-heading uppercase tracking-[0.2em] text-[10px]">Top Predictions</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveIndex(prev => (prev > 0 ? prev - 1 : data.predictions.length - 1))}
              className="text-white/20 hover:text-white transition-colors bg-transparent border-none pointer-events-auto"
            >
              <i className="fa-solid fa-chevron-left text-[10px]"></i>
            </button>
            <div className="flex gap-1">
              {data.predictions?.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIndex ? 'bg-[var(--color-red)]' : 'bg-white/10'}`}></div>
              ))}
            </div>
            <button 
              onClick={() => setActiveIndex(prev => (prev < data.predictions.length - 1 ? prev + 1 : 0))}
              className="text-white/20 hover:text-white transition-colors bg-transparent border-none pointer-events-auto"
            >
              <i className="fa-solid fa-chevron-right text-[10px]"></i>
            </button>
          </div>
        </div>

        {activePrediction && <PredictionCard item={activePrediction} onSimulate={onSimulate} />}
      </div>

      {/* 2. MARKETS & INDICES */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-grid-2 text-[var(--color-red)] text-xs"></i>
            <h2 className="text-white font-heading uppercase tracking-[0.2em] text-[10px]">Markets</h2>
          </div>
          <div className={`px-2 py-0.5 border border-white/10 rounded-sm text-[8px] font-bold ${data.marketStatus === 'BEARISH' ? 'text-[var(--color-red)] border-[var(--color-red)]/30' : 'text-[var(--color-green)] border-[var(--color-green)]/30'}`}>
            {data.marketStatus || 'BEARISH'}
          </div>
        </div>

        {/* AI Market Reasoning */}
        {data.marketReasoning && (
          <div className="mb-3 px-2 py-1.5 bg-white/[0.02] border border-white/5 rounded-sm">
            <p className="text-white/30 text-[9px] leading-relaxed italic">
              <i className="fa-solid fa-microchip text-[var(--color-cyan)] mr-1" style={{ fontSize: 7 }}></i>
              {data.marketReasoning}
            </p>
          </div>
        )}

          <div className="grid grid-cols-2 gap-2">
            {data.indices?.map(idx => (
              <div key={idx.name} className="flex flex-col p-2 bg-white/5 border border-white/5 rounded-sm hover:border-white/20 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 font-bold text-[8px] uppercase tracking-widest">{idx.name}</span>
                  <div className={`text-[9px] font-mono-num font-bold flex items-center gap-1 ${idx.isUp ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                    <i className={`fa-solid ${idx.isUp ? 'fa-arrow-up-right' : 'fa-arrow-down-right'} text-[7px]`}></i>
                    {idx.change}%
                  </div>
                </div>
                <div className="text-white font-mono-num text-[13px] font-bold">${idx.value.toLocaleString()}</div>
                <div className="w-full h-1 bg-white/5 mt-2 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--color-cyan)]/30" style={{ width: '60%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. TOP KEYWORDS (24H) */}
      <div className="p-4 bg-black/10">
        <div className="flex items-center gap-2 mb-4">
          <i className="fa-solid fa-hashtag text-[var(--color-red)] text-sm"></i>
          <h2 className="text-white font-heading uppercase tracking-[0.2em] text-[10px]">Top Keywords (24h)</h2>
        </div>
        <div className="space-y-2.5">
          {data.keywords?.map(kw => (
            <div key={kw.rank} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-sm group hover:border-[var(--color-red)] transition-all">
              <div className="flex items-center gap-3">
                <span className="text-[var(--color-red)] font-mono text-xs font-bold leading-none">#{kw.rank}</span>
                <span className="text-white text-xs font-bold group-hover:text-[var(--color-cyan)] transition-colors">{kw.name}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/40 font-mono tracking-tighter uppercase">{kw.mentions} mentions</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto p-4 opacity-10 text-center pointer-events-none">
        <i className="fa-solid fa-shield-halved text-4xl"></i>
      </div>
    </div>
  );
}
