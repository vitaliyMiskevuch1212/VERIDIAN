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

  // Ensure 10+ news by repeating if necessary, then triple for infinite scroll
  const baseItems = events.length > 0 ? events : [];
  const items = [...baseItems, ...baseItems, ...baseItems];

  return (
    <div className="relative w-full h-10 bg-[#05080F] border-b border-white/5 flex items-center overflow-hidden z-[90]">
      {/* 1. FIXED LATEST TAG - IMAGE MATCH */}
      <div className="h-full px-5 bg-[var(--color-red)] flex items-center gap-3 z-20 shadow-[10px_0_20px_rgba(0,0,0,0.8)] border-r border-black/20">
        <div className="relative flex items-center justify-center">
           <i className="fa-sharp fa-solid fa-triangle-exclamation text-white text-[12px] animate-pulse"></i>
        </div>
        <span className="text-white font-heading font-black text-[11px] tracking-[0.3em] uppercase pt-0.5">
          LATEST
        </span>
      </div>

      {/* 2. SCROLLING CONTAINER */}
      <div className="flex-1 overflow-hidden relative h-full bg-black/40">
        <div className="ticker-track flex items-center whitespace-nowrap h-full">
          {items.map((evt, i) => (
            <button
              key={`${evt.id || i}-${i}`}
              className="flex items-center gap-4 px-8 hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent outline-none h-full group"
              onClick={() => onEventClick?.(evt)}
            >
              <div className="flex items-center gap-3">
                <FlagIcon iso2={evt.iso2 || 'un'} size={16} />
                <span className="text-white font-bold text-[11px] uppercase tracking-wide group-hover:text-[var(--color-cyan)] transition-colors">
                  {evt.title}
                </span>
              </div>
              
              <div className="flex items-center gap-3 ml-2">
                <span className="text-white/30 font-mono text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">
                  {getRelativeTime(evt.publishedAt)}
                </span>
                <i className="fa-solid fa-circle text-[4px] text-white/10"></i>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
