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