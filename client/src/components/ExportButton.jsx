import React, { useState } from 'react';

/**
 * Export Button Component — shared across panels
 */
export default function ExportButton({ onCopy, onDownload, label = 'Export' }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative pointer-events-auto">
      <button onClick={(e) => { e.stopPropagation(); setShowMenu(prev => !prev); }}
        className="flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] text-white/25 hover:text-[var(--color-cyan)] bg-white/[0.03] hover:bg-[var(--color-cyan)]/[0.06] border border-white/[0.06] hover:border-[var(--color-cyan)]/[0.2] rounded-sm cursor-pointer transition-all btn-press"
        title={label}>
        <i className="fa-solid fa-file-export" style={{ fontSize: 9 }} />
        <span>{label}</span>
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-[#0D1520] border border-white/[0.1] rounded-md shadow-xl z-50 min-w-[140px] py-1 animate-fade-in">
          <button onClick={(e) => { e.stopPropagation(); onCopy?.(); setShowMenu(false); }}
            className="w-full px-3 py-2 text-left text-[10px] text-white/50 hover:text-white hover:bg-white/[0.04] flex items-center gap-2 cursor-pointer transition-all border-none bg-transparent">
            <i className="fa-solid fa-copy" style={{ fontSize: 10, color: 'var(--color-cyan)' }} />
            Copy to Clipboard
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDownload?.(); setShowMenu(false); }}
            className="w-full px-3 py-2 text-left text-[10px] text-white/50 hover:text-white hover:bg-white/[0.04] flex items-center gap-2 cursor-pointer transition-all border-none bg-transparent">
            <i className="fa-solid fa-download" style={{ fontSize: 10, color: 'var(--color-green)' }} />
            Download .txt
          </button>
        </div>
      )}
    </div>
  );
}
