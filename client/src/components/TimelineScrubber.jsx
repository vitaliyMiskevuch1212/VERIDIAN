import React, { useState, useEffect, useRef } from 'react';
import useTacticalAudio from '../hooks/useTacticalAudio';

export default function TimelineScrubber({ minTime, maxTime, scrubTime, onScrub }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audio = useTacticalAudio();
  const playTimer = useRef(null);
  
  // Format MM/DD HH:mm
  const formatTime = (ts) => {
    const d = new Date(ts);
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    onScrub(val);
  };

  useEffect(() => {
    if (isPlaying) {
      playTimer.current = setInterval(() => {
        onScrub(prev => {
          // Advance time by 30 mins every interval (which runs every 100ms)
          const step = 30 * 60 * 1000;
          const next = prev + step;
          if (next >= maxTime) {
            setIsPlaying(false);
            return maxTime;
          }
          return next;
        });
      }, 50);
    } else {
      if (playTimer.current) clearInterval(playTimer.current);
    }
    return () => clearInterval(playTimer.current);
  }, [isPlaying, maxTime, onScrub]);

  const togglePlayback = () => {
    if (!isPlaying && scrubTime >= maxTime) {
      // If at the end, restart from beginning
      onScrub(minTime);
    }
    audio.playClick();
    setIsPlaying(!isPlaying);
  };

  const progressPercentage = ((scrubTime - minTime) / (maxTime - minTime)) * 100;

  return (
    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-full max-w-3xl px-8 flex flex-col items-center animate-fade-in-up">
      <div className="bg-[#060B14]/90 backdrop-blur-md border border-[var(--color-cyan)]/30 rounded-xl px-6 py-3 w-full panel-glow flex items-center gap-6 shadow-[0_0_30px_rgba(0,212,255,0.1)]">
        
        {/* Play/Pause Button */}
        <button 
          onClick={togglePlayback}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] border border-[var(--color-cyan)]/40 hover:bg-[var(--color-cyan)]/30 hover:scale-110 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,212,255,0.2)]"
        >
          <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-sm`}></i>
        </button>

        <div className="flex-1 flex flex-col gap-2 relative">
          <div className="flex justify-between text-[10px] font-mono text-[var(--color-cyan)] uppercase tracking-widest opacity-80">
            <span>{formatTime(minTime)} (-7d)</span>
            <span className="font-bold text-[12px] opacity-100">{formatTime(scrubTime)}</span>
            <span>{formatTime(maxTime)} (Live)</span>
          </div>
          
          <div className="relative w-full h-1.5 bg-white/10 rounded-full">
            {/* Active Progress */}
            <div 
              className="absolute top-0 left-0 h-full bg-[var(--color-cyan)] rounded-full shadow-[0_0_10px_rgba(0,212,255,0.8)]"
              style={{ width: `${progressPercentage}%` }}
            ></div>
            
            {/* Range Slider */}
            <input 
              type="range" 
              min={minTime} 
              max={maxTime} 
              value={scrubTime} 
              onChange={handleSliderChange}
              onMouseDown={() => { setIsPlaying(false); audio.playHover(); }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-[var(--color-cyan)]/60 font-mono uppercase tracking-[0.2em]">Temporal Filter</span>
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {scrubTime >= maxTime ? 'Live Intel' : 'Historical Data'}
          </span>
        </div>
      </div>
    </div>
  );
}