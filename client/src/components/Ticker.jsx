import React from 'react';
import FlagIcon from './FlagIcon';
import './Ticker.css';

export default function Ticker({ events = [] }) {
  if (events.length === 0) return null;

  const getRelativeTime = (dateStr) => {
    const now = new Date();
    const then = new Date(dateStr);
    const diffInMins = Math.floor((now - then) / (1000 * 60));
    if (diffInMins < 1) return 'JUST NOW';
    if (diffInMins < 60) return `${diffInMins} MINS AGO`;
    return `${Math.floor(diffInMins / 60)} HOURS AGO`;
  };

  return (
    <div className="relative w-full h-10 bg-[#05080F] border-b border-white/5 flex items-center overflow-hidden z-[90]">
      <div className="h-full px-5 bg-[var(--color-red)] flex items-center gap-3 z-20 shadow-[10px_0_20px_rgba(0,0,0,0.8)] border-r border-black/20">
        <div className="relative flex items-center justify-center">
           <i className="fa-sharp fa-solid fa-triangle-exclamation text-white text-[12px] animate-pulse"></i>
        </div>
        <span className="text-white font-heading font-black text-[11px] tracking-[0.3em] uppercase pt-0.5">
          LATEST
        </span>
      </div>
      <div className="flex-1 overflow-hidden relative h-full bg-black/40">
        <div className="ticker-track flex items-center whitespace-nowrap h-full">
        </div>
      </div>
    </div>
  );
}