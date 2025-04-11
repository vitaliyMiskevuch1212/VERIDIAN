import { useEffect, useRef, useCallback } from 'react';

// Generates retro sci-fi UI interactions using pure Web Audio API
export default function useTacticalAudio() {
  const ctxRef = useRef(null);
  const humOscRef = useRef(null);

  useEffect(() => {
    // Lazy init audio context
    const getCtx = () => {
      if (!ctxRef.current && typeof window !== 'undefined') {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        ctxRef.current = new AudioContext();
      }
      return ctxRef.current;
    };
    // Auto resume on first interaction
    const resumeAudio = () => {
        const ctx = getCtx();
        if (ctx.state !== 'running') {
          ctx.resume();
        }
      };
      window.addEventListener('mousedown', resumeAudio, { once: true });
      window.addEventListener('keydown', resumeAudio, { once: true });
  
      return () => {
        window.removeEventListener('mousedown', resumeAudio);
        window.removeEventListener('keydown', resumeAudio);
      };
    }, []);
  