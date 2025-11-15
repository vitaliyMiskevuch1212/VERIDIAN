import { useState, useEffect, useRef, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Wake word detection — matches "friday" and common variations/typos
const FRIDAY_REGEX = /fr[ioa]+d+[aeiy]+/i;

/**
 * useFriday — Voice orchestration hook for FRIDAY AI assistant
 *
 * State machine: OFF → STANDBY → LISTENING → PROCESSING → SPEAKING → STANDBY
 *
 * STANDBY:    Web Speech API continuously scanning for wake word
 * LISTENING:  Wake word detected, capturing user's command
 * PROCESSING: Command sent to server, waiting for FRIDAY's response
 * SPEAKING:   Playing FRIDAY's audio response via ElevenLabs
 */
export default function useFriday() {
  const [status, setStatus] = useState('OFF');
  const [subtitle, setSubtitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [error, setError] = useState(null);

  // Refs for values accessed inside event handlers (avoid stale closures)
  const statusRef = useRef('OFF');
  const recognitionRef = useRef(null);
  const sessionIdRef = useRef(Date.now().toString(36) + Math.random().toString(36).slice(2));
  const audioRef = useRef(null);
  const restartTimerRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const commandBufferRef = useRef('');
  const isEnabledRef = useRef(false);

  // Sync refs with state
  const updateStatus = useCallback((s) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  // ─── Extract command after wake word ─────────────────────
  function extractCommand(text) {
    // Remove everything up to and including the wake word
    const cleaned = text.replace(/^.*?fr[ioa]+d+[aeiy]+[,.\s]*/i, '').trim();
    return cleaned;
  }

  // ─── Send command to FRIDAY backend ──────────────────────
  const processCommand = useCallback(async (command) => {
    if (!command || command.length < 2) {
      updateStatus('STANDBY');
      setSubtitle('');
      setTranscript('');
      return;
    }

    updateStatus('PROCESSING');
    setSubtitle('FRIDAY processing...');
    setTranscript('');

    // Stop recognition while processing
    try { recognitionRef.current?.stop(); } catch {}

    try {
      const res = await fetch(`${API_URL}/api/friday/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: command,
          sessionId: sessionIdRef.current
        })
      });
      const data = await res.json();
      const responseText = data.response || 'No response.';

      // Now speak the response
      updateStatus('SPEAKING');
      setSubtitle(responseText);
      await speakResponse(responseText);
    } catch (err) {
      console.error('[FRIDAY] Processing error:', err);
      setSubtitle('Connection error. Retrying...');
      setTimeout(() => {
        updateStatus('STANDBY');
        setSubtitle('');
        startRecognition();
      }, 2000);
    }
  }, []);

  // ─── TTS: Try ElevenLabs, fallback to browser ───────────
  const speakResponse = useCallback(async (text) => {
    try {
      const res = await fetch(`${API_URL}/api/friday/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      // Check if we got audio or a fallback flag
      const contentType = res.headers.get('content-type');

      if (contentType?.includes('audio')) {
        // ElevenLabs audio — play it
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        return new Promise((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            audioRef.current = null;
            finishSpeaking();
            resolve();
          };
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            // Fallback to browser TTS
            browserSpeak(text).then(resolve);
          };
          audio.play().catch(() => browserSpeak(text).then(resolve));
        });
      } else {
        // Fallback response — use browser TTS
        await browserSpeak(text);
      }
    } catch {
      await browserSpeak(text);
    }
  }, []);

  // ─── Browser SpeechSynthesis fallback ────────────────────
  const browserSpeak = useCallback((text) => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        finishSpeaking();
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 0.75;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const female = voices.find(v =>
        (v.name.includes('Google UK English Female') ||
         v.name.includes('Zira') ||
         v.name.includes('Samantha')) &&
        v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (female) utterance.voice = female;

      utterance.onend = () => { finishSpeaking(); resolve(); };
      utterance.onerror = () => { finishSpeaking(); resolve(); };
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // ─── After speaking, return to standby ───────────────────
  const finishSpeaking = useCallback(() => {
    updateStatus('STANDBY');
    setSubtitle('');
    setTranscript('');
    // Restart recognition after a brief pause
    setTimeout(() => startRecognition(), 500);
  }, []);

  // ─── Start/restart Web Speech API ────────────────────────
  const startRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec || !isEnabledRef.current) return;

    try {
      rec.start();
    } catch (e) {
      // Already started or other error — retry after delay
      if (e.name !== 'InvalidStateError') {
        console.warn('[FRIDAY] Recognition start error:', e.message);
      }
    }
  }, []);

  // ─── Initialize Web Speech API ───────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Web Speech API not supported. Use Chrome or Edge.');
      return;
    }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const current = statusRef.current;
      if (current === 'PROCESSING' || current === 'SPEAKING' || current === 'OFF') return;

      // Get the latest result
      const lastIdx = event.results.length - 1;
      const result = event.results[lastIdx];
      const text = result[0].transcript.trim().toLowerCase();

      if (current === 'STANDBY') {
        // Scan for wake word
        if (FRIDAY_REGEX.test(text)) {
          const command = extractCommand(text);
          if (command && command.length > 2 && result.isFinal) {
            // Wake word + command in one breath: "Hey Friday what's the sitrep"
            processCommand(command);
          } else if (result.isFinal) {
            // Just wake word alone: "Hey Friday"
            updateStatus('LISTENING');
            setSubtitle('Listening...');
            commandBufferRef.current = '';
            // Set silence timeout
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
              if (statusRef.current === 'LISTENING') {
                updateStatus('STANDBY');
                setSubtitle('');
                setTranscript('');
              }
            }, 10000);
          }
        }
      } else if (current === 'LISTENING') {
        // Capturing the command
        setTranscript(result[0].transcript.trim());

        // Reset silence timeout on speech
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (statusRef.current === 'LISTENING' && commandBufferRef.current) {
            processCommand(commandBufferRef.current);
          } else if (statusRef.current === 'LISTENING') {
            updateStatus('STANDBY');
            setSubtitle('');
            setTranscript('');
          }
        }, 3000);

        if (result.isFinal) {
          const cmd = FRIDAY_REGEX.test(text) ? extractCommand(text) : result[0].transcript.trim();
          if (cmd && cmd.length > 2) {
            clearTimeout(silenceTimerRef.current);
            processCommand(cmd);
          } else {
            commandBufferRef.current = result[0].transcript.trim();
          }
        }
      }
    };

    recognition.onend = () => {
      // Auto-restart in STANDBY or LISTENING mode
      const current = statusRef.current;
      if ((current === 'STANDBY' || current === 'LISTENING') && isEnabledRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          try { recognition.start(); } catch {}
        }, 300);
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('[FRIDAY] Speech error:', e.error);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      clearTimeout(restartTimerRef.current);
      clearTimeout(silenceTimerRef.current);
    };
  }, [processCommand]);

  // ─── Toggle FRIDAY on/off ────────────────────────────────
  const toggleFriday = useCallback(() => {
    if (isEnabledRef.current) {
      // Turn off
      isEnabledRef.current = false;
      setIsEnabled(false);
      updateStatus('OFF');
      setSubtitle('');
      setTranscript('');
      try { recognitionRef.current?.stop(); } catch {}
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      clearTimeout(restartTimerRef.current);
      clearTimeout(silenceTimerRef.current);
    } else {
      // Turn on
      isEnabledRef.current = true;
      setIsEnabled(true);
      updateStatus('STANDBY');
      startRecognition();
    }
  }, [updateStatus, startRecognition]);

  // ─── Push-to-talk: manually activate LISTENING ──────────
  const pushToTalk = useCallback(() => {
    if (statusRef.current === 'PROCESSING' || statusRef.current === 'SPEAKING') return;

    if (!isEnabledRef.current) {
      isEnabledRef.current = true;
      setIsEnabled(true);
    }

    // If currently speaking, stop
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();

    updateStatus('LISTENING');
    setSubtitle('Listening...');
    setTranscript('');
    commandBufferRef.current = '';

    // Ensure recognition is running
    startRecognition();

    // Set silence timeout
    clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (statusRef.current === 'LISTENING') {
        if (commandBufferRef.current) {
          processCommand(commandBufferRef.current);
        } else {
          updateStatus('STANDBY');
          setSubtitle('');
          setTranscript('');
        }
      }
    }, 8000);
  }, [updateStatus, startRecognition, processCommand]);

  return {
    status,
    subtitle,
    transcript,
    isEnabled,
    error,
    toggleFriday,
    pushToTalk,
  };
}
