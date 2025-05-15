import React from 'react';

const MARKET_DATA = [
  { symbol: 'S&P 500', icon: 'fa-chart-line', price: 5248.49, change: 0.82, type: 'index' },
  { symbol: 'NASDAQ', icon: 'fa-laptop-code', price: 16399.52, change: 1.14, type: 'index' },
  { symbol: 'DOW', icon: 'fa-industry', price: 39807.37, change: -0.25, type: 'index' },
  { symbol: 'GOLD', icon: 'fa-coins', price: 2178.40, change: 0.56, type: 'commodity' },
  { symbol: 'CRUDE OIL', icon: 'fa-oil-well', price: 81.26, change: -1.32, type: 'commodity' },
  { symbol: 'BTC', icon: 'fa-bitcoin-sign', price: 69420.00, change: 3.45, type: 'crypto' },
  { symbol: 'ETH', icon: 'fa-ethereum', price: 3521.80, change: 2.18, type: 'crypto' },
];

export default function MarketWatch() {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <i className="fa-solid fa-chart-mixed text-[var(--color-gold)] text-[10px]"></i>
        <span className="text-white/60 text-[9px] font-bold uppercase tracking-[0.2em]">Market Watch</span>
        <span className="text-white/20 text-[8px] font-mono ml-auto">LIVE</span>
      </div>
      <div className="space-y-1">
        {MARKET_DATA.map(m => {
          const isUp = m.change >= 0;
          return (
            <div key={m.symbol} className="flex items-center gap-2 py-1.5 px-2 rounded">
              <i className={`fa-solid ${m.icon} text-[10px] text-white/30 w-4`}></i>
              <span className="text-white/70 text-[10px] font-medium flex-1 min-w-0 truncate">{m.symbol}</span>
              <span className="text-white font-mono text-[10px] font-bold">
                {m.type === 'crypto' ? `$${m.price.toLocaleString()}` : `$${m.price.toFixed(2)}`}
              </span>
              <span className={`font-mono text-[9px] font-bold w-14 text-right ${isUp ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                {isUp ? '+' : ''}{m.change.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}