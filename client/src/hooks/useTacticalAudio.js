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
