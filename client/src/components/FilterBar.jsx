import React from 'react';

// ---------------------------------------------------------------------------
// FILTER DEFINITIONS
// Each entry maps a filter key to its display label, Font Awesome icon class,
// and the CSS-variable colour used for active-state highlighting.
// ---------------------------------------------------------------------------
const FILTERS = [
  { key: 'conflict',   label: 'Conflicts',   icon: 'fa-solid fa-explosion',     color: 'var(--color-red)'    },
  { key: 'protest',    label: 'Protests',    icon: 'fa-solid fa-people-group',  color: 'var(--color-orange)' },
  { key: 'disaster',   label: 'Disasters',   icon: 'fa-solid fa-house-tsunami', color: 'var(--color-yellow)' },
  { key: 'earthquake', label: 'Earthquakes', icon: 'fa-solid fa-mountain',      color: 'var(--color-gold)'   },
  { key: 'wildfire',   label: 'Wildfires',   icon: 'fa-solid fa-fire',          color: 'var(--color-orange)' },
  { key: 'flight',     label: 'Military',    icon: 'fa-solid fa-fighter-jet',   color: 'var(--color-cyan)'   },
];

// ---------------------------------------------------------------------------
// TIME RANGE OPTIONS
// Drives the <select> dropdown; `value` is passed back via onTimeChange.
// ---------------------------------------------------------------------------
const TIME_RANGES = [
  { value: '1h',  label: 'Last 1h'      },
  { value: '6h',  label: 'Last 6h'      },
  { value: '24h', label: 'Last 24h'     },
  { value: '7d',  label: 'Last 7 days'  },
];

// ---------------------------------------------------------------------------
// FilterBar
//
// Props
// ─────
// activeFilters  {object}   Map of filterKey → boolean.
//                           A missing key OR `true` means the filter is ON.
//                           Explicit `false` means the filter is OFF.
// onToggle       {function} Called with (filterKey) when a pill is clicked.
// timeRange      {string}   Currently selected time-range value (default '24h').
// onTimeChange   {function} Called with the new value when the dropdown changes.
// ---------------------------------------------------------------------------
export default function FilterBar({ activeFilters = {}, onToggle, timeRange = '24h', onTimeChange }) {
  return (
    // Outer wrapper: horizontal, wrapping flex row with consistent padding
    <div className="flex items-center gap-2 flex-wrap px-3 py-2">

      {/* ── Filter pill buttons ─────────────────────────────────────────── */}
      {FILTERS.map(f => {
        // A filter is considered active when its key is absent from activeFilters
        // (default-on behaviour) or explicitly set to a truthy value.
        const active = activeFilters[f.key] !== false;

        return (
          <button
            key={f.key}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
            style={{
              // Active: tinted background + coloured border using the filter's accent colour.
              // Inactive: neutral surface + muted border.
              background: active ? `${f.color}20` : 'var(--color-surface)',
              border: `1px solid ${active ? f.color + '50' : 'var(--color-border)'}`,
              color:  active ? f.color : 'var(--color-text-muted)',
              cursor: 'pointer',
              outline: 'none'
            }}
            // Notify parent so it can flip the filter's active state
            onClick={() => onToggle?.(f.key)}
          >
            {/* Font Awesome icon — sized slightly smaller than the label text */}
            <i className={f.icon} style={{ fontSize: 10 }}></i>

            {/* Human-readable filter label */}
            <span style={{ fontWeight: 500 }}>{f.label}</span>
          </button>
        );
      })}

      {/* ── Time-range dropdown ─────────────────────────────────────────── */}
      {/* Placed after the filter pills; ml-2 adds a visual gap between groups */}
      <select
        value={timeRange}
        onChange={(e) => onTimeChange?.(e.target.value)}  // bubble new value up to parent
        className="ml-2 px-3 py-1.5 rounded-full text-xs bg-transparent cursor-pointer outline-none"
        style={{
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)',
          background: 'var(--color-surface)'
        }}
      >
        {TIME_RANGES.map(t => (
          // Each <option> inherits the panel background so the dropdown matches the theme
          <option key={t.value} value={t.value} style={{ background: 'var(--color-panel)' }}>
            {t.label}
          </option>
        ))}
      </select>

    </div>
  );
}