import { useCallback, useRef } from 'react';

export default function useTacticalVoice() {
  const audioCtx = useRef(null);
  
  // 🎙️ GENERATE MECHANICAL AIR RAID SIREN (YouTube Ref: 400Hz-600Hz Wail)
  const playSiren = useCallback(() => {
    try {
      if (!audioCtx.current) {
        audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const ctx = audioCtx.current;
      if (ctx.state === 'suspended') ctx.resume();

      const duration = 3.5; // One full wail cycle
      const startTime = ctx.currentTime;

      // Dual-Oscillator Setup for "Mechanical Dissonance"
      [400, 500].forEach((baseFreq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        
        // The iconic "Wail" - Frequency sweeps up and down
        osc.frequency.setValueAtTime(baseFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, startTime + duration * 0.4);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, startTime + duration * 0.9);

        // Gain Envelope
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.2); // Powerful entry
        gain.gain.linearRampToValueAtTime(0, startTime + duration); // Gradual fade

        // Filter for "Mechanical Weight"
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
  }, []);

  // 🗣️ EXECUTE DEEP FEMALE MILITARY OPERATOR ANNOUNCEMENT
  const announce = useCallback((text, priority = 'NORMAL') => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Mission Control Analytics Profile (Deep Female)
    utterance.rate = 1.0; 
    utterance.pitch = 0.75; 
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      (v.name.toLowerCase().includes('female') || 
       v.name.includes('Google UK English Female') || 
       v.name.includes('Zira') || 
       v.name.includes('Samantha')) && 
      v.lang.startsWith('en')
    ) || voices[0];
    
    if (femaleVoice) utterance.voice = femaleVoice;

    if (priority === 'CRITICAL' || priority === 'SURGE') {
      playSiren();
      // Wait for the full mechanical wail cycle to peak (approx 3.5s)
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 3500);
    } else {
      window.speechSynthesis.speak(utterance);
    }
  }, [playSiren]);

  return { announce, playSiren };
}
