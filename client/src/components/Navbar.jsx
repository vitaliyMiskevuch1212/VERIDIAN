import React from 'react';

export default function TacticalButton({ label, icon, isLocked, accentColor = 'white' }) {
  return (
    <button
      className="h-8 px-3 border rounded-sm flex items-center gap-2 bg-transparent transition-all hover:bg-white/5 pointer-events-auto group outline-none"
      style={{ borderColor: `${accentColor}30` }}
    >
      {icon && (
        <i
          className={`fa-solid ${icon} text-[10px]`}
          style={{ color: accentColor }}
        ></i>
      )}

      <span
        className="text-[9px] font-bold uppercase tracking-[0.2em] group-hover:text-white transition-colors"
        style={{ color: `${accentColor}80` }}
      >
        {label}
      </span>

      {isLocked && (
        <i className="fa-solid fa-lock text-[8px] text-white/20 ml-1"></i>
      )}
    </button>
  );
}
import React, { useState, useEffect } from 'react';

export default function SystemStatus({ isConnected }) {
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2 ml-2">
      <div className="text-[var(--color-gold)] font-mono font-bold text-[13px] tracking-[0.2em]">
        {utcTime}
      </div>

      <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-white/10">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            isConnected
              ? 'bg-[var(--color-green)] animate-pulse'
              : 'bg-[var(--color-red)]'
          }`}
        ></div>

        <span
          className={`text-[8px] font-mono font-bold uppercase tracking-widest ${
            isConnected
              ? 'text-[var(--color-green)]/70'
              : 'text-[var(--color-red)]/70'
          }`}
        >
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
    </div>
  );
}