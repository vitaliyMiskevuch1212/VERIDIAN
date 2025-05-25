import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import MarketWatch from '../components/MarketWatch';
import TopKeywords from '../components/TopKeywords';
import NewsPanel from '../components/NewsPanel';

export default function IntelFullPage({ onClose }) {
  const { news, newsLoading, overview } = useData();

  return (
    <div className="absolute inset-0 z-30 bg-[#060B14] overflow-hidden flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/40 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-tower-broadcast text-[var(--color-cyan)] text-lg" />
          <h1 className="text-white font-heading uppercase tracking-[0.4em] text-sm">Global Intel Feed</h1>
          <span className="text-[8px] text-white/20 font-mono uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full border border-white/5">Full View</span>
        </div>
        <button onClick={onClose}
          className="px-4 py-2 text-white/30 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm transition-all cursor-pointer flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold">
          <i className="fa-solid fa-xmark" /> Close
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
          
          {/* Main Feed Column */}
          <div className="col-span-8 space-y-6">
            <div className="bg-[#0D1520] border border-white/5 rounded-sm p-5 h-full">
               <div className="flex items-center justify-between mb-4">
                  <div className="text-[10px] font-bold text-[var(--color-cyan)] uppercase tracking-[0.2em] flex items-center gap-2">
                     <i className="fa-solid fa-newspaper text-[12px]" /> Live Intelligence Stream
                  </div>
                  <div className="text-[9px] text-white/30 font-mono">
                     {news.filter(n => n.severity === 'CRITICAL').length} CRITICAL / {news.length} TOTAL
                  </div>
               </div>
               <div className="h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar pr-2">
                 <NewsPanel news={news} loading={newsLoading} hideTitle={true} isFullPage={true} />
               </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="col-span-4 flex flex-col gap-6">
             {/* Market Impact Summary */}
             <div className="bg-[#0D1520] border border-white/5 rounded-sm p-5">
               <div className="text-[10px] font-bold text-[var(--color-cyan)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-chart-pie text-[12px]" /> Global Market Impact
               </div>
               <MarketWatch overview={overview} />
             </div>

             {/* Keywords Analysis */}
             <div className="bg-[#0D1520] border border-white/5 rounded-sm p-5 flex-1">
               <div className="text-[10px] font-bold text-[var(--color-cyan)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-tags text-[12px]" /> Top Thematic Keywords
               </div>
               <TopKeywords news={news} />
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}