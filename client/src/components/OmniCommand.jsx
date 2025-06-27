import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { COUNTRY_COORDS } from '../utils/geoData';

/**
 * OmniCommand
 * -----------
 * A fullscreen command-palette overlay that provides unified search and
 * navigation across geopolitical events, news intel, countries, and live
 * financial tickers. Supports full keyboard navigation (↑ ↓ Enter Escape).
 *
 * Props:
 *   isOpen            {boolean}  – Controls modal visibility
 *   onClose           {fn}       – Callback to dismiss the palette
 *   events            {Array}    – Live geopolitical event feed
 *   news              {Array}    – News/intel article feed
 *   onNavigateCountry {fn}       – Flies the globe to a given country + coords
 *   onNavigateEvent   {fn}       – Flies the globe to a specific event marker
 *   onSearchFinance   {fn}       – Opens the finance panel for a ticker symbol
 */
export default function OmniCommand({ isOpen, onClose, events = [], news = [], onNavigateCountry, onNavigateEvent, onSearchFinance }) {
  const [query, setQuery] = useState('');           // Raw text typed by the user
  const [results, setResults] = useState([]);       // Computed result list shown in the palette
  const [selectedIndex, setSelectedIndex] = useState(0); // Keyboard-highlighted row index
  const [tickerPrice, setTickerPrice] = useState(null);  // Live price data for ticker-shaped queries
  const inputRef = useRef(null);                    // Ref for auto-focusing the search input on open

  // ── On Open: reset all transient state and focus the input ───────────────
  useEffect(() => {
    if (isOpen) {
      // 50ms delay lets any CSS open-transition complete before focus is applied
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
      setTickerPrice(null);
    }
  }, [isOpen]);

  /**
   * handleSelect
   * Routes a selected result to the appropriate navigation or action handler,
   * then resets query and closes the palette.
   */
  const handleSelect = (item) => {
    if (item.action === 'country' || item.action === 'region') {
      // Fly the globe to a country or broad geographic region
      onNavigateCountry(item.data, item.coords);
    } else if (item.action === 'event' || item.action === 'intel') {
      // Prefer precise lat/lng; fall back to country-level navigation
      if (item.data.lat && item.data.lng) {
        onNavigateEvent(item.data);
      } else if (item.data.country) {
        onNavigateCountry(item.data.country);
      }
    } else if (item.action === 'finance') {
      // Hand the ticker symbol off to the finance panel
      onSearchFinance(item.data);
    } else if (item.action === 'sitrep') {
      // TODO: wire up SITREP modal when implemented
      console.log('Open SITREP');
    }

    setQuery('');
    onClose();
  };

  // ── Global Keyboard Navigation ────────────────────────────────────────────
  // Attached to window so it works regardless of which element has focus.
  // Gated on isOpen to ensure no-op when the palette is closed.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') onClose();

      if (e.key === 'ArrowDown') {
        e.preventDefault(); // Prevent page scroll
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault(); // Prevent page scroll
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }

      // Confirm selection on Enter if results are available
      if (e.key === 'Enter' && results.length > 0) {
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Clean up listener on dependency change or unmount to avoid duplicates
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // ── Live Finance Ticker Fetcher ───────────────────────────────────────────
  // Triggers only when the query matches the shape of a ticker symbol:
  // 2–5 uppercase chars, no spaces. Debounced 300ms to avoid request spam.
  // AbortController cancels in-flight requests if the query changes mid-fetch,
  // preventing stale prices from flashing after a different query resolves.
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
          // Ignore intentional aborts; clear stale price on real errors
          if (e.name !== 'AbortError') setTickerPrice(null);
        }
      }, 300);

      // Cleanup: cancel debounce timer and abort any pending request
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    } else {
      // Non-ticker query — clear any previously fetched price
      setTickerPrice(null);
    }
  }, [query]);

  // ── Dynamic Search Result Engine ─────────────────────────────────────────
  // Recomputes the result list whenever query, events, or news changes.
  // Results are built in priority order: ticker → countries → events → news.
  useEffect(() => {
    // Empty query: show three default quick-action suggestions
    if (!query.trim()) {
      setResults([
        { type: 'COMMAND', icon: 'fa-globe',            title: 'Open Global SITREP',      action: 'sitrep' },
        { type: 'FINANCE', icon: 'fa-chart-line',       title: 'Analyze Ticker: LMT',     data: 'LMT',   action: 'finance' },
        { type: 'REGION',  icon: 'fa-map-location-dot', title: 'Fly to Middle East',       data: 'iraq',  action: 'region'  }
      ]);
      setSelectedIndex(0);
      return;
    }

    const q = query.toLowerCase();
    const newResults = [];

    // ── 1. Ticker symbol (shape heuristic) ──
    // Pushed first so finance results always appear at the top of the list.
    if (q.length >= 2 && q.length <= 5 && !q.includes(' ')) {
      const upperQ = q.toUpperCase();
      const hasLivePrice = tickerPrice && tickerPrice.symbol === upperQ;

      newResults.push({
        type: 'FINANCE',
        icon: 'fa-chart-line',
        // Show enriched title with live price + delta if already fetched,
        // otherwise show a generic analysis prompt as a placeholder
        title: hasLivePrice
          ? `ASSET: ${upperQ} | PRICE: $${tickerPrice.price.toLocaleString()} (${tickerPrice.change >= 0 ? '+' : ''}${tickerPrice.change.toFixed(2)}%)`
          : `Run Financial Analysis on ${upperQ}`,
        data: upperQ,
        action: 'finance',
        isLive: hasLivePrice // Drives the green pulse icon in the UI
      });
    }

    // ── 2. Countries ──
    // Merge countries from active events with the full GeoData set, then
    // deduplicate via Set so hot-spot nations don't appear twice.
    const eventCountries = events.filter(e => e.country).map(e => e.country);
    const allCountries = [...new Set([...eventCountries, ...Object.keys(COUNTRY_COORDS)])];

    const matchedCountries = allCountries
      .filter(c => c.toLowerCase().includes(q))
      // Sort so closer prefix matches surface above mid-string matches
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

    // ── 3. Geopolitical Events ──
    // Match against both title and description for broader coverage.
    const matchedEvents = events
      .filter(e => e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q)))
      .slice(0, 5);

    matchedEvents.forEach(e => {
      newResults.push({
        type: 'EVENT',
        icon: 'fa-crosshairs',
        severity: e.severity, // Passed to the severity badge in the result row
        title: e.title,
        data: e,
        action: 'event'
      });
    });

    // ── 4. News / Intel Articles ──
    const matchedNews = news
      .filter(n => n.title.toLowerCase().includes(q))
      .slice(0, 5);

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
    setSelectedIndex(0); // Reset highlight to top on every new result set
  }, [query, events, news]);

  // Do not mount the modal DOM at all when closed (saves render cost)
  if (!isOpen) return null;

  return (
    // Backdrop — full-viewport overlay; clicking outside the modal closes it
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="w-full max-w-2xl bg-gradient-to-b from-[#0C1220] to-[#0A0F1E] border border-[var(--color-cyan)]/20 rounded-xl overflow-hidden flex flex-col"
        style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,212,255,0.08), inset 0 1px 0 rgba(255,255,255,0.04)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Search Input Header ── */}
        <div className="flex items-center px-5 py-4 border-b border-white/[0.06] bg-black/30 relative">
          <i className="fa-solid fa-angle-right text-[var(--color-cyan)] text-lg mr-3 animate-pulse drop-shadow-[0_0_6px_rgba(0,212,255,0.4)]"></i>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none text-white text-lg font-mono placeholder-white/15 outline-none"
            placeholder="Search coordinates, intel, or stock tickers (e.g., LMT)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="text-[10px] text-white/25 font-bold tracking-wider uppercase bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.06]">ESC to close</div>
        </div>

        {/* ── Result List ── */}
        {/* max-h + overflow-y-auto keeps the modal height stable as results grow */}
        <div className="max-h-[50vh] overflow-y-auto custom-scrollbar flex flex-col p-2.5 space-y-1">
          {results.length === 0 ? (
            <div className="p-10 text-center text-white/20 font-mono text-sm">
              <i className="fa-solid fa-satellite-dish text-2xl mb-3 opacity-15 block"></i>
              NO INTELLIGENCE FOUND
            </div>
          ) : (
            results.map((result, idx) => {
              const isActive = idx === selectedIndex;

              // Map severity level to its corresponding CSS color token
              const severityColor = result.severity === 'CRITICAL' ? 'var(--color-red)'
                                  : result.severity === 'HIGH'     ? 'var(--color-orange)'
                                  :                                   'var(--color-cyan)';

              return (
                // Result row — click selects, hover syncs keyboard index
                <div
                  key={idx}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center gap-3 p-3.5 rounded-md cursor-pointer transition-all border-l-2 ${
                    isActive
                      ? 'bg-[var(--color-cyan)]/[0.07] border-[var(--color-cyan)] shadow-[inset_0_0_20px_rgba(0,212,255,0.06)]'
                      : 'bg-transparent border-transparent hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Icon column — cyan when active, green + pulse when live ticker */}
                  <div className="w-6 flex justify-center text-white/40">
                    <i className={`fa-solid ${result.icon} ${isActive ? 'text-[var(--color-cyan)]' : ''} ${result.isLive ? 'animate-pulse text-[var(--color-green)] font-bold' : ''}`}></i>
                  </div>

                  {/* Text column: title + optional severity badge + type label */}
                  <div className="flex-1 overflow-hidden">
                    <div className={`text-sm font-bold truncate flex items-center gap-2 ${isActive ? 'text-white' : 'text-white/90'}`}>
                      {result.title}
                      {/* Severity pill — only rendered for EVENT and INTEL results */}
                      {result.severity && (
                        <span
                          className="text-[8px] px-1.5 py-0.5 border rounded font-mono leading-none flex items-center h-fit"
                          style={{ color: severityColor, borderColor: `${severityColor}60` }}
                        >
                          {result.severity}
                        </span>
                      )}
                    </div>
                    {/* Result type label (COUNTRY / EVENT / INTEL / FINANCE …) */}
                    <div className="text-[10px] text-[var(--color-cyan)]/60 uppercase tracking-widest font-mono mt-0.5">
                      {result.type}
                    </div>
                  </div>

                  {/* Enter-to-confirm chevron — only visible on active row */}
                  {isActive && (
                    <i className="fa-solid fa-turn-down-left text-white/20 text-xs text-right w-4"></i>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer: keyboard hints + status label ── */}
        <div className="bg-[#040810] px-5 py-2.5 flex items-center justify-between border-t border-white/[0.05]">
          <div className="flex items-center gap-4 text-[9px] text-white/30 font-mono">
            <span>
              <kbd className="px-1.5 py-0.5 bg-white/[0.04] rounded-md border border-white/[0.08] text-white/50">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 bg-white/[0.04] rounded-md border border-white/[0.08] text-white/50">↓</kbd>{' '}
              to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-white/[0.04] rounded-md border border-white/[0.08] text-white/50">ENTER</kbd>{' '}
              to select
            </span>
          </div>
          <div className="text-[9px] tracking-[0.2em] uppercase text-[var(--color-cyan)]/70 font-bold flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse shadow-[0_0_4px_var(--color-cyan)]"></span>
            Omni-Command Active
          </div>
        </div>
      </div>
    </div>
  );
}