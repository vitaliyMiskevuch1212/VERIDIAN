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
    const duration = 1000; // Fast 1s load for high-speed feel
    const interval = 20;
    const step = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 200); // Near-instant transition
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
    <div className="fixed inset-0 z-[9999] bg-[#0A0F1E] flex flex-col items-center justify-center font-mono overflow-hidden">
      {/* CRT Scanline Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
           style={{ background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(0, 212, 255, 0.05), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.05))', backgroundSize: '100% 4px, 3px 100%' }}>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6">
        {/* Branding */}
        <div className="mb-12 text-center animate-pulse">
          <div className="text-[#00D4FF] text-4xl mb-1 tracking-[0.3em] font-heading lowercase flex items-center justify-center">
             <span className="border-2 border-[#00D4FF] px-2 mr-2">V</span>
             VERIDIAN
          </div>
          <div className="text-[#00D4FF] text-[10px] tracking-[0.5em] uppercase opacity-80">
            SYSTEM CORE ONLINE
          </div>
        </div>

        {/* Global Status */}
        <div className="text-white text-xs tracking-widest mb-6 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-ping"></span>
          SYNCING INTELLIGENCE HUD...
        </div>

        {/* Progress Section */}
        <div className="w-full mb-8">
          <div className="flex justify-between text-[10px] text-muted mb-2 tracking-tighter">
            <span>BITSTREAM SYNC...</span>
            <span className="text-[#00D4FF]">{Math.floor(progress)}%</span>
          </div>
          <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
            <div 
              className="h-full bg-[#00D4FF] transition-all duration-75 shadow-[0_0_10px_#00D4FF]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Task Checklist */}
        <div className="space-y-3 w-full mb-12">
          {LOADING_TASKS.map(task => (
            <div key={task.id} className="flex items-center gap-3 text-[10px] tracking-widest">
              <span className={`transition-colors duration-300 ${completedTasks.includes(task.id) ? 'text-[#00FF88]' : 'text-white/20'}`}>
                {completedTasks.includes(task.id) ? '✓' : '>'}
              </span>
              <span className={completedTasks.includes(task.id) ? 'text-white' : 'text-white/40'}>
                {task.label}
              </span>
            </div>
          ))}
        </div>

        {/* Footer Tagline */}
        <div className="text-white/20 text-[9px] tracking-[0.8em] uppercase mt-4">
          The World. Decoded.
        </div>
      </div>
    </div>
  );
}
