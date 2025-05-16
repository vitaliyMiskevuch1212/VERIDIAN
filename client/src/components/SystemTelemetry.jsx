import React, { useState, useEffect } from 'react';

/**
 * SystemTelemetry
 * ---------------
 * A non-interactive HUD strip composited over the globe that simulates
 * live system telemetry: network uplink rate, RAM/CPU load bars, and
 * a 4-node satellite relay status indicator.
 *
 * All values are randomly fluctuated every 800ms via setInterval.
 *
 * Props:
 *   panelsVisible {boolean} – Controls whether the HUD renders (default: true)
 */
export default function SystemTelemetry({ panelsVisible = true }) {
  // Network uplink data rate in TB/s — fluctuates between 400 and 1200
  const [dataRate, setDataRate] = useState(0);

  // RAM usage percentage — base 32, fluctuates up to 44
  const [ram, setRam] = useState(32);

  // CPU load percentage — base 14, fluctuates up to 44
  const [cpu, setCpu] = useState(14);

  // Satellite relay link statuses — true = UP (cyan), false = DOWN (red)
  // Initialised with one link already degraded to add visual variety on load
  const [satellites, setSatellites] = useState([true, true, false, true]);

  // ── Live Telemetry Simulation ─────────────────────────────────────────────
  // All four metrics are updated on a single 800ms interval to keep ticks
  // synchronised and avoid multiple competing timers.
  useEffect(() => {
    const interval = setInterval(() => {
      // Random integer between 400 and 1200 TB/s
      setDataRate(Math.floor(400 + Math.random() * 800));

      // Float — bar width is used directly as a CSS percentage
      setRam(32 + Math.random() * 12);
      setCpu(14 + Math.random() * 30);

      // Satellite link drop simulation — fires on ~5% of ticks (random > 0.95)
      // to keep disruptions rare and feel realistic
      if (Math.random() > 0.95) {
        setSatellites(prev => {
          const next = [...prev];
          // Pick a random relay index and toggle its status
          const idx = Math.floor(Math.random() * 4);
          next[idx] = !next[idx];
          return next; // Functional update avoids stale closure on `prev`
        });
      }
    }, 800);

    // Clear interval on unmount to prevent setState on an unmounted component
    return () => clearInterval(interval);
  }, []); // Empty deps — interval is set once for the component's lifetime

  return (
    // HUD container — pinned to bottom-center, never intercepts pointer events
    // mix-blend-screen composites cleanly over the dark globe without a hard background box
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-40 font-mono text-[6px] tracking-widest uppercase flex gap-2 opacity-80 mix-blend-screen text-[var(--color-cyan)] transition-all duration-500">

      {/* ── Network Ticker ── */}
      {/* Displays the current simulated uplink rate in TB/s */}
      <div className="bg-black/80 border border-[var(--color-cyan)]/30 p-1 flex justify-between items-center shadow-[0_0_10px_rgba(0,212,255,0.1)] w-full">
        <span className="text-white/50">UPLINK</span>
        <span className="font-bold text-white">{dataRate} TB/S</span>
      </div>

      {/* ── Hardware Bars ── */}
      {/* RAM and CPU each rendered as a thin progress bar.
          Width is driven directly by the simulated percentage values.
          300ms CSS transition smooths the rapid 800ms state updates. */}
      <div className="bg-black/80 border border-[var(--color-cyan)]/30 p-1 flex flex-col justify-center gap-1 shadow-[0_0_10px_rgba(0,212,255,0.1)] w-full">

        {/* RAM bar — cyan fill */}
        <div className="flex justify-between items-center">
          <span className="text-white/50 w-4">RAM</span>
          <div className="flex-1 h-0.5 bg-white/10 mx-1 overflow-hidden">
            <div className="h-full bg-[var(--color-cyan)] transition-all duration-300" style={{ width: `${ram}%` }}></div>
          </div>
        </div>

        {/* CPU bar — purple fill to visually distinguish from RAM */}
        <div className="flex justify-between items-center">
          <span className="text-white/50 w-4">CPU</span>
          <div className="flex-1 h-0.5 bg-white/10 mx-1 overflow-hidden">
            <div className="h-full bg-[var(--color-purple)] transition-all duration-300" style={{ width: `${cpu}%` }}></div>
          </div>
        </div>
      </div>

      {/* ── Satellite Relay Nodes ── */}
      {/* Four relay indicators rendered from the satellites boolean array.
          Cyan = link UP, red = link DOWN. Adding a 5th relay only requires
          extending the state array — no JSX changes needed. */}
      <div className="bg-black/80 border border-[var(--color-cyan)]/30 p-1 shadow-[0_0_10px_rgba(0,212,255,0.1)] w-full flex items-center gap-1">
        <div className="text-white/50">RELAYS</div>
        <div className="flex gap-0.5 flex-1 h-full items-center">
          {satellites.map((isUp, i) => (
            // 200ms transition gives a quick but visible flicker on link state change
            <div
              key={i}
              className={`flex-1 h-1 border transition-colors duration-200 ${
                isUp
                  ? 'bg-[var(--color-cyan)]/20 border-[var(--color-cyan)]'   // Link UP
                  : 'bg-[var(--color-red)]/20  border-[var(--color-red)]'    // Link DOWN
              }`}
            ></div>
          ))}
        </div>
      </div>

    </div>
  );
}