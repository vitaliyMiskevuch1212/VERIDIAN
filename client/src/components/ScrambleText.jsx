import React, { useState, useEffect } from 'react';

// Character pool used to generate the random "hacker noise" during scramble
const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*X_';

/**
 * ScrambleText
 * ------------
 * Takes a target string and gradually unscrambles it from random hacker
 * characters down to the actual text over a specified duration.
 * Uses requestAnimationFrame for smooth, frame-accurate animation.
 *
 * Props:
 *   text      {string} – The final string to reveal
 *   duration  {number} – Animation duration in ms (default: 1500)
 *   className {string} – Optional CSS classes applied to the wrapper <span>
 */
export default function ScrambleText({ text, duration = 1500, className = '' }) {
  // Holds the currently displayed string — starts empty, ends as `text`
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    // Nothing to animate — bail early and leave displayText untouched
    if (!text) return;

    let frameId;          // rAF handle — stored so we can cancel on cleanup
    let startTimestamp;   // Set on the very first frame to anchor elapsed time
    const finalLength = text.length;

    /**
     * getRandomString
     * Generates a random noise string of length `len`, preserving any spaces
     * from the original `text` so word boundaries remain visible during scramble.
     */
    const getRandomString = (len) => {
      let str = '';
      for (let i = 0; i < len; i++) {
        // Keep spaces in-place so the text shape is legible while scrambling
        if (text[i] === ' ') str += ' ';
        else str += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
      }
      return str;
    };

    /**
     * animate
     * Core rAF callback. Called once per frame until all characters are resolved.
     *
     * Strategy: characters are "solved" left-to-right as progressRatio increases.
     *   displayText = text[0..solvedCount] + randomChars[0..remaining]
     *
     * When solvedCount reaches finalLength the exact target string is set
     * and no further frame is scheduled.
     */
    const animate = (timestamp) => {
      // Capture the start time on the first frame
      if (!startTimestamp) startTimestamp = timestamp;

      const progress = timestamp - startTimestamp;

      // Clamp ratio to [0, 1] so we never overshoot
      const progressRatio = Math.min(progress / duration, 1);

      // Number of characters that have "decoded" to their final value
      const solvedCount = Math.floor(finalLength * progressRatio);

      // All characters resolved — set the clean final string and stop the loop
      if (solvedCount === finalLength) {
        setDisplayText(text);
        return; // No further requestAnimationFrame call
      }

      // Build the display string: solved prefix + scrambled suffix
      const solvedPart = text.substring(0, solvedCount);
      const remainingLength = finalLength - solvedCount;
      const scrambledPart = getRandomString(remainingLength);

      setDisplayText(solvedPart + scrambledPart);

      // Schedule the next frame
      frameId = requestAnimationFrame(animate);
    };

    // 100ms mount delay before kicking off the first frame.
    // Prevents a single-frame empty flash while the component paints.
    const timeoutId = setTimeout(() => {
      frameId = requestAnimationFrame(animate);
    }, 100);

    // Cleanup: cancel both the pending timeout and any in-flight rAF
    // to prevent setState calls on an unmounted component.
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [text, duration]); // Re-run the whole animation if text or duration changes

  // Fall back to '...' during the 100ms pre-scramble window
  return <span className={className}>{displayText || '...'}</span>;
}