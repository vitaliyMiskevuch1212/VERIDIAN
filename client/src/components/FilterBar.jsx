import React from 'react';

const FILTERS = [
  { key: 'conflict',   label: 'Conflicts',   icon: 'fa-solid fa-explosion',     color: 'var(--color-red)'    },
  { key: 'protest',    label: 'Protests',    icon: 'fa-solid fa-people-group',  color: 'var(--color-orange)' },
  { key: 'disaster',   label: 'Disasters',   icon: 'fa-solid fa-house-tsunami', color: 'var(--color-yellow)' },
  { key: 'earthquake', label: 'Earthquakes', icon: 'fa-solid fa-mountain',      color: 'var(--color-gold)'   },
  { key: 'wildfire',   label: 'Wildfires',   icon: 'fa-solid fa-fire',          color: 'var(--color-orange)' },
  { key: 'flight',     label: 'Military',    icon: 'fa-solid fa-fighter-jet',   color: 'var(--color-cyan)'   },
];

const TIME_RANGES = [
  { value: '1h',  label: 'Last 1h'      },
  { value: '6h',  label: 'Last 6h'      },
  { value: '24h', label: 'Last 24h'     },
  { value: '7d',  label: 'Last 7 days'  },
];

export default function FilterBar({ activeFilters = {}, onToggle, timeRange = '24h', onTimeChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap px-3 py-2">

      {/* Filter pill buttons */}
      {FILTERS.map(f => {
        const active = activeFilters[f.key] !== false;

        return (
          <button
            key={f.key}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-md text-[11px] transition-all btn-press ${
              active ? 'ring-1 ring-inset' : ''
            }`}
            style={{
              background: active ? `${f.color}18` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active ? f.color + '40' : 'rgba(255,255,255,0.06)'}`,
              color:  active ? f.color : 'var(--color-text-muted)',
              cursor: 'pointer',
              outline: 'none',
              ...(active ? { '--tw-ring-color': `${f.color}30` } : {}),
            }}
            onClick={() => onToggle?.(f.key)}
          >
            <i className={f.icon} style={{ fontSize: 10 }}></i>
            <span style={{ fontWeight: 500 }}>{f.label}</span>
          </button>
        );
      })}

      {/* Time-range dropdown */}
      <select
        value={timeRange}
        onChange={(e) => onTimeChange?.(e.target.value)}
        className="ml-2 h-8 px-3 rounded-md text-[11px] cursor-pointer outline-none transition-all hover:border-white/15"
        style={{
          border: '1px solid rgba(255,255,255,0.06)',
          color: 'var(--color-text-secondary)',
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        {TIME_RANGES.map(t => (
          <option key={t.value} value={t.value} style={{ background: 'var(--color-panel)' }}>
            {t.label}
          </option>
        ))}
      </select>

    </div>
  );
}