import React, { useRef, useEffect, useState } from 'react';

export default function DroneFeed({ lat = 0, lng = 0, region = "TARGET ZONE" }) {
  const canvasRef = useRef(null);
  const [stamp, setStamp] = useState(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frameId;

    const width = canvas.width;
    const height = canvas.height;

    // FLIR color palette (Thermal White Hot)
    const drawNoise = () => {
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Base thermal noise (grayscales from 20 to 180)
        let val = 20 + Math.random() * 160;

        
        // Simulating "heat signatures" via simple math interference
        const x = (i / 4) % width;
        const y = Math.floor((i / 4) / width);
        const dist = Math.sqrt(Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2));
        
        // Add a "hot" blob near center shifting slightly
        if (dist < 40) val += 50 * Math.random();
        
        // Scanline effect
        if (y % 4 === 0) val -= 20;

        data[i] = val;     // R
        data[i + 1] = val + 10; // G (Slightly greenish tint for night vision feel)
        data[i + 2] = val; // B
        data[i + 3] = 255;   // Alpha
      }
      ctx.putImageData(imgData, 0, 0);

      // Draw HUD Overlays
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)'; // Cyber Green
      ctx.lineWidth = 1;
      
      // Center Crosshair
      ctx.beginPath();
      ctx.moveTo(width / 2 - 20, height / 2);
      ctx.lineTo(width / 2 + 20, height / 2);
      ctx.moveTo(width / 2, height / 2 - 20);
      ctx.lineTo(width / 2, height / 2 + 20);
      ctx.stroke();

      // Target Box
      const boxSize = 60 + Math.sin(Date.now() / 200) * 2;
      ctx.strokeRect(width / 2 - boxSize / 2, height / 2 - boxSize / 2, boxSize, boxSize);

      frameId = requestAnimationFrame(drawNoise);
    };

    frameId = requestAnimationFrame(drawNoise);

    // Update timestamp every second
    const interval = setInterval(() => setStamp(Date.now()), 1000);

    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(interval);
    };
  }, []);