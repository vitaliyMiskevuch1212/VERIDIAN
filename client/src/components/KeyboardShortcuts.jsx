import React, { useState, useEffect } from 'react';

const SHORTCUT_GROUPS = [
  {
    label: 'Navigation',
    icon: 'fa-compass',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Open Omni-Command' },
      { keys: ['1'], description: 'Switch to Intel tab' },
      { keys: ['2'], description: 'Switch to Trade tab' },
      { keys: ['3'], description: 'Switch to Forecast tab' },
      { keys: ['4'], description: 'Switch to SITREP tab' },
    ]
  },
  {
    label: 'View Controls',
    icon: 'fa-eye',
    shortcuts: [
      { keys: ['G'], description: 'Toggle Globe / Map view' },
      { keys: ['H'], description: 'Hide / Show intel panels' },
      { keys: ['F'], description: 'Toggle military flights' },
      { keys: ['C'], description: 'Toggle cyber threats' },
      { keys: ['R'], description: 'Toggle regions overlay' },
    ]
  },
  {
    label: 'Time Filters',
    icon: 'fa-clock',
    shortcuts: [
      { keys: ['Alt', '1'], description: 'Set time range: 1 hour' },
      { keys: ['Alt', '2'], description: 'Set time range: 6 hours' },
      { keys: ['Alt', '3'], description: 'Set time range: 24 hours' },
      { keys: ['Alt', '4'], description: 'Set time range: 7 days' },
    ]
  },
  {
    label: 'System',
    icon: 'fa-gear',
    shortcuts: [
      { keys: ['V'], description: 'Toggle voice comms' },
      { keys: ['?'], description: 'Show this help' },
      { keys: ['Esc'], description: 'Close modals / panels' },
    ]
  }
];

export default function KeyboardShortcuts({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#0A0F1E] border border-[var(--color-cyan)]/20 rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_30px_rgba(0,212,255,0.08)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/20 flex items-center justify-center">
              <i className="fa-solid fa-keyboard text-[var(--color-cyan)] text-sm" />
            </div>
            <div>
              <h2 className="text-white font-heading text-sm uppercase tracking-[0.15em]">Keyboard Shortcuts</h2>
              <p className="text-white/30 text-[9px] font-mono uppercase tracking-widest mt-0.5">Tactical Command Interface</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-2"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        {/* Shortcuts Grid */}
        <div className="p-6 grid grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-3">
                <i className={`fa-solid ${group.icon} text-[var(--color-cyan)] text-[10px]`} />
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em]">{group.label}</span>
              </div>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-sm hover:bg-white/[0.03] transition-colors group">
                    <span className="text-white/60 text-[11px] group-hover:text-white/80 transition-colors">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, ki) => (
                        <React.Fragment key={ki}>
                          {ki > 0 && <span className="text-white/15 text-[9px]">+</span>}
                          <span className="kbd-key">{key}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-black/20 border-t border-white/5 flex items-center justify-between">
          <span className="text-[9px] text-white/20 font-mono tracking-wider">
            Press <span className="kbd-key" style={{ display: 'inline-flex' }}>?</span> to toggle this panel
          </span>
          <span className="text-[9px] text-[var(--color-cyan)] font-bold tracking-[0.2em] uppercase">
            Veridian HQ
          </span>
        </div>
      </div>
    </div>
  );
}
