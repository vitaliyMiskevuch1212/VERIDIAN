import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { COUNTRY_COORDS } from '../utils/geoData';

export default function OmniCommand({ isOpen, onClose, events = [], news = [], onNavigateCountry, onNavigateEvent, onSearchFinance }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [tickerPrice, setTickerPrice] = useState(null);
  const inputRef = useRef(null);

  // Close on Escape, focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
      setTickerPrice(null);
    }
  }, [isOpen]);

  const handleSelect = (item) => {
    if (item.action === 'country' || item.action === 'region') {
      onNavigateCountry(item.data, item.coords);
    } else if (item.action === 'event' || item.action === 'intel') {
      if (item.data.lat && item.data.lng) {
        onNavigateEvent(item.data);
      } else if (item.data.country) {
        onNavigateCountry(item.data.country);
      }
    } else if (item.action === 'finance') {
      onSearchFinance(item.data);
    } else if (item.action === 'sitrep') {
      console.log('Open SITREP');
    }
    
    setQuery('');
    onClose();
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
      if (e.key === 'Enter' && results.length > 0) {
        handleSelect(results[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Live Finance Fetcher
  useEffect(() => {
    const q = query.trim().toUpperCase();
    if (q.length >= 2 && q.length <= 5 && !q.includes(' ')) {
      const controller = new AbortController();
      const timer = setTimeout(async () => {
        try {
          const res = await axios.get(`/api/finance/${q}`, { signal: controller.signal });
          if (res.data && res.data.price) {
            setTickerPrice({ symbol: q, price: res.data.price, change: res.data.change });
          }
        } catch (e) {
          if (e.name !== 'AbortError') setTickerPrice(null);
        }
      }, 300);
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    } else {
      setTickerPrice(null);
    }
  }, [query]);
  // Compute search results dynamically based on query
  useEffect(() => {
    if (!query.trim()) {
      // Default / empty state suggestions
      setResults([
        { type: 'COMMAND', icon: 'fa-globe', title: 'Open Global SITREP', action: 'sitrep' },
        { type: 'FINANCE', icon: 'fa-chart-line', title: 'Analyze Ticker: LMT', data: 'LMT', action: 'finance' },
        { type: 'REGION', icon: 'fa-map-location-dot', title: 'Fly to Middle East', data: 'iraq', action: 'region' }
      ]);
      setSelectedIndex(0);
      return;
    }

    const q = query.toLowerCase();
    const newResults = [];

    // 1. Check if looks like a Ticker symbol
    if (q.length >= 2 && q.length <= 5 && !q.includes(' ')) {
      const upperQ = q.toUpperCase();
      const hasLivePrice = tickerPrice && tickerPrice.symbol === upperQ;
      
      newResults.push({
        type: 'FINANCE',
        icon: 'fa-chart-line',
        title: hasLivePrice 
          ? `ASSET: ${upperQ} | PRICE: $${tickerPrice.price.toLocaleString()} (${tickerPrice.change >= 0 ? '+' : ''}${tickerPrice.change.toFixed(2)}%)`
          : `Run Financial Analysis on ${upperQ}`,
        data: upperQ,
        action: 'finance',
        isLive: hasLivePrice
      });
    }

    // 2. Search Countries (Unified: Events + GeoData)
    const eventCountries = events.filter(e => e.country).map(e => e.country);
    const allCountries = [...new Set([...eventCountries, ...Object.keys(COUNTRY_COORDS)])];
    
    const matchedCountries = allCountries
      .filter(c => c.toLowerCase().includes(q))
      .sort((a, b) => a.toLowerCase().indexOf(q) - b.toLowerCase().indexOf(q))
      .slice(0, 5);

    matchedCountries.forEach(c => {
      newResults.push({
        type: 'COUNTRY',
        icon: 'fa-flag',
        title: `View Intelligence: ${c}`,
        data: c,
        action: 'country',
        coords: COUNTRY_COORDS[c]
      });
    });

    // 3. Search Events
    const matchedEvents = events.filter(e => e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q))).slice(0, 5);
    matchedEvents.forEach(e => {
      newResults.push({
        type: 'EVENT',
        icon: 'fa-crosshairs',
        severity: e.severity,
        title: e.title,
        data: e,
        action: 'event'
      });
    });

    // 4. Search News
    const matchedNews = news.filter(n => n.title.toLowerCase().includes(q)).slice(0, 5);
    matchedNews.forEach(n => {
      newResults.push({
        type: 'INTEL',
        icon: 'fa-newspaper',
        title: n.title,
        data: n,
        action: 'intel'
      });
    });

    setResults(newResults);
    setSelectedIndex(0);
  }, [query, events, news]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-[#0A0F1E] border border-[var(--color-cyan)]/30 rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(0,212,255,0.1)] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center px-4 py-4 border-b border-white/10 bg-black/40 relative">
          <i className="fa-solid fa-angle-right text-[var(--color-cyan)] text-lg mr-3 animate-pulse"></i>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none text-white text-lg font-mono placeholder-white/20 outline-none"
            placeholder="Search coordinates, intel, or stock tickers (e.g., LMT)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase bg-white/5 px-2 py-1 rounded">ESC to close</div>
        </div>

        {/* Results List */}
        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar flex flex-col p-2 space-y-1">
          {results.length === 0 ? (
            <div className="p-8 text-center text-white/30 font-mono text-sm">
              <i className="fa-solid fa-radar text-2xl mb-3 opacity-20 block"></i>
              NO INTELLIGENCE FOUND
            </div>
          ) : (
            results.map((result, idx) => {
              const isActive = idx === selectedIndex;
              const severityColor = result.severity === 'CRITICAL' ? 'var(--color-red)' :
                                    result.severity === 'HIGH' ? 'var(--color-orange)' : 'var(--color-cyan)';
              
              return (
                <div
                  key={idx}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3 p-3 rounded-sm cursor-pointer transition-all border-l-2 ${
                    isActive 
                      ? 'bg-[var(--color-cyan)]/10 border-[var(--color-cyan)] shadow-[inset_0_0_15px_rgba(0,212,255,0.1)]' 
                      : 'bg-transparent border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className="w-6 flex justify-center text-white/40">
                    <i className={`fa-solid ${result.icon} ${isActive ? 'text-[var(--color-cyan)]' : ''} ${result.isLive ? 'animate-pulse text-[var(--color-green)] font-bold' : ''}`}></i>
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <div className={`text-sm font-bold truncate flex items-center gap-2 ${isActive ? 'text-white' : 'text-white/90'}`}>
                       {result.title}
                       {result.severity && (
                         <span className="text-[8px] px-1 py-0.5 border rounded-sm font-mono leading-none flex items-center h-fit" style={{ color: severityColor, borderColor: `${severityColor}60` }}>
                           {result.severity}
                         </span>
                       )}
                    </div>
                    <div className="text-[10px] text-[var(--color-cyan)] uppercase tracking-widest font-mono mt-0.5">
                      {result.type}
                    </div>
                  </div>
                  
                  {isActive && (
                    <i className="fa-solid fa-turn-down-left text-white/20 text-xs text-right w-4"></i>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-[#050810] px-4 py-2 flex items-center justify-between border-t border-white/5">
           <div className="flex items-center gap-4 text-[9px] text-white/40 font-mono">
             <span><kbd className="px-1 py-0.5 bg-white/5 rounded border border-white/10 text-white/60">↑</kbd> <kbd className="px-1 py-0.5 bg-white/5 rounded border border-white/10 text-white/60">↓</kbd> to navigate</span>
             <span><kbd className="px-1 py-0.5 bg-white/5 rounded border border-white/10 text-white/60">ENTER</kbd> to select</span>
           </div>
           <div className="text-[9px] tracking-[0.2em] uppercase text-[var(--color-cyan)] font-bold">
             Omni-Command Active
           </div>
        </div>
      </div>
    </div>
  );
}
