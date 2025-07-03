import React, { useState, useCallback } from 'react';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import FlagIcon from '../components/FlagIcon';
import TerminalLoader from '../components/TerminalLoader';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';

// ── Signal Badge ────────────────────────────────────────────────
const SignalBadge = ({ signal, size = 'md' }) => {
  const cfg = {
    BUY:  { color: 'var(--color-green)', icon: 'fa-arrow-trend-up',   bg: 'rgba(0,255,136,0.12)' },
    SELL: { color: 'var(--color-red)',   icon: 'fa-arrow-trend-down', bg: 'rgba(239,68,68,0.12)' },
    HOLD: { color: 'var(--color-yellow)',icon: 'fa-pause',            bg: 'rgba(234,179,8,0.12)' },
  };
  const c = cfg[signal] || cfg.HOLD;
  const sz = { sm: 'px-1.5 py-0.5 text-[7px]', md: 'px-2.5 py-1 text-[9px]', lg: 'px-4 py-1.5 text-[12px]' }[size] || 'px-2.5 py-1 text-[9px]';
  return (
    <span className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-widest border rounded-sm ${sz}`}
      style={{ background: c.bg, color: c.color, borderColor: `${c.color}40` }}>
      <i className={`fa-solid ${c.icon}`} /> {signal}
    </span>
  );
};

const THColor = { SHORT: 'var(--color-orange)', MEDIUM: 'var(--color-yellow)', LONG: 'var(--color-green)' };

// ── Full Stock Card ─────────────────────────────────────────────
const FullStockCard = ({ quote, signal, onGetSignal }) => {
  if (!quote) return null;
  const isUp = (quote.change || 0) >= 0;
  const color = isUp ? 'var(--color-green)' : 'var(--color-red)';

  return (
    <div className="bg-[#0D1520] border border-white/5 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-white font-bold text-2xl tracking-tight leading-none">{quote.symbol}</div>
            <div className="text-white/30 text-[10px] uppercase tracking-widest mt-1.5">{quote.name}</div>
          </div>
          <div className="text-right">
            <div className="text-white font-mono-num text-3xl font-bold leading-none">${quote.price?.toFixed(2)}</div>
            <div className={`text-[12px] font-mono-num font-bold mt-1.5 flex items-center justify-end gap-1.5 ${isUp ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
              <i className={`fa-solid ${isUp ? 'fa-arrow-up' : 'fa-arrow-down'} text-[10px]`} />
              {Math.abs(quote.change).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Sparkline */}
        {quote.sparkline?.length > 0 && (
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={quote.sparkline}>
                <defs>
                  <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill="url(#stockGrad)" dot={false} />
                <Tooltip contentStyle={{ background: '#0D1520', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, fontSize: 11, color: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Signal Section */}
      {signal ? (
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <SignalBadge signal={signal.signal} size="lg" />
            <span className="text-white/50 font-mono text-xs uppercase tracking-widest">{signal.confidence}% AI Confidence</span>
            {signal.timeHorizon && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm border"
                style={{ color: THColor[signal.timeHorizon], borderColor: `${THColor[signal.timeHorizon]}40`, background: `${THColor[signal.timeHorizon]}10` }}>
                {signal.timeHorizon} TERM
              </span>
            )}
          </div>

          <p className="text-white/70 text-sm leading-relaxed mb-5">{signal.reasoning}</p>

          <div className="grid grid-cols-2 gap-4">
            {/* Geopolitical Drivers */}
            {signal.geopoliticalFactors?.length > 0 && (
              <div className="bg-white/[0.02] border border-white/5 rounded-sm p-4">
                <div className="text-[9px] font-bold text-[var(--color-cyan)] uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                  <i className="fa-solid fa-globe" style={{ fontSize: 10 }} /> Geopolitical Drivers
                </div>
                {signal.geopoliticalFactors.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-white/55 mb-2">
                    <i className="fa-solid fa-caret-right text-[var(--color-cyan)] mt-0.5" style={{ fontSize: 9 }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Risk Factors */}
            {signal.riskFactors?.length > 0 && (
              <div className="bg-white/[0.02] border border-white/5 rounded-sm p-4">
                <div className="text-[9px] font-bold text-[var(--color-red)] uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                  <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 10 }} /> Risk Factors
                </div>
                {signal.riskFactors.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-white/45 mb-2">
                    <i className="fa-solid fa-xmark text-[var(--color-red)] mt-0.5" style={{ fontSize: 9 }} />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Correlated Assets */}
          {signal.correlatedAssets?.length > 0 && (
            <div className="mt-4 bg-white/[0.02] border border-white/5 rounded-sm p-4">
              <div className="text-[9px] font-bold text-[var(--color-purple)] uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                <i className="fa-solid fa-link" style={{ fontSize: 10 }} /> Correlated Assets
              </div>
              <div className="flex flex-wrap gap-2">
                {signal.correlatedAssets.map((a, i) => (
                  <span key={i} className="px-3 py-1.5 text-[10px] rounded-sm border font-bold"
                    style={{ color: 'var(--color-purple)', background: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.25)' }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stop-Loss */}
          {signal.stopLossReasoning && (
            <div className="mt-4 bg-[var(--color-red)]/5 border border-[var(--color-red)]/20 rounded-sm p-4">
              <div className="text-[9px] font-bold text-[var(--color-red)] uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                <i className="fa-solid fa-shield-halved" style={{ fontSize: 10 }} /> Stop-Loss Intelligence Trigger
              </div>
              <p className="text-white/50 text-[12px] leading-relaxed">{signal.stopLossReasoning}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-5">
          <button onClick={onGetSignal}
            className="w-full py-4 bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/25 rounded-sm text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/20 transition-all cursor-pointer">
            <i className="fa-solid fa-brain mr-3" /> Synthesize Deep Signal
          </button>
        </div>
      )}
    </div>
  );
};

// ── MAIN TRADE FULL PAGE ────────────────────────────────────────
export default function TradeFullPage({ onClose }) {
  const {
    quote, signal, overview, financeLoading, fetchQuote, fetchSignal,
    events, news, watchlist,
  } = useData();

  const [ticker, setTicker] = useState('');

  // Manual Portfolio State
  const [portfolio, setPortfolio] = useState(() => {
    try { return JSON.parse(localStorage.getItem('veridian_portfolio')) || ['AAPL', 'TSLA', 'BTC', 'NVDA']; } 
    catch { return ['AAPL', 'TSLA', 'BTC', 'NVDA']; }
  });
  const [newPortfolioTicker, setNewPortfolioTicker] = useState('');

  const addPortfolioItem = (e) => {
    e.preventDefault();
    if (!newPortfolioTicker) return;
    const sym = newPortfolioTicker.toUpperCase().trim();
    if (sym && !portfolio.includes(sym)) {
      const p = [...portfolio, sym];
      setPortfolio(p);
      localStorage.setItem('veridian_portfolio', JSON.stringify(p));
    }
    setNewPortfolioTicker('');
  };

  const removePortfolioItem = (sym, e) => {
    e.stopPropagation();
    const p = portfolio.filter(t => t !== sym);
    setPortfolio(p);
    localStorage.setItem('veridian_portfolio', JSON.stringify(p));
  };

  const handleSearch = useCallback((sym) => {
    const s = sym.trim().toUpperCase();
    if (s) fetchQuote(s);
  }, [fetchQuote]);

  const handleGetSignal = useCallback((sym) => {
    const eventTitles = events.slice(0, 5).map(e => e.title);
    const newsTitles = news.slice(0, 5).map(n => n.title);
    fetchSignal(sym, [...eventTitles, ...newsTitles]);
  }, [fetchSignal, events, news]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(ticker);
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#060B14] overflow-hidden flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/40 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-chart-mixed text-[var(--color-cyan)] text-lg" />
          <h1 className="text-white font-heading uppercase tracking-[0.4em] text-sm">GeoTrade Command</h1>
          <span className="text-[8px] text-white/20 font-mono uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full border border-white/5">Full View</span>
        </div>
        <button onClick={onClose}
          className="px-4 py-2 text-white/30 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm transition-all cursor-pointer flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
          <i className="fa-solid fa-xmark" /> Close
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto p-6 space-y-6">

          {/* Search Bar */}
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
              <input type="text" placeholder="Search ticker (AAPL, TSLA, BTC, NVDA...)" value={ticker} onChange={e => setTicker(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-sm pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:border-[var(--color-cyan)] outline-none transition-all" />
            </div>
            <button type="submit" className="px-6 bg-[var(--color-cyan)]/15 border border-[var(--color-cyan)]/30 text-[var(--color-cyan)] rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[var(--color-cyan)]/25 transition-all cursor-pointer">
              Scan
            </button>
          </form>

          {/* Auto-Watchlist Banner */}
          {watchlist?.tickers?.length > 0 && (
            <div className="bg-[#0D1520] border border-[var(--color-cyan)]/15 rounded-sm p-4" style={{ animation: 'signalPulse 3s ease-in-out 2' }}>
              <div className="flex items-center gap-2 mb-3">
                <i className="fa-solid fa-bolt text-[var(--color-cyan)]" />
                <span className="text-[10px] font-bold text-[var(--color-cyan)] uppercase tracking-[0.2em]">Auto-Correlated Watchlist</span>
                <span className="text-[8px] text-white/20 font-mono ml-auto">{new Date(watchlist.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="text-[10px] text-white/40 mb-3 flex items-center gap-1.5">
                <i className="fa-solid fa-triangle-exclamation text-[var(--color-red)]" style={{ fontSize: 9 }} />
                <span>Triggered by: {watchlist.triggerEvent}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {watchlist.tickers.map((t, i) => (
                  <button key={i} onClick={() => { setTicker(t.symbol); handleSearch(t.symbol); }}
                    className="bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 hover:border-[var(--color-cyan)]/30 rounded-sm p-3 transition-all cursor-pointer text-left group"
                    style={{ background: 'transparent' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <i className={`fa-solid ${t.impactDirection === 'POSITIVE' ? 'fa-arrow-trend-up text-[var(--color-green)]' : 'fa-arrow-trend-down text-[var(--color-red)]'}`} style={{ fontSize: 11 }} />
                      <span className="text-white font-bold text-sm">{t.symbol}</span>
                    </div>
                    <span className="text-white/25 text-[9px] line-clamp-2">{t.reasoning}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Watchlist / Portfolio */}
          <div className="bg-[#0D1520] border border-white/5 rounded-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-list-check text-white/40" />
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Manual Portfolio Watchlist</span>
              </div>
              <form onSubmit={addPortfolioItem} className="flex items-center gap-2">
                <input type="text" placeholder="Add ticker..." value={newPortfolioTicker} onChange={e => setNewPortfolioTicker(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-sm px-3 py-1.5 text-[10px] text-white outline-none w-32 focus:border-[var(--color-cyan)]" />
                <button type="submit" className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-[10px] text-white/60 hover:text-white transition-all cursor-pointer">
                  Add
                </button>
              </form>
            </div>
            {portfolio.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {portfolio.map((sym) => (
                  <div key={sym} onClick={() => { setTicker(sym); handleSearch(sym); }}
                    className="flex items-center justify-between bg-white/[0.02] border border-white/5 hover:border-white/20 rounded-sm p-2 transition-all cursor-pointer group">
                    <span className="text-white font-bold text-xs">{sym}</span>
                    <button onClick={(e) => removePortfolioItem(sym, e)} className="text-white/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer p-1">
                      <i className="fa-solid fa-xmark text-[10px]"></i>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-white/20 font-mono text-center py-4">No tickers in watchlist. Add one to track.</div>
            )}
          </div>

          {/* Loading */}
          {financeLoading && (
            <div className="h-64 border border-white/5 rounded-sm overflow-hidden">
              <TerminalLoader context={`SCANNING ASSET: ${ticker.toUpperCase() || 'AWAITING INPUT'}`} />
            </div>
          )}

          {/* Stock Analysis Result */}
          {!financeLoading && quote && (
            <FullStockCard quote={quote} signal={signal} onGetSignal={() => handleGetSignal(quote.symbol)} />
          )}

          {/* Market Dashboard Grid */}
          <div className="grid grid-cols-3 gap-4">
            {/* Crypto */}
            {overview?.crypto && (
              <div className="bg-[#0D1520] border border-white/5 rounded-sm p-4">
                <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono tracking-widest uppercase mb-4">
                  <i className="fa-brands fa-ethereum text-[10px]" /> Digital Assets
                </div>
                <div className="space-y-3">
                  {overview.crypto.map(c => (
                    <div key={c.symbol} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-sm p-3 hover:bg-white/[0.06] transition-all group">
                      <div>
                        <div className="text-white font-bold text-sm">{c.symbol}</div>
                        <div className="text-white/30 text-[9px] mt-0.5">{c.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-mono-num font-bold text-sm">${c.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        <div className={`text-[10px] font-mono-num font-bold mt-0.5 ${c.change >= 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                          {c.change >= 0 ? '+' : ''}{c.change?.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Forex */}
            {overview?.forex && (
              <div className="bg-[#0D1520] border border-white/5 rounded-sm p-4">
                <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono tracking-widest uppercase mb-4">
                  <i className="fa-solid fa-building-columns text-[10px]" /> Central Bank Desk
                </div>
                <div className="space-y-3">
                  {overview.forex.map(f => (
                    <div key={f.pair} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-sm p-3 hover:bg-white/[0.06] transition-all">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1">
                          {f.flags?.map(fl => <FlagIcon key={fl} iso2={fl} size={16} className="border border-black" />)}
                        </div>
                        <span className="text-white font-bold text-sm">{f.pair}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white font-mono-num font-bold text-sm">{f.rate?.toFixed(4)}</span>
                        <span className={`font-mono-num text-[10px] font-bold ${f.change >= 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                          {f.change >= 0 ? '+' : ''}{f.change?.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Market Sentiment */}
            <div className="bg-[#0D1520] border border-white/5 rounded-sm p-4 flex flex-col">
              <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono tracking-widest uppercase mb-4">
                <i className="fa-solid fa-brain text-[10px]" /> Market Sentiment
              </div>
              {overview?.fearGreed && (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                      <circle cx="60" cy="60" r="52" fill="none"
                        stroke={overview.fearGreed.value > 60 ? 'var(--color-green)' : overview.fearGreed.value > 40 ? 'var(--color-yellow)' : 'var(--color-red)'}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(overview.fearGreed.value / 100) * 327} 327`}
                        style={{ transition: 'stroke-dasharray 1s ease' }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-white font-bold text-3xl font-mono-num">{overview.fearGreed.value}</span>
                    </div>
                  </div>
                  <div className={`mt-4 px-3 py-1 rounded-sm text-[11px] font-bold uppercase tracking-[0.2em] ${
                    overview.fearGreed.value > 60 ? 'text-[var(--color-green)] bg-[var(--color-green)]/10' :
                    overview.fearGreed.value > 40 ? 'text-[var(--color-yellow)] bg-[var(--color-yellow)]/10' :
                    'text-[var(--color-red)] bg-[var(--color-red)]/10'}`}>
                    {overview.fearGreed.label}
                  </div>
                  <span className="text-[9px] text-white/30 font-mono uppercase tracking-widest mt-2">Fear & Greed Index</span>
                </div>
              )}

              {/* Commodities */}
              {overview?.commodities && (
                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                  <div className="text-[9px] text-white/30 font-mono uppercase tracking-widest mb-2">Commodities</div>
                  {overview.commodities.map(c => (
                    <div key={c.symbol} className="flex items-center justify-between text-[11px]">
                      <span className="text-white/60">{c.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-mono-num font-bold">${c.price?.toLocaleString()}</span>
                        <span className={`font-mono-num ${c.change >= 0 ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                          {c.change >= 0 ? '+' : ''}{c.change?.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}