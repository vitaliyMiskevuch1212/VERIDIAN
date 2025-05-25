import React from 'react';
import { useData } from '../context/DataContext';
import SitrepPanel from '../components/SitrepPanel';

export default function SitrepFullPage({ onClose }) {
  const { sitrep, sitrepLoading } = useData();

  return (
    <div className="absolute inset-0 z-30 bg-[#060B14] overflow-hidden flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/40 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-shield-halved text-[var(--color-red)] text-lg" />
          <h1 className="text-white font-heading uppercase tracking-[0.4em] text-sm">Critical SITREP</h1>
          <span className="text-[8px] text-white/20 font-mono uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full border border-white/5">Full View</span>
        </div>
        <button onClick={onClose}
          className="px-4 py-2 text-white/30 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm transition-all cursor-pointer flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
          <i className="fa-solid fa-xmark" /> Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* We can reuse the advanced SitrepPanel layout but give it more room by keeping it centered */}
        <div className="max-w-4xl mx-auto py-8">
           <SitrepPanel data={sitrep} loading={sitrepLoading} isFullPage={true} />
        </div>
      </div>
    </div>
  );
}