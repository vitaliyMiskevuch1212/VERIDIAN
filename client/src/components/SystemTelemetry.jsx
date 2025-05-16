import React, { useState, useEffect } from 'react';

export default function SystemTelemetry({ panelsVisible = true }) {
  const [dataRate, setDataRate] = useState(0);
  const [ram, setRam] = useState(32);
  const [cpu, setCpu] = useState(14);
  const [satellites, setSatellites] = useState([true, true, false, true]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDataRate(Math.floor(400 + Math.random() * 800)); // 400 - 1200 TB/s
      setRam(32 + Math.random() * 12); // Fluctuate RAM
      setCpu(14 + Math.random() * 30); // Fluctuate CPU
      
      // Randomly drop a satellite link very rarely
      if (Math.random() > 0.95) {
        setSatellites(prev => {
          const next = [...prev];
          const idx = Math.floor(Math.random() * 4);
          next[idx] = !next[idx];
          return next;
        });
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-40 font-mono text-[6px] tracking-widest uppercase flex gap-2 opacity-80 mix-blend-screen text-[var(--color-cyan)] transition-all duration-500`}>
      
      {/* Network Ticker */}
      <div className="bg-black/80 border border-[var(--color-cyan)]/30 p-1 flex justify-between items-center shadow-[0_0_10px_rgba(0,212,255,0.1)] w-full">
        <span className="text-white/50">UPLINK</span>
        <span className="font-bold text-white">{dataRate} TB/S</span>
      </div>

      {/* Hardware Bars */}
      <div className="bg-black/80 border border-[var(--color-cyan)]/30 p-1 flex flex-col justify-center gap-1 shadow-[0_0_10px_rgba(0,212,255,0.1)] w-full">
        <div className="flex justify-between items-center">
          <span className="text-white/50 w-4">RAM</span>
          <div className="flex-1 h-0.5 bg-white/10 mx-1 overflow-hidden">
            <div className="h-full bg-[var(--color-cyan)] transition-all duration-300" style={{ width: `${ram}%` }}></div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/50 w-4">CPU</span>
          <div className="flex-1 h-0.5 bg-white/10 mx-1 overflow-hidden">
            <div className="h-full bg-[var(--color-purple)] transition-all duration-300" style={{ width: `${cpu}%` }}></div>
          </div>
        </div>
      </div>

      {/* Deep Space Nodes */}
      <div className="bg-black/80 border border-[var(--color-cyan)]/30 p-1 shadow-[0_0_10px_rgba(0,212,255,0.1)] w-full flex items-center gap-1">
        <div className="text-white/50">RELAYS</div>
        <div className="flex gap-0.5 flex-1 h-full items-center">
          {satellites.map((isUp, i) => (
            <div key={i} className={`flex-1 h-1 border ${isUp ? 'bg-[var(--color-cyan)]/20 border-[var(--color-cyan)]' : 'bg-[var(--color-red)]/20 border-[var(--color-red)]'} transition-colors duration-200`}></div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
