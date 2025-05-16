import React, { useState, useEffect } from 'react';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*X_';

/**
 * ScrambleText takes a target string and gradually unscrambles it from
 * random hacker characters down to the actual text over a specified duration.
 */
export default function ScrambleText({ text, duration = 1500, className = '' }) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (!text) return;
    
    let frameId;
    let startTimestamp;
    const finalLength = text.length;
    
    // Generates a random string of same length
    const getRandomString = (len) => {
      let str = '';
      for (let i = 0; i < len; i++) {
        if (text[i] === ' ') str += ' ';
        else str += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
      }
      return str;
    };
    const animate = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = timestamp - startTimestamp;
      const progressRatio = Math.min(progress / duration, 1);
      
      // Calculate how many characters are "solved"
      const solvedCount = Math.floor(finalLength * progressRatio);
      
      if (solvedCount === finalLength) {
        setDisplayText(text);
        return;
      }
      
      const solvedPart = text.substring(0, solvedCount);
      const remainingLength = finalLength - solvedCount;
      const scrambledPart = getRandomString(remainingLength);
      
      setDisplayText(solvedPart + scrambledPart);
      
      frameId = requestAnimationFrame(animate);
    };

    // Give it a tiny delay to ensure mount is complete before scramble starts
    const timeoutId = setTimeout(() => {
      frameId = requestAnimationFrame(animate);
    }, 100);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [text, duration]);

  return <span className={className}>{displayText || '...'}</span>;
}
