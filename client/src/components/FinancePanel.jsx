import React, { useState } from 'react';
import { LineChart, Line, Area, AreaChart, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import FlagIcon from './FlagIcon';
import TerminalLoader from './TerminalLoader';

const SignalBadge = ({ signal }) => {
  const colors = { BUY: 'var(--color-green)', SELL: 'var(--color-red)', HOLD: 'var(--color-yellow)' };
  const color = colors[signal] || colors.HOLD;
  return (
    <span className="px-2.5 py-0.5 border rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5"
          style={{ background: `${color}12`, color, borderColor: `${color}25` }}>
      <i className={signal === 'BUY' ? 'fa-solid fa-arrow-trend-up' : signal === 'SELL' ? 'fa-solid fa-arrow-trend-down' : 'fa-solid fa-pause'} style={{ fontSize: 8 }}></i>
      {signal}
    </span>
  );
};

const TIME_HORIZON_COLOR = { SHORT: 'var(--color-orange)', MEDIUM: 'var(--color-yellow)', LONG: 'var(--color-green)' };

const TacticalStockCard = ({ quote, signal, onGetSignal }) => {
  const [expanded, setExpanded] = useState(false);
  if (!quote) return null;

  const isUp = (quote.change || 0) >= 0;
  const color = isUp ? 'var(--color-green)' : 'var(--color-red)';
  
  return (
    <div className="mx-3 mb-4 bg-[var(--color-card)] border border-white/[0.05] rounded-md overflow-hidden card-interactive">
      <div className="p-4">

        {/* Quote Header */}
        <div className="flex items-center justify-between mb-3">
           <div className="flex flex-col">
              <span className="text-white font-bold tracking-tight text-lg leading-none">{quote.symbol}</span>
              <span className="text-white/25 text-[9px] uppercase tracking-widest mt-1">{quote.name}</span>
           </div>
           <div className="text-right">
              <div className="text-white font-mono-num text-xl font-bold leading-none">${quote.price.toFixed(2)}</div>
              <div className={`text-[10px] font-mono-num font-bold mt-1 flex items-center justify-end gap-1 ${isUp ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                <i className={`fa-solid ${isUp ? 'fa-arrow-up' : 'fa-arrow-down'} text-[8px]`}></i>
                {Math.abs(quote.change).toFixed(2)}%
              </div>
           </div>
        </div>

        {/* Sparkline — area fill for better visual weight */}
        {quote.sparkline?.length > 0 && (
          <div className="h-12 mt-3 mb-3 opacity-70">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={quote.sparkline}>
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="price" stroke={color} strokeWidth={1.5} fill="url(#sparkGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Signal Section */}
        {signal ? (
          <div className="mt-4 pt-3 border-t border-white/[0.05] animate-fade-in">
             <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <SignalBadge signal={signal.signal} />
                <span className="text-white/35 font-mono text-[9px] uppercase tracking-widest">{signal.confidence}% AI Conf</span>
                {signal.timeHorizon && (
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded border"
                    style={{ color: TIME_HORIZON_COLOR[signal.timeHorizon] || 'var(--color-yellow)', borderColor: `${TIME_HORIZON_COLOR[signal.timeHorizon] || 'var(--color-yellow)'}30`, background: `${TIME_HORIZON_COLOR[signal.timeHorizon] || 'var(--color-yellow)'}08` }}>
                    {signal.timeHorizon}
                  </span>
                )}
             </div>

             <p className="text-white/50 text-[11px] leading-relaxed mb-2.5">
                {signal.reasoning}
             </p>

             {/* Geopolitical Drivers */}
             {signal.geopoliticalFactors?.length > 0 && (
               <div className="mb-2.5">
                 <div className="text-[8px] font-bold text-[var(--color-cyan)] uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1">
                   <i className="fa-solid fa-globe" style={{ fontSize: 7 }}></i> Geopolitical Drivers
                 </div>
                 {signal.geopoliticalFactors.map((f, i) => (
                   <div key={i} className="flex items-start gap-1.5 text-[10px] text-white/45 mb-1">
                     <i className="fa-solid fa-caret-right text-[var(--color-cyan)] mt-0.5" style={{ fontSize: 7 }}></i>
                     <span>{f}</span>
                   </div>
                 ))}
               </div>
             )}

             {/* Risk Analysis toggle */}
             <button onClick={() => setExpanded(!expanded)} className="text-[9px] text-white/25 bg-transparent border-none cursor-pointer hover:text-white/50 transition-colors pointer-events-auto flex items-center gap-1 mb-1 btn-press">
               <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`} style={{ fontSize: 7 }}></i>
               {expanded ? 'Hide' : 'Show'} Risk Analysis
             </button>

             {/* Expanded risk panel */}
             {expanded && (
               <div className="space-y-2.5 animate-fade-in">
                 {signal.riskFactors?.length > 0 && (
                   <div>
                     <div className="text-[8px] font-bold text-[var(--color-red)] uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1">
                       <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 7 }}></i> Risk Factors
                     </div>
                     {signal.riskFactors.map((r, i) => (
                       <div key={i} className="flex items-start gap-1.5 text-[10px] text-white/35 mb-1">
                         <i className="fa-solid fa-xmark text-[var(--color-red)] mt-0.5" style={{ fontSize: 7 }}></i>
                         <span>{r}</span>
                       </div>
                     ))}
                   </div>
                 )}

                 {signal.correlatedAssets?.length > 0 && (
                   <div>
                     <div className="text-[8px] font-bold text-[var(--color-purple)] uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1">
                       <i className="fa-solid fa-link" style={{ fontSize: 7 }}></i> Correlated Assets
                     </div>
                     <div className="flex flex-wrap gap-1.5">
                       {signal.correlatedAssets.map((a, i) => (
                         <span key={i} className="px-2 py-0.5 text-[9px] bg-[var(--color-purple)]/[0.07] border border-[var(--color-purple)]/[0.15] rounded text-[var(--color-purple)]">{a}</span>
                       ))}
                     </div>
                   </div>
                 )}

                 {signal.stopLossReasoning && (
                   <div className="bg-[var(--color-red)]/[0.04] border border-[var(--color-red)]/[0.1] rounded-md px-3 py-2.5">
                     <div className="text-[8px] font-bold text-[var(--color-red)] uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1">
                       <i className="fa-solid fa-shield-halved" style={{ fontSize: 7 }}></i> Stop-Loss Trigger
                     </div>
                     <p className="text-white/35 text-[10px] leading-relaxed">{signal.stopLossReasoning}</p>
                   </div>
                 )}
               </div>
             )}
          </div>
        ) : (
          /* Pre-signal CTA — gradient button */
          <button
            onClick={onGetSignal}
            className="w-full mt-4 py-3 bg-gradient-to-r from-[var(--color-cyan)]/[0.08] via-[var(--color-cyan)]/[0.12] to-[var(--color-cyan)]/[0.06] border border-[var(--color-cyan)]/[0.2] rounded-md text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-cyan)] hover:from-[var(--color-cyan)]/[0.15] hover:via-[var(--color-cyan)]/[0.2] hover:to-[var(--color-cyan)]/[0.12] transition-all pointer-events-auto cursor-pointer btn-press shadow-[0_0_20px_rgba(0,212,255,0.05)]"
          >
            <i className="fa-solid fa-brain mr-2"></i>
            Synthesize Deep Signal
          </button>
        )}
      </div>
    </div>
  );
};

export default function FinancePanel({ quote, signal, overview, loading, onSearch, onGetSignal, watchlist }) {
  const [ticker, setTicker] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ticker.trim()) onSearch?.(ticker.trim().toUpperCase());
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0F1E]" style={{ overflow: 'hidden' }}>

      {/* Panel Header */}
      <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center justify-center gap-2.5">
        <i className="fa-solid fa-chart-line text-[var(--color-cyan)] text-sm drop-shadow-[0_0_6px_rgba(0,212,255,0.3)]"></i>
        <h2 className="text-white font-heading uppercase tracking-[0.25em] text-[11px]">GeoTrade</h2>
        <i className="fa-solid fa-microchip text-white/30 text-[10px] ml-1"></i>
      </div>

      {/* Auto-Correlated Watchlist */}
      {watchlist?.tickers?.length > 0 && (
        <div className="px-3 py-3 border-b border-white/[0.05]" style={{ animation: 'signalPulse 3s ease-in-out 2' }}>
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-bolt text-[var(--color-cyan)]" style={{ fontSize: 9 }} />
            <span className="text-[9px] font-bold text-[var(--color-cyan)] uppercase tracking-[0.15em]">Auto-Correlated Watchlist</span>
            <span className="text-[8px] text-white/15 font-mono ml-auto">
              {new Date(watchlist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="text-[9px] text-white/25 mb-2 flex items-center gap-1 line-clamp-1">
            <i className="fa-solid fa-triangle-exclamation text-[var(--color-red)]" style={{ fontSize: 7 }} />
            {watchlist.triggerEvent}
          </div>
          <div className="space-y-1.5">
            {watchlist.tickers.map((t, i) => (
              <button key={i}
                onClick={() => { setTicker(t.symbol); onSearch?.(t.symbol); }}
                className="w-full flex items-center gap-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-[var(--color-cyan)]/[0.2] rounded-md px-3 py-2.5 cursor-pointer transition-all text-left group btn-press"
                style={{ background: 'transparent' }}>
                <i className={`fa-solid ${t.impactDirection === 'POSITIVE' ? 'fa-arrow-trend-up text-[var(--color-green)]' : 'fa-arrow-trend-down text-[var(--color-red)]'}`} style={{ fontSize: 9 }} />
                <span className="text-white font-bold text-[10px] min-w-[40px]">{t.symbol}</span>
                <span className="text-white/25 text-[9px] flex-1 line-clamp-1">{t.reasoning}</span>
                <i className="fa-solid fa-chevron-right text-white/[0.06] group-hover:text-white/20 transition-colors" style={{ fontSize: 7 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="px-4 py-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
          <div className="flex-1 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-[10px]"></i>
            <input
              type="text"
              placeholder="Asset Ticker (AAPL, BTC...)"
              value={ticker}
              onChange={e => setTicker(e.target.value)}
              className="w-full bg-black/50 border border-white/[0.06] rounded-md pl-8 pr-3 py-2.5 text-[11px] text-white placeholder:text-white/15 focus:border-[var(--color-cyan)]/40 outline-none transition-all pointer-events-auto"
            />
          </div>
        </form>

        {loading && (
          <div className="mx-0 mb-4 h-64 border border-white/[0.05] rounded-md overflow-hidden flex flex-col">
            <TerminalLoader context={`ANALYZING ASSET METRICS${ticker ? `: ${ticker.toUpperCase()}` : ''}`} />
          </div>
        )}
      </div>

      {/* Scrollable Market Content */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-6 custom-scrollbar">

        {!loading && quote && (
          <TacticalStockCard quote={quote} signal={signal} onGetSignal={() => onGetSignal?.(quote.symbol)} />
        )}

        {!loading && !quote && (
          <div className="mx-7 p-8 border border-white/[0.05] border-dashed rounded-md text-center">
             <i className="fa-solid fa-satellite-dish text-white/[0.06] text-3xl mb-3"></i>
             <p className="text-white/15 text-[10px] uppercase tracking-widest font-mono">Scan Assets for Signals</p>
          </div>
        )}

        {/* Crypto Grid */}
        {overview?.crypto && (
          <div className="px-4">
            <div className="flex items-center gap-2 text-[9px] text-white/30 font-mono tracking-widest uppercase mb-3">
               <i className="fa-brands fa-ethereum text-[9px]"></i> Digital Assets
            </div>
            <div className="grid grid-cols-2 gap-2">
              {overview.crypto.map(c => (
                <div key={c.symbol} className="bg-white/[0.03] border border-white/[0.05] rounded-md p-3 group hover:border-white/[0.1] card-interactive">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-bold text-[10px]">{c.symbol}</span>
                    <span className={`font-mono-num text-[10px] font-bold ${c.change >= 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                      {c.change >= 0 ? '+' : ''}{c.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-white/70 font-mono-num text-sm font-bold">
                    ${c.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Forex Desk */}
        {overview?.forex && (
          <div className="px-4">
             <div className="flex items-center gap-2 text-[9px] text-white/30 font-mono tracking-widest uppercase mb-3 text-right justify-end">
               Central Bank desk <i className="fa-solid fa-building-columns text-[9px]"></i>
            </div>
            <div className="space-y-1.5">
              {overview.forex.map(f => (
                <div key={f.pair} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.05] rounded-md px-3 py-2.5 hover:bg-white/[0.06] card-interactive">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {f.flags?.map(fl => <FlagIcon key={fl} iso2={fl} size={14} className="border border-black" />)}
                    </div>
                    <span className="text-white font-bold text-[10px] underline decoration-[var(--color-cyan)]/20 underline-offset-4">{f.pair}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white/80 font-mono-num text-[11px] font-bold">{f.rate.toFixed(4)}</span>
                    <span className={`font-mono-num text-[10px] font-bold ${f.change >= 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                      {f.change >= 0 ? '+' : ''}{f.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fear & Greed */}
        {overview?.fearGreed && (
          <div className="px-4">
             <div className="flex items-center gap-2 text-[9px] text-white/30 font-mono tracking-widest uppercase mb-3">
               <i className="fa-solid fa-brain text-[9px]"></i> Market Sentiment
            </div>
            <div className="bg-white/[0.03] border border-white/[0.05] rounded-md p-4 flex items-center justify-between group hover:bg-white/[0.05] card-interactive">
               <div className="flex flex-col">
                  <span className="text-white font-bold text-lg leading-none">{overview.fearGreed.value}</span>
                  <span className="text-[9px] font-mono uppercase text-white/30 tracking-widest mt-1">Fear & Greed Index</span>
               </div>
               <div className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-[0.15em] transition-all group-hover:scale-105 ${
                  overview.fearGreed.value > 60 ? 'bg-[var(--color-green)]/[0.12] text-[var(--color-green)]' :
                  overview.fearGreed.value > 40 ? 'bg-[var(--color-yellow)]/[0.12] text-[var(--color-yellow)]' :
                  'bg-[var(--color-red)]/[0.12] text-[var(--color-red)]'
               }`}>
                  {overview.fearGreed.label}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}