import React, { useEffect, useState } from 'react';

/**
 * TargetingCursor
 *
 * A tactical HUD-style custom cursor overlay that renders a crosshair reticle
 * and live coordinate telemetry only when the user hovers over the
 * `#tactical-map-container` element.
 *
 * Behavior:
 * - Tracks mouse position via `mousemove` on the window (throttled via rAF).
 * - Activates (fades in) only when cursor is over `#tactical-map-container`.
 * - Auto-deactivates (fades out) after 1500ms of mouse inactivity.
 * - Entirely pointer-events-none — never interferes with underlying UI.
 */
export default function TargetingCursor() {
  // Current cursor position in viewport coordinates
  const [pos, setPos] = useState({ x: -100, y: -100 });

  // Whether the reticle overlay is visible
  const [active, setActive] = useState(false);

  useEffect(() => {
    let frameId;           // rAF handle for throttling mousemove updates
    let isMouseActive = false; // Local (non-React) flag to avoid stale closure issues
    let idleTimeout;       // Timeout handle for auto-deactivation on idle

    const handleMouseMove = (e) => {
      // Cancel any pending animation frame to debounce rapid fire events
      if (frameId) cancelAnimationFrame(frameId);

      frameId = requestAnimationFrame(() => {
        // Only activate if the pointer is inside the tactical map container.
        // Uses `.closest()` so it works even on deeply nested children.
        const isHoveringMap = e.target.closest('#tactical-map-container') !== null;

        if (!isHoveringMap) {
          // Cursor has left the map — deactivate the overlay
          if (isMouseActive) {
            isMouseActive = false;
            setActive(false);
          }
          return;
        }

        // Update position state to move the reticle to the current cursor location
        setPos({ x: e.clientX, y: e.clientY });

        // First movement inside the map — activate the overlay
        if (!isMouseActive) {
          isMouseActive = true;
          setActive(true);
        }

        // Reset idle timer on every move; deactivate if mouse stops for 1.5s
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(() => {
          isMouseActive = false;
          setActive(false);
        }, 1500);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Cleanup: remove listener and cancel any pending timers/frames on unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (frameId) cancelAnimationFrame(frameId);
      clearTimeout(idleTimeout);
    };
  }, []); // Empty deps — effect runs once; state is managed via local vars to avoid stale closures

  return (
    /**
     * Root overlay — covers the full viewport but is completely non-interactive.
     * Fades in/out based on `active` state.
     */
    <div
      className="pointer-events-none fixed inset-0 z-[99999] overflow-hidden"
      style={{ opacity: active ? 1 : 0, transition: 'opacity 0.3s ease' }}
    >
      {/* ── Crosshair Reticle ───────────────────────────────────────────────
          Centered on the cursor via negative translate. Contains four line
          segments (left / right / top / bottom) and a pulsing center dot.
      ──────────────────────────────────────────────────────────────────── */}
      <div
        className="absolute w-12 h-12 flex justify-center items-center pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
        style={{ left: pos.x, top: pos.y }}
      >
        {/* Left horizontal arm */}
        <div className="absolute w-[18px] h-[1px] bg-[var(--color-cyan)] shadow-[0_0_5px_var(--color-cyan)] left-0"></div>
        {/* Right horizontal arm */}
        <div className="absolute w-[18px] h-[1px] bg-[var(--color-cyan)] shadow-[0_0_5px_var(--color-cyan)] right-0"></div>
        {/* Top vertical arm */}
        <div className="absolute h-[18px] w-[1px] bg-[var(--color-cyan)] shadow-[0_0_5px_var(--color-cyan)] top-0"></div>
        {/* Bottom vertical arm */}
        <div className="absolute h-[18px] w-[1px] bg-[var(--color-cyan)] shadow-[0_0_5px_var(--color-cyan)] bottom-0"></div>

        {/* Center acquisition dot — pulses to indicate active lock */}
        <div className="absolute w-1 h-1 bg-white border border-[var(--color-cyan)] rounded-full animate-pulse shadow-[0_0_5px_white]"></div>
      </div>

      {/* ── Telemetry Readout ────────────────────────────────────────────────
          Displays live X/Y viewport coordinates and a "TARGET LOCK" label.
          Offset 18px right and 18px down from the cursor so it never
          overlaps the reticle center.
      ──────────────────────────────────────────────────────────────────── */}
      <div
        className="absolute pointer-events-none font-mono text-[7px] text-[var(--color-cyan)] mix-blend-screen whitespace-nowrap"
        style={{ left: pos.x + 18, top: pos.y + 18 }}
      >
        X: {pos.x.toFixed(1)} <br/>
        Y: {pos.y.toFixed(1)} <br/>
        TRGT LOCK
      </div>
    </div>
  );
}