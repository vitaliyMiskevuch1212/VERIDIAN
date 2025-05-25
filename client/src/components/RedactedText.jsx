import React, { useState, useEffect } from 'react';

// Common stop words to avoid redacting
const STOP_WORDS = new Set(['The', 'A', 'An', 'In', 'On', 'At', 'To', 'For', 'Of', 'And', 'Or', 'But', 'If', 'Is', 'Are', 'Was', 'Were', 'Be', 'Been', 'It', 'That', 'This']);

/**
 * Automatically parses text to find named entities (Capitalized words, Acronyms, Numbers)
 * and wraps them in an interactive Redaction block.
 */
export default function RedactedText({ text = '', frequency = 0.5 }) {
  const [elements, setElements] = useState([]);

  useEffect(() => {
    if (!text) return;
    
    // Split text by word boundaries but keep spaces/punctuation intact
    const parts = text.split(/([ \t\n\r.,;!?]+)/);
    
    // Deterministic random generator based on word so it doesn't flicker on re-renders
    const hashStr = (s) => s.split('').reduce((a,b) => ((a << 5) - a) + b.charCodeAt(0), 0);
    
    const parsed = parts.map((part, index) => {
      // Is it a candidate for redaction? (Capitalized word, All caps acronym, or number sequence)
      const isCandidate = /^[A-Z][a-z0-9]+$/.test(part) || /^[A-Z0-9]{2,}$/.test(part) || /^[0-9]+[MK%]?$/.test(part);
      
      if (isCandidate && !STOP_WORDS.has(part)) {
        // pseudo-random decision based on the word itself
        const randomVal = Math.abs(hashStr(part + index)) % 100 / 100;
        if (randomVal < frequency) {
          return (
            <span 
              key={index} 
              className="group relative inline-block mx-[1px] cursor-crosshair align-baseline transition-all duration-200"
              title="TOP SECRET // CLICK OR HOVER TO DECLASSIFY"
            >
              {/* The underlying secret text */}
              <span className="text-[var(--color-green)] font-mono font-bold tracking-widest relative z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {part}
              </span>
              
              {/* The black redaction bar */}
              <span className="absolute inset-0 bg-black/90 border border-black group-hover:bg-transparent group-hover:border-[var(--color-green)]/30 group-hover:scale-[1.1] z-10 transition-all duration-300 pointer-events-none rounded-[1px]"></span>
              
              {/* Top Secret label that appears on hover */}
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[5px] text-[var(--color-red)] font-mono font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity delay-200 z-20">
                DECLASSIFIED
              </span>
            </span>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
    
    setElements(parsed);
  }, [text, frequency]);

  return <span className="relative z-0 leading-relaxed max-w-full inline">{elements}</span>;
}
