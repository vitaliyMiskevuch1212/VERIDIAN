import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import GlobalRiskIndex from '../components/GlobalRiskIndex';

export default function ForecastFullPage({ onClose }) {
  const { predictions, financeLoading } = useData();
  const { setWargameEvent } = useUI();
  const [activeIndex, setActiveIndex] = useState(0);

  const activePrediction = predictions?.predictions?.[activeIndex];

  return (
    <div className="absolute inset-0 z-30 bg-[#060B14] overflow-hidden flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/40 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-crystal-ball text-[var(--color-cyan)] text-lg" />
          <h1 className="text-white font-heading uppercase tracking-[0.4em] text-sm">Strategic Forecast</h1>
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
            <div className="bg-[#0D1520] border border-white/5 rounded-sm p-6">
               {/* Global Risk Index */}
               <div className="mb-8">
                  <GlobalRiskIndex context={predictions?.dataContext} />
               </div>

               {/* Top Prediction */}
               {activePrediction && (
                 <div className="bg-white/[0.02] border border-white/5 rounded-sm p-6 relative">
                   <div className="flex items-center justify-between mb-4">
                     <div className="text-[10px] font-bold text-[var(--color-red)] uppercase tracking-[0.2em] flex items-center gap-2">
                        <i className="fa-solid fa-chart-line-up text-[12px]" /> Top Prediction
                     </div>
                     <div className="flex gap-2">
                       <button onClick={() => setActiveIndex(prev => (prev > 0 ? prev - 1 : predictions.predictions.length - 1))} className="text-white/30 hover:text-white bg-transparent border-none cursor-pointer"><i className="fa-solid fa-chevron-left" /></button>
                       <button onClick={() => setActiveIndex(prev => (prev < predictions.predictions.length - 1 ? prev + 1 : 0))} className="text-white/30 hover:text-white bg-transparent border-none cursor-pointer"><i className="fa-solid fa-chevron-right" /></button>
                     </div>
                   </div>

                   <h3 className="text-white font-bold text-2xl leading-tight mb-6">{activePrediction.question}</h3>
                   
                   <div className="grid grid-cols-2 gap-6 mb-6">
                     <div>
                       <div className="text-4xl font-mono-num font-bold text-[var(--color-red)] mb-2 flex items-baseline gap-2">
                         {activePrediction.probability}% <span className="text-sm opacity-60">YES</span>
                       </div>
                       <div className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Probability derived from {300 + activePrediction.probability * 5} intelligence vectors</div>
                       {/* Sentiment Bar */}
                       <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex mt-3">
                         <div className="h-full bg-[var(--color-green)]" style={{ width: `${activePrediction.sentiment?.yes || 50}%` }} />
                         <div className="h-full bg-[var(--color-red)]" style={{ width: `${activePrediction.sentiment?.no || 50}%` }} />
                       </div>
                     </div>
                     <div className="h-24 opacity-60">
                       <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={(activePrediction.sparkline || [50,52,48,55,60,58,62]).map((val, i) => ({ x: i, y: val }))}>
                           <Line type="monotone" dataKey="y" stroke="var(--color-red)" strokeWidth={2} dot={false} />
                         </LineChart>
                       </ResponsiveContainer>
                     </div>
                   </div>

                   {/* AI Reasoning */}
                   {activePrediction.reasoning && (
                     <div className="p-4 bg-[var(--color-cyan)]/5 border-l-2 border-[var(--color-cyan)] mb-6">
                       <div className="text-[9px] font-bold text-[var(--color-cyan)] uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                         <i className="fa-solid fa-microchip" /> Intelligence Access Rationale
                       </div>
                       <p className="text-white/80 text-sm leading-relaxed">{activePrediction.reasoning}</p>
                     </div>
                   )}

                   <div className="flex justify-end gap-3">
                      <button onClick={() => setWargameEvent({ id: 'PRED', title: activePrediction.question, country: 'GLOBAL' })}
                         className="px-6 py-3 bg-[var(--color-red)]/10 text-[var(--color-red)] border border-[var(--color-red)]/30 font-bold tracking-[0.2em] uppercase text-xs rounded-sm hover:bg-[var(--color-red)]/20 cursor-pointer transition-all">
                         Commence Wargame
                      </button>
                   </div>
                 </div>
               )}
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="col-span-4 flex flex-col gap-6">
             {/* Markets Analysis */}
             {predictions?.indices && (
               <div className="bg-[#0D1520] border border-white/5 rounded-sm p-5">
                 <div className="text-[10px] font-bold text-[var(--color-cyan)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-grid-2 text-[12px]" /> Index Projections
                 </div>
                 {predictions.marketReasoning && (
                   <div className="mb-4 text-[10px] text-white/50 italic leading-relaxed">
                     <i className="fa-solid fa-microchip text-[var(--color-cyan)] mr-1" /> {predictions.marketReasoning}
                   </div>
                 )}
                 <div className="space-y-2">
                    {predictions.indices.map(idx => (
                      <div key={idx.name} className="p-3 bg-white/[0.03] border border-white/5 rounded-sm flex items-center justify-between">
                        <div>
                           <div className="text-[10px] uppercase tracking-widest text-white/60 mb-1">{idx.name}</div>
                           <div className="text-lg font-mono-num font-bold text-white">${idx.value?.toLocaleString()}</div>
                        </div>
                        <div className={`text-xs font-mono-num font-bold ${idx.isUp ? 'text-[var(--color-green)]' : 'text-[var(--color-red)]'}`}>
                           {idx.isUp ? '+' : ''}{idx.change}%
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
}
