import React, { useRef, useEffect, useState } from 'react';

// DroneFeed Component
// Renders a simulated thermal/FLIR drone camera feed with HUD overlays
// Props:
//   - lat: Latitude coordinate to display (default: 0)
//   - lng: Longitude coordinate to display (default: 0)
//   - region: Operation region name to display (default: "TARGET ZONE")

export default function DroneFeed({ lat = 0, lng = 0, region = "TARGET ZONE" }) {
  // Canvas reference for direct DOM manipulation
  const canvasRef = useRef(null);
  
  // Timestamp state for the live clock display, updates every second
  const [stamp, setStamp] = useState(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let frameId;

    const width = canvas.width;
    const height = canvas.height;

    // Main render function - draws thermal noise and HUD elements
    // Uses FLIR-style "White Hot" thermal color palette
    const drawNoise = () => {
      // Create raw image data buffer for pixel manipulation
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;
      
      // Generate thermal noise pattern pixel by pixel
      for (let i = 0; i < data.length; i += 4) {
        // Base thermal noise - grayscale values between 20 and 180
        let val = 20 + Math.random() * 160;
        
        // Calculate pixel coordinates from linear index
        const x = (i / 4) % width;
        const y = Math.floor((i / 4) / width);
        
        // Calculate distance from center for heat signature effect
        const dist = Math.sqrt(Math.pow(x - width / 2, 2) + Math.pow(y - height / 2, 2));
        
        // Simulate "hot" blob near center (heat signature)
        // Pixels within 40px of center get brightness boost
        if (dist < 40) val += 50 * Math.random();
        
        // Scanline effect - darken every 4th row for CRT/old monitor feel
        if (y % 4 === 0) val -= 20;

        // Set RGBA values
        data[i] = val;         // Red channel
        data[i + 1] = val + 10; // Green channel - slight green tint for night vision aesthetic
        data[i + 2] = val;     // Blue channel
        data[i + 3] = 255;     // Alpha - fully opaque
      }
      
      // Render the pixel data to canvas
      ctx.putImageData(imgData, 0, 0);

      // Draw HUD (Heads-Up Display) Overlays
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)'; // Cyber green color with transparency
      ctx.lineWidth = 1;
      
      // Center Crosshair - horizontal line
      ctx.beginPath();
      ctx.moveTo(width / 2 - 20, height / 2);
      ctx.lineTo(width / 2 + 20, height / 2);
      
      // Center Crosshair - vertical line
      ctx.moveTo(width / 2, height / 2 - 20);
      ctx.lineTo(width / 2, height / 2 + 20);
      ctx.stroke();

      // Animated Target Box - pulsates using sine wave
      const boxSize = 60 + Math.sin(Date.now() / 200) * 2;
      ctx.strokeRect(width / 2 - boxSize / 2, height / 2 - boxSize / 2, boxSize, boxSize);

      // Request next animation frame for continuous rendering
      frameId = requestAnimationFrame(drawNoise);
    };

    // Start the animation loop
    frameId = requestAnimationFrame(drawNoise);

    // Update timestamp every second for the clock display
    const interval = setInterval(() => setStamp(Date.now()), 1000);

    // Cleanup function - cancel animation and interval on unmount
    return () => {
      cancelAnimationFrame(frameId);
      clearInterval(interval);
    };
  }, []); // Empty dependency array - effect runs once on mount

  return (
    // Main container - relative positioning for absolute overlay children
    <div className="relative w-full aspect-video border border-white/10 rounded-sm overflow-hidden bg-black flex flex-col group mt-4">
      
      {/* Canvas element for thermal feed rendering */}
      <canvas 
        ref={canvasRef} 
        width={320} 
        height={180} 
        className="w-full h-full object-cover opacity-80 mix-blend-screen"
      />
      
      {/* HUD Overlays Container - positioned absolutely over canvas */}
      <div className="absolute inset-0 pointer-events-none p-2 flex flex-col justify-between">
        
        {/* Top HUD Section - Aircraft info and recording status */}
        <div className="flex justify-between items-start text-[8px] font-mono font-bold text-[var(--color-green)] shadow-black drop-shadow-md">
          
          {/* Left side - Aircraft designation and operation region */}
          <div className="flex flex-col gap-0.5">
            <span className="bg-black/40 px-1">UAV-FLIR // MQ-9 REAPER</span>
            <span className="bg-black/40 px-1 opacity-70">OP: {region.toUpperCase()}</span>
          </div>
          
          {/* Right side - Recording indicator and altitude */}
          <div className="text-right flex flex-col items-end gap-0.5">
            {/* Pulsing red recording indicator */}
            <span className="bg-[var(--color-red)] text-white px-1 animate-pulse">● REC</span>
            {/* Altitude display with slight random variation for realism */}
            <span className="bg-black/40 px-1 mt-1">ALT: {Math.floor(15000 + Math.random() * 100)} FT</span>
          </div>
        </div>

        {/* Bottom HUD Section - Coordinates and timestamp */}
        <div className="flex justify-between items-end text-[7px] font-mono text-[var(--color-green)] opacity-80">
          
          {/* Left side - GPS coordinates */}
          <div className="bg-black/40 px-1">
            LAT: {lat.toFixed(4)} <br/> 
            LNG: {lng.toFixed(4)}
          </div>
          
          {/* Right side - Zulu (UTC) timestamp in ISO format */}
          <div className="bg-black/40 px-1">
            Z: {new Date(stamp).toISOString()}
          </div>
        </div>

      </div>

      {/* Green gradient overlay for enhanced thermal/night vision aesthetic */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-green)]/10 to-transparent pointer-events-none mix-blend-overlay"></div>
    </div>
  );
}
