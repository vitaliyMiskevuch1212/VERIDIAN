import React from 'react';

function getBarColor(score) {
  if (score >= 70) return 'var(--color-green)';
  if (score >= 50) return 'var(--color-yellow)';
  if (score >= 30) return 'var(--color-orange)';
  return 'var(--color-red)';
}

const TREND_COLORS = {
  IMPROVING: 'var(--color-green)',
  STABLE: 'var(--color-cyan)',
  DETERIORATING: 'var(--color-orange)',
  CRITICAL: 'var(--color-red)',
};

const TREND_ICONS = {
  IMPROVING: 'fa-solid fa-arrow-trend-down',
  STABLE: 'fa-solid fa-minus',
  DETERIORATING: 'fa-solid fa-arrow-trend-up',
  CRITICAL: 'fa-solid fa-triangle-exclamation',
};

const SEVERITY_COLORS = {
  CRITICAL: 'var(--color-red)',
  HIGH: 'var(--color-orange)',
  MEDIUM: 'var(--color-yellow)',
  LOW: 'var(--color-green)',
};

// Static fallback regions (used when AI regions haven't loaded yet)
const FALLBACK_REGIONS = [
  { name: 'Middle East', icon: 'fa-solid fa-mosque', stability: 32, trend: 'DETERIORATING', topThreat: 'Loading...', aiSummary: '', keywords: ['conflict', 'military', 'sanctions'], criticalEvents: 0, totalEvents: 0 },
  { name: 'Europe', icon: 'fa-solid fa-landmark', stability: 58, trend: 'STABLE', topThreat: 'Loading...', aiSummary: '', keywords: ['NATO', 'energy', 'defense'], criticalEvents: 0, totalEvents: 0 },
  { name: 'Asia-Pacific', icon: 'fa-solid fa-torii-gate', stability: 51, trend: 'DETERIORATING', topThreat: 'Loading...', aiSummary: '', keywords: ['trade', 'maritime', 'nuclear'], criticalEvents: 0, totalEvents: 0 },
  { name: 'Americas', icon: 'fa-solid fa-building-columns', stability: 67, trend: 'STABLE', topThreat: 'Loading...', aiSummary: '', keywords: ['economy', 'elections', 'migration'], criticalEvents: 0, totalEvents: 0 },
  { name: 'Africa', icon: 'fa-solid fa-globe-africa', stability: 40, trend: 'DETERIORATING', topThreat: 'Loading...', aiSummary: '', keywords: ['security', 'resources', 'governance'], criticalEvents: 0, totalEvents: 0 },
];

export default function RegionPanel({ events = [], onRegionClick, aiRegions = [] }) {
  // Use AI-computed regions if available, otherwise fallback
  const regions = aiRegions.length > 0 ? aiRegions : FALLBACK_REGIONS;

  return (
    <div className="grid grid-cols-2 gap-3">
      {regions.map(region => {
        // If using fallback, count events manually for this region
        const regionEvents = aiRegions.length > 0
          ? [] // AI regions already have event data
          : events.filter(e => {
              const countries = region.countries || [];
              return countries.some(c => e.country?.toLowerCase().includes(c.toLowerCase()));
            });

        const eventCount = region.totalEvents || regionEvents.length;
        const trendColor = TREND_COLORS[region.trend] || TREND_COLORS.STABLE;
        const trendIcon = TREND_ICONS[region.trend] || TREND_ICONS.STABLE;
        const topEvents = region.topEvents || regionEvents.slice(0, 3);

        return (
          <button
            key={region.name}
            className="panel p-3 text-left transition-all hover:border-cyan/30 cursor-pointer group"
            onClick={() => onRegionClick?.(region.name)}
            style={{ outline: 'none', borderColor: 'var(--color-border)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <i className={region.icon} style={{ fontSize: 12, color: 'var(--color-cyan)', opacity: 0.7 }}></i>
                <span style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 12, color: 'var(--color-text-primary)' }}>
                  {region.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono-num text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {eventCount}
                </span>
                <i className={trendIcon} style={{ fontSize: 9, color: trendColor }}></i>
              </div>
            </div>

            {/* Stability bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-muted" style={{ fontSize: 9 }}>Stability</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono-num" style={{ fontSize: 10, color: getBarColor(region.stability) }}>
                    {region.stability}%
                  </span>
                  {region.trend && (
                    <span className="text-[7px] font-bold px-1 py-0.5 rounded-[2px]"
                      style={{ color: trendColor, background: `${trendColor}15`, border: `1px solid ${trendColor}30` }}>
                      {region.trend}
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full rounded-full" style={{ height: 4, background: 'var(--color-surface)' }}>
                <div
                  className="rounded-full transition-all duration-700"
                  style={{
                    width: `${region.stability}%`,
                    height: '100%',
                    background: getBarColor(region.stability),
                    boxShadow: `0 0 6px ${getBarColor(region.stability)}40`
                  }}
                />
              </div>
            </div>

            {/* Top Threat */}
            {region.topThreat && region.topThreat !== 'Loading...' && (
              <div className="mb-2 flex items-start gap-1.5">
                <i className="fa-solid fa-triangle-exclamation text-[var(--color-red)] mt-0.5" style={{ fontSize: 7 }}></i>
                <span className="text-[9px] text-white/50 leading-tight line-clamp-2">{region.topThreat}</span>
              </div>
            )}

            {/* AI Summary */}
            {region.aiSummary && (
              <p className="text-[8px] text-white/30 leading-relaxed mb-2 line-clamp-2 italic">{region.aiSummary}</p>
            )}

            {/* Top events (from live data) */}
            {topEvents?.length > 0 && !region.aiSummary && (
              <div className="space-y-1 mb-2">
                {topEvents.slice(0, 2).map((evt, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <i className="fa-solid fa-circle mt-1" style={{ fontSize: 4, color: SEVERITY_COLORS[evt.severity] || SEVERITY_COLORS.MEDIUM }}></i>
                    <span className="text-secondary" style={{ fontSize: 10, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%', display: 'block' }}>
                      {evt.title}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Keywords */}
            <div className="flex gap-1 flex-wrap">
              {(region.keywords || []).map(k => (
                <span key={k} className="px-1.5 py-0.5 rounded text-muted"
                  style={{ fontSize: 9, background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  {k}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
