import React from 'react';
import FlagIcon from './FlagIcon';
import './Ticker.css';

export default function Ticker({ events = [], onEventClick }) {
  if (events.length === 0) return null;

  const getRelativeTime = (dateStr) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diffInMins = Math.floor((now - then) / (1000 * 60));
    if (diffInMins < 1) return 'JUST NOW';
    if (diffInMins < 60) return `${diffInMins} MINS AGO`;
    return `${Math.floor(diffInMins / 60)} HOURS AGO`;
  };

  const baseItems = events.length > 0 ? events : [];
  const items = [...baseItems, ...baseItems, ...baseItems];

  return (
    <div className="relative w-full h-10 bg-[#030609] border-b border-white/[0.04] flex items-center overflow-hidden z-[90]">
      {/* LATEST TAG — gradient background */}
      <div className="relative h-full px-5 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] flex items-center gap-3 z-20 shadow-[10px_0_30px_rgba(0,0,0,0.9)] border-r border-black/30">
        <div className="relative flex items-center justify-center">
           <i className="fa-sharp fa-solid fa-triangle-exclamation text-white text-[12px] animate-pulse drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]"></i>
        </div>
        <span className="text-white font-heading font-black text-[11px] tracking-[0.3em] uppercase pt-0.5">
          LATEST
        </span>
        {/* Fade edge from LATEST into scroll area */}
        <div className="absolute -right-8 top-0 bottom-0 w-8 bg-gradient-to-r from-[#B91C1C]/50 to-transparent pointer-events-none z-10"></div>
      </div>

      {/* SCROLLING CONTAINER */}
      <div className="flex-1 overflow-hidden relative h-full bg-black/30">
        {/* Left fade gradient */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#030609] to-transparent z-10 pointer-events-none"></div>
        {/* Right fade gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#030609] to-transparent z-10 pointer-events-none"></div>
        
        <div className="ticker-track flex items-center whitespace-nowrap h-full">
          {items.map((evt, i) => (
            <button
              key={`${evt.id || i}-${i}`}
              className="flex items-center gap-4 px-8 hover:bg-white/[0.04] transition-colors cursor-pointer border-none bg-transparent outline-none h-full group btn-press"
              onClick={() => onEventClick?.(evt)}
            >
              <div className="flex items-center gap-3">
                <FlagIcon iso2={evt.iso2 || 'un'} size={16} />
                <span className="text-white/90 font-semibold text-[11px] uppercase tracking-wide group-hover:text-[var(--color-cyan)] transition-colors">
                  {evt.title}
                </span>
              </div>
              
              <div className="flex items-center gap-3 ml-2">
                <span className="text-white/20 font-mono text-[9px] font-medium uppercase tracking-widest whitespace-nowrap">
                  {getRelativeTime(evt.publishedAt)}
                </span>
                <i className="fa-solid fa-circle text-[3px] text-white/[0.07]"></i>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
