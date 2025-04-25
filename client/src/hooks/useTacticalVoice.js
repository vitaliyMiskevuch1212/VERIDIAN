import { useCallback } from 'react';
import useAudioContext from './useAudioContext';

export default function useSiren() {
  const { getContext } = useAudioContext();

  const playSiren = useCallback(() => {
    try {
      const ctx = getContext();
      const duration = 3.5;
      const startTime = ctx.currentTime;

      [400, 500].forEach((baseFreq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';

        osc.frequency.setValueAtTime(baseFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, startTime + duration * 0.4);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, startTime + duration * 0.9);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.2);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2500, startTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (err) {
      console.warn('Mechanical siren synthesis failed:', err.message);
    }
  }, [getContext]);

  return { playSiren };
}