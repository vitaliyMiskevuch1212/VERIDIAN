import React, { useState, useEffect } from 'react';

export default function SystemTelemetry({ panelsVisible = true }) {
  const [dataRate, setDataRate] = useState(0);
  const [ram, setRam] = useState(32);
  const [cpu, setCpu] = useState(14);
  const [satellites, setSatellites] = useState([true, true, false, true]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDataRate(Math.floor(400 + Math.random() * 800)); // 400 - 1200 TB/s
      setRam(32 + Math.random() * 12); // Fluctuate RAM
      setCpu(14 + Math.random() * 30); // Fluctuate CPU
      
      // Randomly drop a satellite link very rarely
      if (Math.random() > 0.95) {
        setSatellites(prev => {
          const next = [...prev];
          const idx = Math.floor(Math.random() * 4);
          next[idx] = !next[idx];
          return next;
        });
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);