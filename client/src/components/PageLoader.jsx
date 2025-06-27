import React, { useState, useEffect } from 'react';

const LOADING_TASKS = [
  { id: 'geo', label: 'STRATEGIC DATA STREAM' },
  { id: 'globe', label: '3D RENDERER ONLINE' },
  { id: 'neural', label: 'MARKET IMPACT NEURAL ENGINE' }
];

export default function PageLoader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [completedTasks, setCompletedTasks] = useState([]);

  useEffect(() => {
    const duration = 1000;
    const interval = 20;
    const step = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 200);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    if (progress > 30) setCompletedTasks(prev => prev.includes('geo') ? prev : [...prev, 'geo']);
    if (progress > 60) setCompletedTasks(prev => prev.includes('globe') ? prev : [...prev, 'globe']);
    if (progress > 90) setCompletedTasks(prev => prev.includes('neural') ? prev : [...prev, 'neural']);
  }, [progress]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#060A16] flex flex-col items-center justify-center font-mono overflow-hidden">
      {/* CRT Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-15" 
           style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(0, 212, 255, 0.04), rgba(0, 255, 0, 0.015), rgba(0, 0, 255, 0.04))', backgroundSize: '100% 4px, 3px 100%' }}>
      </div>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(0,212,255,0.03) 0%, transparent 70%)' }}></div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6">
        {/* Branding */}
        <div className="mb-14 text-center">
          <div className="text-[#00D4FF] text-4xl mb-2 tracking-[0.3em] font-heading lowercase flex items-center justify-center drop-shadow-[0_0_20px_rgba(0,212,255,0.2)]">
             <span className="border-2 border-[#00D4FF]/60 px-2 mr-2 animate-pulse">V</span>
             VERIDIAN
          </div>
          <div className="text-[#00D4FF]/60 text-[10px] tracking-[0.5em] uppercase">
            SYSTEM CORE ONLINE
          </div>
        </div>

        {/* Status */}
        <div className="text-white/70 text-xs tracking-widest mb-8 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-ping"></span>
          SYNCING INTELLIGENCE HUD...
        </div>

        {/* Progress */}
        <div className="w-full mb-10">
          <div className="flex justify-between text-[10px] text-white/30 mb-2.5 tracking-tighter">
            <span>BITSTREAM SYNC...</span>
            <span className="text-[#00D4FF] font-bold">{Math.floor(progress)}%</span>
          </div>
          <div className="h-[2px] w-full bg-white/[0.04] relative overflow-hidden rounded-full">
            <div 
              className="h-full bg-gradient-to-r from-[#00D4FF]/80 to-[#00D4FF] transition-all duration-75 rounded-full"
              style={{ width: `${progress}%`, boxShadow: '0 0 12px rgba(0,212,255,0.4), 0 0 4px rgba(0,212,255,0.6)' }}
            ></div>
          </div>
        </div>

        {/* Task Checklist */}
        <div className="space-y-3.5 w-full mb-14">
          {LOADING_TASKS.map(task => (
            <div key={task.id} className="flex items-center gap-3 text-[10px] tracking-widest">
              <span className={`transition-all duration-300 ${completedTasks.includes(task.id) ? 'text-[#00FF88] drop-shadow-[0_0_4px_rgba(0,255,136,0.4)]' : 'text-white/15'}`}>
                {completedTasks.includes(task.id) ? '✓' : '>'}
              </span>
              <span className={`transition-colors duration-300 ${completedTasks.includes(task.id) ? 'text-white/80' : 'text-white/25'}`}>
                {task.label}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-white/15 text-[9px] tracking-[0.8em] uppercase mt-4">
          The World. Decoded.
        </div>
      </div>
    </div>
  );
}
