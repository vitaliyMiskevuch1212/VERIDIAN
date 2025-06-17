import React, { useState, useEffect, useRef } from 'react';

const MESSAGES = [
  "INITIALIZING SECURE HANDSHAKE...",
  "ESTABLISHING UPLINK WITH GLOBAL SENSOR GRID...",
  "DECRYPTING SIGNAL STREAMS [AES-256]...",
  "INGESTING FLIGHT TELEMETRY [4,192 NODES]...",
  "CROSS-REFERENCING OSINT DATABASES...",
  "RUNNING NEURAL SENTIMENT MODEL...",
  "ANALYZING GEO-POLITICAL RISK VECTORS...",
  "EXTRACTING TRADING SIGNALS FROM NOISE...",
  "CORRELATING EVENT CLUSTERS...",
  "GENERATING EXECUTIVE SITREP...",
];

const HEX_CHARS = "0123456789ABCDEF";

function getRandomHex(length = 8) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += HEX_CHARS.charAt(Math.floor(Math.random() * HEX_CHARS.length));
  }
  return result;
}

export default function TerminalLoader({ context = "GLOBAL INTELLIGENCE" }) {
  const [logs, setLogs] = useState([]);
  const [scanlinePos, setScanlinePos] = useState(0);
  const scrollRef = useRef(null);

  // Generate logs
  useEffect(() => {
    let messageIndex = 0;
    
    // Add initial boot log
    setLogs([{ text: `INIT VERIDIAN_AI_CORE // ${context}`, timestamp: new Date().toISOString(), type: 'system' }]);

    const logInterval = setInterval(() => {
      setLogs(prev => {
        const newLogs = [...prev];
        
        // Add a random hash line occasionally to look "hacky"
        if (Math.random() > 0.7) {
          newLogs.push({
            text: `[SYS.${getRandomHex(4)}] ADDR 0x${getRandomHex(6)} -> 0x${getRandomHex(6)} : OK`,
            timestamp: new Date().toISOString(),
            type: 'data'
          });
        }

        // Add the main message
        if (messageIndex < MESSAGES.length) {
          newLogs.push({
            text: `> ${MESSAGES[messageIndex]}`,
            timestamp: new Date().toISOString(),
            type: 'process'
          });
          messageIndex++;
        } else {
          // Loop or shuffle messages
          messageIndex = Math.floor(Math.random() * MESSAGES.length);
        }

        // Keep only last 20 logs so it doesn't get huge
        if (newLogs.length > 20) newLogs.shift();
        
        return newLogs;
      });
    }, 600 + Math.random() * 800); // Random delay between 600ms-1400ms

    return () => clearInterval(logInterval);
  }, [context]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Scanline animation
  useEffect(() => {
    const scanlineInterval = setInterval(() => {
      setScanlinePos(prev => (prev >= 100 ? 0 : prev + 2));
    }, 50);
    return () => clearInterval(scanlineInterval);
  }, []);

  return (
    <div className="flex-1 w-full h-full p-4 font-mono text-[10px] bg-[#0A0F1E] relative overflow-hidden flex flex-col pt-12">
      {/* Decorative Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center pb-2 border-b border-white/10 text-white/40 uppercase tracking-widest text-[8px]">
        <div>{context} // PROCESSING</div>
        <div className="animate-pulse flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[var(--color-cyan)] rounded-full"></span>
          UPLINK ACTIVE
        </div>
      </div>

      {/* Logs Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1 mt-4 scroll-smooth custom-scrollbar opacity-80" style={{ paddingBottom: '30px' }}>
        {logs.map((log, i) => (
          <div key={i} className={`flex items-start gap-3 w-full animate-fade-in fade-in-up ${log.type === 'system' ? 'text-[var(--color-cyan)] font-bold' : log.type === 'process' ? 'text-white/80' : 'text-white/30'}`}>
            <span className="opacity-40 flex-shrink-0 text-[8px] mt-0.5">
              {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}.{new Date(log.timestamp).getMilliseconds().toString().padStart(3, '0')}
            </span>
            <span className="break-all">{log.text}</span>
          </div>
        ))}
        {/* Blinking Cursor */}
        <div className="flex items-start gap-3 w-full text-[var(--color-cyan)]">
           <span className="opacity-0 w-[55px]">--:--:--</span>
           <span className="animate-ping bg-[var(--color-cyan)] w-2 h-3 inline-block"></span>
        </div>
      </div>

      {/* CSS Scanline Effect */}
      <div 
        className="absolute left-0 right-0 h-8 pointer-events-none opacity-20"
        style={{
          top: `${scanlinePos}%`,
          background: 'linear-gradient(to bottom, transparent, var(--color-cyan), transparent)',
          transform: 'translateY(-50%)'
        }}
      />
    </div>
  );
}