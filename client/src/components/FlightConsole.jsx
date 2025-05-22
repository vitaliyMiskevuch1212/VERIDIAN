/**
 * FlightConsole.jsx
 *
 * A collapsible HUD panel fixed to the bottom-centre of the globe view.
 * Displays the total count of tracked military aircraft and allows the user
 * to filter the globe markers by aircraft category (ISR/AWACS, Transport,
 * Helicopter, Tanker, or Unknown).
 *
 * Data flow:
 *  - `flights`          — raw flight records streamed from the OpenSky Network
 *  - `activeCategory`   — currently selected filter, owned by the parent
 *  - `onCategoryChange` — lifts the new category id up to the parent so the
 *                         globe layer can apply the corresponding marker filter
 *
 * Category classification is done client-side via `mapToCategory`, which
 * inspects the free-text `aircraftType` field returned by OpenSky.
 *
 * @module FlightConsole
 */
 
import React, { useMemo, useState } from 'react';
 
// ---------------------------------------------------------------------------
// Static configuration
// ---------------------------------------------------------------------------
 
/**
 * Ordered list of filter categories shown as pill buttons.
 *
 * Each entry defines:
 *  - `id`    — the string key used in `activeCategory` state and `categoryCounts`
 *  - `label` — human-readable button text
 *  - `icon`  — Font Awesome class applied to the button icon
 *  - `color` — accent colour applied to the icon and count when the pill is active
 *
 * The 'all' category is always first and always has count === flights.length.
 * All other ids must match the string values returned by `mapToCategory`.
 */
const CATEGORIES = [
  { id: 'all',       label: 'All Tracked', icon: 'fa-plane',      color: 'var(--color-cyan)' },
  { id: 'unknown',   label: 'Unknown',     icon: 'fa-question',   color: '#888'              },
  { id: 'isr',       label: 'ISR/AWACS',   icon: 'fa-satellite',  color: '#a78bfa'           },
  { id: 'transport', label: 'Transport',   icon: 'fa-truck-plane', color: '#60a5fa'           },
  { id: 'heli',      label: 'Helicopter',  icon: 'fa-helicopter', color: '#34d399'           },
  { id: 'tanker',    label: 'Tanker',      icon: 'fa-gas-pump',   color: '#fbbf24'           },
];
 
// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
 
/**
 * Classifies a flight into one of the CATEGORIES ids based on its free-text
 * `aircraftType` string returned by the OpenSky Network API.
 *
 * Classification uses simple substring matching on a lowercased copy of the
 * type string. The order of checks matters — more specific terms (uav, recon)
 * are evaluated before broader ones (high, fighter) that share the 'isr' bucket.
 *
 * Mapping logic:
 *  'uav' | 'recon' | 'awacs' | 'strategic' → 'isr'
 *  'heavy' | 'large' | 'transport'          → 'transport'
 *  'rotor' | 'heli'                         → 'heli'
 *  'tanker' | 'refuel'                      → 'tanker'
 *  'high' | 'fighter' | 'maneuv'            → 'isr'  (high-performance / manoeuvrable)
 *  anything else                             → 'unknown'
 *
 * @param {string} [aircraftType=''] - Raw type string from the OpenSky flight record
 * @returns {'isr'|'transport'|'heli'|'tanker'|'unknown'} A CATEGORIES id (never 'all')
 */
function mapToCategory(aircraftType = '') {
  const t = aircraftType.toLowerCase();
 
  if (t.includes('uav') || t.includes('recon') || t.includes('awacs') || t.includes('strategic')) return 'isr';
  if (t.includes('heavy') || t.includes('large') || t.includes('transport'))                       return 'transport';
  if (t.includes('rotor') || t.includes('heli'))                                                   return 'heli';
  if (t.includes('tanker') || t.includes('refuel'))                                                return 'tanker';
  if (t.includes('high') || t.includes('fighter') || t.includes('maneuv'))                        return 'isr';
 
  return 'unknown';
}
 
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
 
/**
 * FlightConsole
 *
 * Renders the bottom-centre HUD panel. Controlled externally for the active
 * category filter; owns only the collapsed/expanded toggle internally.
 *
 * @param {Object}   props
 * @param {Array}    [props.flights=[]]         - Array of flight objects from OpenSky.
 *                                               Each object is expected to have an
 *                                               `aircraftType` string property.
 * @param {string}   props.activeCategory       - Currently active category id.
 *                                               One of the `id` values in CATEGORIES.
 * @param {Function} props.onCategoryChange     - Callback invoked with the new category id
 *                                               when the user clicks a pill button.
 */
export default function FlightConsole({ flights = [], activeCategory, onCategoryChange }) {
  /**
   * Controls whether the category pill row is visible.
   * Starts expanded so the filter options are immediately accessible.
   * The entire header row is clickable to toggle this state.
   */
  const [isExpanded, setIsExpanded] = useState(true);
 
  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------
 
  /**
   * Per-category flight counts, recomputed only when `flights` changes.
   *
   * Initialised with `all: flights.length` (no classification needed for the
   * total) and zeroes for every specific category. A single pass over `flights`
   * then increments each category bucket.
   *
   * The result object shape mirrors the CATEGORIES `id` values so pill buttons
   * can look up their count with `categoryCounts[cat.id]`.
   */
  const categoryCounts = useMemo(() => {
    const counts = { all: flights.length, unknown: 0, isr: 0, transport: 0, heli: 0, tanker: 0 };
 
    flights.forEach(f => {
      const cat = mapToCategory(f.aircraftType);
      counts[cat] = (counts[cat] || 0) + 1;
    });
 
    return counts;
  }, [flights]);
 
  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
 
  return (
    /*
     * Outer wrapper: absolutely positioned, centred horizontally at the bottom
     * of the map container. `pointer-events-auto` re-enables interaction inside
     * the panel — necessary because a parent layer likely disables pointer
     * events globally for the overlay.
     */
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      <div
        className="backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden transition-all duration-300 panel-glow bg-gradient-to-b from-[#060B14]/80 to-[#0A0F1E]/90"
        style={{
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          // Panel width collapses when the user hides the pill row to save space
          minWidth: isExpanded ? 560 : 200,
        }}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Header row — always visible; click anywhere to collapse/expand   */}
        {/* ---------------------------------------------------------------- */}
        <div
          className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Left side: panel icon, title, and live flight count */}
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-jet-fighter text-[var(--color-cyan)] text-xs"></i>
            <span className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em]">Military Aircraft</span>
            {/* Total count badge — updates reactively as new flights arrive */}
            <span className="text-[var(--color-cyan)] font-mono text-xs font-bold">{flights.length}</span>
          </div>
 
          {/* Right side: data source attribution and collapse chevron */}
          <div className="flex items-center gap-3">
            <span className="text-white/30 text-[8px] font-mono uppercase">OpenSky Network</span>
            {/* Chevron direction inverts to signal the panel's current state */}
            <i className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'up'} text-white/30 text-[10px] transition-transform`}></i>
          </div>
        </div>
 
        {/* ---------------------------------------------------------------- */}
        {/* Category filter pills — hidden when collapsed                    */}
        {/* ---------------------------------------------------------------- */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-1 flex items-center gap-2 border-t border-white/5">
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
 
              return (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all border ${
                    isActive
                      ? 'border-white/20 bg-white/10 text-white'           // active: highlighted
                      : 'border-white/5 bg-white/[0.02] text-white/40 hover:text-white/70 hover:bg-white/5' // inactive: muted
                  }`}
                >
                  {/*
                   * Icon colour is only applied when the pill is active.
                   * Inactive pills use the inherited muted text colour so
                   * the active pill stands out clearly.
                   */}
                  <i
                    className={`fa-solid ${cat.icon}`}
                    style={{ color: isActive ? cat.color : undefined, fontSize: 9 }}
                  ></i>
 
                  <span>{cat.label}</span>
 
                  {/* Per-category count — uses the accent colour when active */}
                  <span
                    className="font-mono"
                    style={{ color: isActive ? cat.color : 'inherit' }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
 
// Named export so sibling modules (e.g. the globe marker layer) can classify
// individual flights without importing the full component.
export { mapToCategory };