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