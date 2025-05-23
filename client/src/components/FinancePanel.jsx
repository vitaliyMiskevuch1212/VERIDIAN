import React, { useState } from 'react';
import { LineChart, Line, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import FlagIcon from './FlagIcon';
import TerminalLoader from './TerminalLoader';

// ─────────────────────────────────────────────
// SignalBadge
// Displays a colored pill indicating BUY / SELL / HOLD.
// Picks an accent color and matching icon per signal type.
// ─────────────────────────────────────────────
const SignalBadge = ({ signal }) => {
  // Map each signal type to its theme color CSS variable
  const colors = { BUY: 'var(--color-green)', SELL: 'var(--color-red)', HOLD: 'var(--color-yellow)' };
  const color = colors[signal] || colors.HOLD; // fall back to HOLD styling for unknown signals
  return (
    <span className="px-2 py-0.5 border border-white/10 rounded-sm text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5"
          style={{ background: `${color}15`, color, borderColor: `${color}30` }}>
      {/* Icon: trending-up for BUY, trending-down for SELL, pause for HOLD */}
      <i className={signal === 'BUY' ? 'fa-solid fa-arrow-trend-up' : signal === 'SELL' ? 'fa-solid fa-arrow-trend-down' : 'fa-solid fa-pause'} style={{ fontSize: 8 }}></i>
      {signal}
    </span>
  );
};

// Color map for the time-horizon label (SHORT / MEDIUM / LONG)
const TIME_HORIZON_COLOR = { SHORT: 'var(--color-orange)', MEDIUM: 'var(--color-yellow)', LONG: 'var(--color-green)' };

// ─────────────────────────────────────────────
// TacticalStockCard
// Full card for a single asset quote. Renders:
//   • Price + % change header
//   • Sparkline mini-chart
//   • AI signal section (shown after "Synthesize" is clicked)
//     – Geopolitical drivers, risk factors, correlated assets, stop-loss
// Props:
//   quote       – { symbol, name, price, change, sparkline[] }
//   signal      – AI-generated signal object (null until fetched)
//   onGetSignal – callback that triggers the AI signal fetch
// ─────────────────────────────────────────────
const TacticalStockCard = ({ quote, signal, onGetSignal }) => {
  // Controls whether the expandable Risk Analysis section is visible
  const [expanded, setExpanded] = useState(false);
  if (!quote) return null;

  const isUp = (quote.change || 0) >= 0;
  // Green for positive change, red for negative
  const color = isUp ? 'var(--color-green)' : 'var(--color-red)';
  
  return (
    <div className="mx-3 mb-4 bg-[#0D1520] border border-white/5 rounded-sm overflow-hidden transition-all hover:bg-[#121B2A]">
      <div className="p-4">

        {/* ── Quote Header: symbol + name on left, price + delta on right ── */}
        <div className="flex items-center justify-between mb-2">
           <div className="flex flex-col">
              <span className="text-white font-bold tracking-tight text-lg leading-none">{quote.symbol}</span>
              <span className="text-white/30 text-[9px] uppercase tracking-widest mt-1">{quote.name}</span>
           </div>
           <div className="text-right">
              <div className="text-white font-mono-num text-xl font-bold leading-none">${quote.price.toFixed(2)}</div>
              {/* Change percentage with directional arrow icon */}
              <div className={`text-[10px] font-mono-num font-bold mt-1 flex items-center justify-end gap-1 ${isUp ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                <i className={`fa-solid ${isUp ? 'fa-arrow-up' : 'fa-arrow-down'} text-[8px]`}></i>
                {Math.abs(quote.change).toFixed(2)}%
              </div>
           </div>
        </div>

        {/* ── Sparkline: thin price-history line rendered at low opacity ── */}
        {quote.sparkline?.length > 0 && (
          <div className="h-10 mt-3 mb-2 opacity-50">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quote.sparkline}>
                {/* Single line, color matches up/down direction */}
                <Line type="monotone" dataKey="price" stroke={color} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Signal Section: rendered once the AI signal has been fetched ── */}
        {signal ? (
          <div className="mt-4 pt-3 border-t border-white/5 animate-fade-in">
             {/* Row 1: BUY/SELL/HOLD badge + confidence % + time horizon tag */}
             <div className="flex items-center gap-2 mb-2 flex-wrap">
                <SignalBadge signal={signal.signal} />
                <span className="text-white/40 font-mono text-[9px] uppercase tracking-widest">{signal.confidence}% AI Conf</span>
                {signal.timeHorizon && (
                  <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-sm border"
                    style={{ color: TIME_HORIZON_COLOR[signal.timeHorizon] || 'var(--color-yellow)', borderColor: `${TIME_HORIZON_COLOR[signal.timeHorizon] || 'var(--color-yellow)'}40`, background: `${TIME_HORIZON_COLOR[signal.timeHorizon] || 'var(--color-yellow)'}10` }}>
                    {signal.timeHorizon}
                  </span>
                )}
             </div>

             {/* One-line AI rationale for the signal */}
             <p className="text-white/60 text-[10px] leading-relaxed mb-2">
                {signal.reasoning}
             </p>

             {/* ── Geopolitical Drivers: list of macro/political factors ── */}
             {signal.geopoliticalFactors?.length > 0 && (
               <div className="mb-2">
                 <div className="text-[7px] font-bold text-[var(--color-cyan)] uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                   <i className="fa-solid fa-globe" style={{ fontSize: 7 }}></i> Geopolitical Drivers
                 </div>
                 {signal.geopoliticalFactors.map((f, i) => (
                   <div key={i} className="flex items-start gap-1.5 text-[9px] text-white/50 mb-1">
                     <i className="fa-solid fa-caret-right text-[var(--color-cyan)] mt-0.5" style={{ fontSize: 7 }}></i>
                     <span>{f}</span>
                   </div>
                 ))}
               </div>
             )}

             {/* ── Toggle button for the collapsible risk analysis panel ── */}
             <button onClick={() => setExpanded(!expanded)} className="text-[8px] text-white/30 bg-transparent border-none cursor-pointer hover:text-white/60 transition-colors pointer-events-auto flex items-center gap-1 mb-1">
               <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`} style={{ fontSize: 7 }}></i>
               {expanded ? 'Hide' : 'Show'} Risk Analysis
             </button>

             {/* ── Expandable panel: Risk Factors, Correlated Assets, Stop-Loss ── */}
             {expanded && (
               <div className="space-y-2 animate-fade-in">

                 {/* Risk Factors: downside scenarios or tail risks */}
                 {signal.riskFactors?.length > 0 && (
                   <div>
                     <div className="text-[7px] font-bold text-[var(--color-red)] uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                       <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 7 }}></i> Risk Factors
                     </div>
                     {signal.riskFactors.map((r, i) => (
                       <div key={i} className="flex items-start gap-1.5 text-[9px] text-white/40 mb-1">
                         <i className="fa-solid fa-xmark text-[var(--color-red)] mt-0.5" style={{ fontSize: 7 }}></i>
                         <span>{r}</span>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Correlated Assets: tickers that move with this asset */}
                 {signal.correlatedAssets?.length > 0 && (
                   <div>
                     <div className="text-[7px] font-bold text-[var(--color-purple)] uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                       <i className="fa-solid fa-link" style={{ fontSize: 7 }}></i> Correlated Assets
                     </div>
                     <div className="flex flex-wrap gap-1">
                       {signal.correlatedAssets.map((a, i) => (
                         <span key={i} className="px-1.5 py-0.5 text-[8px] bg-[var(--color-purple)]/10 border border-[var(--color-purple)]/20 rounded-sm text-[var(--color-purple)]">{a}</span>
                       ))}
                     </div>
                   </div>
                 )}

                 {/* Stop-Loss reasoning: when/why to exit the position */}
                 {signal.stopLossReasoning && (
                   <div className="bg-[var(--color-red)]/5 border border-[var(--color-red)]/15 rounded-sm px-2.5 py-2">
                     <div className="text-[7px] font-bold text-[var(--color-red)] uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                       <i className="fa-solid fa-shield-halved" style={{ fontSize: 7 }}></i> Stop-Loss Trigger
                     </div>
                     <p className="text-white/40 text-[9px] leading-relaxed">{signal.stopLossReasoning}</p>
                   </div>
                 )}
               </div>
             )}
          </div>
        ) : (
          /* Pre-signal state: CTA button to fetch the AI deep signal */
          <button
            onClick={onGetSignal}
            className="w-full mt-4 py-2.5 bg-white/5 border border-white/10 rounded-sm text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/10 transition-all pointer-events-auto"
          >
            <i className="fa-solid fa-brain-circuit mr-2 text-[var(--color-cyan)]"></i>
            Synthesize Deep Signal
          </button>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// FinancePanel  (default export)
// Root panel component for the GeoTrade sidebar. Manages:
//   • Ticker search input
//   • Auto-correlated watchlist (surfaced when major events fire)
//   • Active asset scan result (TacticalStockCard)
//   • Crypto prices grid
//   • Forex / Central Bank desk
//   • Fear & Greed sentiment index
//
// Props:
//   quote        – currently loaded asset quote
//   signal       – AI signal for the active quote (null until fetched)
//   overview     – { crypto[], forex[], fearGreed }
//   loading      – boolean; shows TerminalLoader while fetching
//   onSearch     – callback(ticker: string) – fires a new asset lookup
//   onGetSignal  – callback(symbol: string) – requests the AI deep signal
//   watchlist    – auto-generated watchlist triggered by geopolitical events
// ─────────────────────────────────────────────
export default function FinancePanel({ quote, signal, overview, loading, onSearch, onGetSignal, watchlist }) {
  // Controlled input value for the ticker search field
  const [ticker, setTicker] = useState('');
  // Reserved for marking whether the watchlist data is newly populated
  const [watchlistFresh, setWatchlistFresh] = useState(false);

  // Submit handler: normalises the ticker to uppercase before firing the search
  const handleSubmit = (e) => {
    e.preventDefault();
    if (ticker.trim()) onSearch?.(ticker.trim().toUpperCase());
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0F1E]" style={{ overflow: 'hidden' }}>

      {/* ── 1. Panel Header ── */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-center gap-2">
        <i className="fa-solid fa-chart-mixed text-[var(--color-cyan)] text-sm"></i>
        <h2 className="text-white font-heading uppercase tracking-[0.3em] text-[11px]">GeoTrade</h2>
        <i className="fa-solid fa-microchip text-white/40 text-[10px] ml-1"></i>
      </div>

      {/* ── 1.5. Auto-Correlated Watchlist ──
           Only rendered when a major geopolitical event auto-populates tickers.
           Clicking a ticker row triggers a search for that symbol. */}
      {watchlist?.tickers?.length > 0 && (
        <div className="px-3 py-3 border-b border-white/5" style={{ animation: 'signalPulse 3s ease-in-out 2' }}>
          <div className="flex items-center gap-2 mb-2">
            <i className="fa-solid fa-bolt text-[var(--color-cyan)]" style={{ fontSize: 9 }} />
            <span className="text-[8px] font-bold text-[var(--color-cyan)] uppercase tracking-[0.2em]">Auto-Correlated Watchlist</span>
            {/* Timestamp of the triggering event */}
            <span className="text-[7px] text-white/20 font-mono ml-auto">
              {new Date(watchlist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {/* Label for which event caused these suggestions */}
          <div className="text-[8px] text-white/30 mb-2 flex items-center gap-1 line-clamp-1">
            <i className="fa-solid fa-triangle-exclamation text-[var(--color-red)]" style={{ fontSize: 7 }} />
            {watchlist.triggerEvent}
          </div>
          {/* Render each auto-suggested ticker as a clickable row */}
          <div className="space-y-1">
            {watchlist.tickers.map((t, i) => (
              <button key={i}
                onClick={() => { setTicker(t.symbol); onSearch?.(t.symbol); }}
                className="w-full flex items-center gap-2 bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-[var(--color-cyan)]/30 rounded-sm px-2.5 py-2 cursor-pointer transition-all text-left group"
                style={{ background: 'transparent' }}>
                {/* Direction icon: up = positive impact, down = negative impact */}
                <i className={`fa-solid ${t.impactDirection === 'POSITIVE' ? 'fa-arrow-trend-up text-[var(--color-green)]' : 'fa-arrow-trend-down text-[var(--color-red)]'}`} style={{ fontSize: 9 }} />
                <span className="text-white font-bold text-[10px] min-w-[40px]">{t.symbol}</span>
                <span className="text-white/30 text-[8px] flex-1 line-clamp-1">{t.reasoning}</span>
                <i className="fa-solid fa-chevron-right text-white/10 group-hover:text-white/30 transition-colors" style={{ fontSize: 7 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 2. Search Bar + Loading State ── */}
      <div className="px-4 py-4">
        {/* Ticker input: submits on Enter via the form's onSubmit */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-4">
          <div className="flex-1 relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[10px]"></i>
            <input
              type="text"
              placeholder="Asset Ticker (AAPL, BTC...)"
              value={ticker}
              onChange={e => setTicker(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-sm pl-8 pr-3 py-2 text-[10px] text-white placeholder:text-white/20 focus:border-[var(--color-cyan)] outline-none transition-all pointer-events-auto"
            />
          </div>
        </form>

        {/* Full-height terminal loader while the asset data is being fetched */}
        {loading && (
          <div className="mx-3 mb-4 h-64 border border-white/5 rounded-sm overflow-hidden flex flex-col">
            <TerminalLoader context={`ANALYZING ASSET METRICS${ticker ? `: ${ticker.toUpperCase()}` : ''}`} />
          </div>
        )}
      </div>

      {/* ── 3. Scrollable Market Content ── */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-6 custom-scrollbar">

        {/* Active asset scan result – only rendered once loading has finished */}
        {!loading && quote && (
          <TacticalStockCard quote={quote} signal={signal} onGetSignal={() => onGetSignal?.(quote.symbol)} />
        )}

        {/* Empty state: shown when no asset has been searched yet */}
        {!loading && !quote && (
          <div className="mx-7 p-8 border border-white/5 border-dashed rounded-sm text-center">
             <i className="fa-solid fa-radar text-white/10 text-3xl mb-3"></i>
             <p className="text-white/20 text-[10px] uppercase tracking-widest font-mono">Scan Assets for Signals</p>
          </div>
        )}

        {/* ── Crypto Grid: 2-column card layout for digital assets ── */}
        {overview?.crypto && (
          <div className="px-4">
            <div className="flex items-center gap-2 text-[9px] text-white/40 font-mono tracking-widest uppercase mb-3">
               <i className="fa-brands fa-ethereum text-[8px]"></i> Digital Assets
            </div>
            <div className="grid grid-cols-2 gap-2">
              {overview.crypto.map(c => (
                <div key={c.symbol} className="bg-white/5 border border-white/5 rounded-sm p-3 group hover:border-white/20 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-bold text-[10px]">{c.symbol}</span>
                    {/* Color-coded % change */}
                    <span className={`font-mono-num text-[10px] font-bold ${c.change >= 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                      {c.change >= 0 ? '+' : ''}{c.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-white/80 font-mono-num text-sm font-bold">
                    ${c.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Forex Desk: currency-pair rows with flag icons ── */}
        {overview?.forex && (
          <div className="px-4">
             <div className="flex items-center gap-2 text-[9px] text-white/40 font-mono tracking-widest uppercase mb-3 text-right justify-end">
               Central Bank desk <i className="fa-solid fa-building-columns text-[8px]"></i>
            </div>
            <div className="space-y-1.5">
              {overview.forex.map(f => (
                <div key={f.pair} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-sm px-3 py-2.5 hover:bg-white/[0.08] transition-all">
                  <div className="flex items-center gap-2">
                    {/* Stacked flag icons for each currency in the pair */}
                    <div className="flex -space-x-1">
                      {f.flags?.map(fl => <FlagIcon key={fl} iso2={fl} size={14} className="border border-black" />)}
                    </div>
                    <span className="text-white font-bold text-[10px] underline decoration-[var(--color-cyan)]/30 underline-offset-4">{f.pair}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Exchange rate (4 decimal places) and colour-coded daily change */}
                    <span className="text-white font-mono-num text-[11px] font-bold">{f.rate.toFixed(4)}</span>
                    <span className={`font-mono-num text-[10px] font-bold ${f.change >= 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                      {f.change >= 0 ? '+' : ''}{f.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Fear & Greed Index: single sentiment card ── */}
        {overview?.fearGreed && (
          <div className="px-4">
             <div className="flex items-center gap-2 text-[9px] text-white/40 font-mono tracking-widest uppercase mb-3">
               <i className="fa-solid fa-brain text-[8px]"></i> Market Sentiment
            </div>
            {/* Background colour shifts from red (fear) → yellow (neutral) → green (greed) */}
            <div className="bg-white/5 border border-white/5 rounded-sm p-4 flex items-center justify-between group">
               <div className="flex flex-col">
                  <span className="text-white font-bold text-lg leading-none">{overview.fearGreed.value}</span>
                  <span className="text-[9px] font-mono uppercase text-white/40 tracking-widest mt-1">Fear & Greed Index</span>
               </div>
               <div className={`px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-[0.2em] transition-all group-hover:scale-105 ${
                  overview.fearGreed.value > 60 ? 'bg-[var(--color-green)]/20 text-[var(--color-green)]' :
                  overview.fearGreed.value > 40 ? 'bg-[var(--color-yellow)]/20 text-[var(--color-yellow)]' :
                  'bg-[var(--color-red)]/20 text-[var(--color-red)]'
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