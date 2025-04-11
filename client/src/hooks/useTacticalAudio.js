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
    const playHover = useCallback(() => {
        if (!ctxRef.current) return;
        const ctx = ctxRef.current;
        
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
    
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.02);
    
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
    
        osc.start();
        osc.stop(ctx.currentTime + 0.02);
      }, []);
    
      const playClick = useCallback(() => {
        if (!ctxRef.current) return;
        const ctx = ctxRef.current;
        
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
    
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.05);
    
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
    
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }, []);
      const playBloop = useCallback(() => {
        if (!ctxRef.current) return;
        const ctx = ctxRef.current;
        
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
    
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.05);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
    
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
    
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }, []);
    