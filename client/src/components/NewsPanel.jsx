import React, { useState, useMemo } from 'react';
import FlagIcon from './FlagIcon';
import SkeletonLoader from './SkeletonLoader';

// =============================================================================
// timeAgo — Human-readable relative timestamp formatter
// =============================================================================
// Converts an ISO date string into a compact relative label:
//   < 1 min  → "Just now"
//   < 60 min → "12 min ago"
//   < 24 hrs → "3h ago"
//   >= 24 hrs → "2d ago"
// Returns empty string for falsy input to safely handle missing dates.
// =============================================================================
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// =============================================================================
// getSource — Extracts a display-friendly news source name from item metadata
// =============================================================================
// Checks `item.source` or `item.url` against known outlet substrings.
// Falls back to "OSINT" (Open Source Intelligence) when no match is found,
// keeping the UI consistent even for unrecognized or aggregated feeds.
// Matching is case-insensitive to handle inconsistent upstream casing.
// =============================================================================
function getSource(item) {
  const src = (item.source || item.url || '').toLowerCase();
  if (src.includes('reuters')) return 'Reuters';
  if (src.includes('bbc')) return 'BBC';
  if (src.includes('aljazeera') || src.includes('al-jazeera')) return 'Al Jazeera';
  if (src.includes('nyt') || src.includes('nytimes')) return 'NY Times';
  if (src.includes('afp')) return 'AFP';
  if (src.includes('guardian')) return 'The Guardian';
  if (src.includes('cnn')) return 'CNN';
  if (src.includes('ap')) return 'AP';
  return 'OSINT';
}

// =============================================================================
// SEVERITY_COLORS — Maps severity tiers to CSS variable color tokens
// =============================================================================
// Note: HIGH and CRITICAL share the same red color intentionally — both are
// treated as urgent-tier visually. Differentiation happens via label text,
// not color, to avoid introducing a 4th color into the severity palette.
// =============================================================================
const SEVERITY_COLORS = {
  CRITICAL: 'var(--color-red)',
  HIGH: 'var(--color-red)',
  MEDIUM: 'var(--color-yellow)',
  LOW: 'var(--color-green)',
};

// =============================================================================
// ESCALATION_COLORS — Themed color sets for escalation risk badges
// =============================================================================
// Each tier provides a coordinated { bg, border, text } triplet using rgba
// values for the background/border and CSS variables for the text color.
// This keeps badge backgrounds translucent against the dark card surface
// while ensuring text remains legible at 7–8px font sizes.
// =============================================================================
const ESCALATION_COLORS = {
  HIGH: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: 'var(--color-red)' },
  MEDIUM: { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.3)', text: 'var(--color-yellow)' },
  LOW: { bg: 'rgba(0, 255, 136, 0.1)', border: 'rgba(0, 255, 136, 0.3)', text: 'var(--color-green)' },
};

// =============================================================================
// INTELLIGENCE CARD — Individual news/intelligence item within the feed
// =============================================================================
// A self-contained card rendering a single intelligence item with:
//   - Tactical ID badge + severity label (header row)
//   - Collapsible summary text (line-clamp-2 when collapsed)
//   - Source attribution + relative timestamp + escalation risk badge
//   - Impact sector tags (cyan-themed chips)
//   - AI confidence score + conditional "Run Simulation" CTA
//   - Expandable section: actionable insight + cross-event correlations
//   - Footer: country flag, local time, upvote/downvote controls, expand toggle
//
// Props:
//   item       — The intelligence data object (title, severity, etc.)
//   isTop      — Boolean; if true, renders the gold "Top Intel 24h" crown banner
//   onSimulate — Callback for the simulation button (only shown for HIGH/CRITICAL)
// =============================================================================
const IntelligenceCard = ({ item, isTop, onSimulate }) => {
  // Deterministic upvote seed — hashes the title string into a stable number
  // to avoid Math.random() flicker on re-renders. Range: 50–449.
  const titleHash = (item.title || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const [upvotes, setUpvotes] = useState(item.upvotes || (titleHash % 400) + 50);
  const [expanded, setExpanded] = useState(false);
  const severityColor = SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.MEDIUM;
  const source = getSource(item);
  const escalation = ESCALATION_COLORS[item.escalationRisk] || ESCALATION_COLORS.MEDIUM;

  return (
    <div 
      className="mb-3 mx-3 bg-gradient-to-r from-[#0D1520]/90 to-[#121B2A]/90 backdrop-blur-md border border-white/5 rounded-sm relative overflow-hidden group transition-all hover:brightness-125"
      style={{ 
        // Left border accent: gold for top-ranked item, severity color for all others
        borderLeft: `3px solid ${isTop ? 'var(--color-gold)' : severityColor}`,
        // Subtle ambient glow for the top item; standard drop shadow otherwise
        boxShadow: isTop ? '0 0 15px rgba(245, 158, 11, 0.05)' : '0 2px 10px rgba(0,0,0,0.2)'
      }}
    >
      {/* Crown banner — only rendered for the highest-ranked item in the feed */}
      {isTop && (
        <div className="px-3 py-1 bg-black/40 border-b border-white/5 flex items-center gap-2">
          <i className="fa-solid fa-crown text-[var(--color-gold)] text-[10px]"></i>
          <span className="text-[var(--color-gold)] text-[9px] font-heading uppercase tracking-widest">Top Intel 24h</span>
        </div>
      )}

      <div className="p-3">
        {/* ----- HEADER ROW: Tactical ID badge + title + severity pill ----- */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Tactical ID — monospace badge with layer-group icon, falls back to #INT-0000 */}
            <div className="px-1.5 py-0.5 bg-black/60 border border-white/10 rounded-sm text-[var(--color-red)] font-mono text-[9px] flex items-center gap-1.5">
              <i className="fa-solid fa-layer-group text-[8px]"></i>
              {item.tacticalId || '#INT-0000'}
            </div>
            <h3 className="text-white font-bold text-xs leading-tight tracking-tight flex-1">
              {item.title}
            </h3>
          </div>
          {/* Severity pill — bordered label (always visible, not collapsible) */}
          <div className="px-2 py-0.5 border border-[#EF444450] text-[var(--color-red)] text-[8px] font-bold rounded-sm">
            {item.severity}
          </div>
        </div>

        {/* ----- SUMMARY — Truncated to 2 lines when collapsed ----- */}
        <p className={`text-white/60 text-[11px] leading-relaxed mb-2 ${expanded ? '' : 'line-clamp-2'}`}>
          {item.intelSummary || 'Deep neural analysis evaluating secondary impacts and cross-border escalation risks.'}
        </p>

        {/* ----- METADATA ROW: Source badge + relative time + escalation risk ----- */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {/* Source attribution badge */}
          <span className="text-[8px] font-bold text-white/30 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-sm">{source}</span>
          {/* Relative timestamp */}
          <span className="text-white/20 text-[8px] font-mono">{timeAgo(item.publishedAt)}</span>
          {/* Escalation risk indicator — only shown when the field is present */}
          {item.escalationRisk && (
            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1"
              style={{ background: escalation.bg, border: `1px solid ${escalation.border}`, color: escalation.text }}>
              <i className="fa-solid fa-arrow-trend-up" style={{ fontSize: 6 }}></i>
              ESC: {item.escalationRisk}
            </span>
          )}
        </div>

        {/* ----- IMPACT SECTORS — Cyan-themed tag chips (e.g., "ENERGY", "DEFENSE") ----- */}
        {item.impactSectors?.length > 0 && (
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            {item.impactSectors.map((sector, i) => (
              <span key={i} className="px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/20 rounded-sm text-[var(--color-cyan)]">
                {sector}
              </span>
            ))}
          </div>
        )}

        {/* ----- CONFIDENCE + SIMULATION ROW ----- */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {/* AI confidence score — green shield badge, defaults to 85% */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#00FF8810] border border-[#00FF8830] rounded-sm text-[var(--color-green)] text-[8px] font-bold">
            <i className="fa-solid fa-shield-check text-[9px]"></i>
            CONFIDENCE {item.confidence || 85}%
          </div>
          {/* "Run Simulation" CTA — only rendered for HIGH or CRITICAL severity items.
              Triggers the parent's onSimulate callback with the full item payload
              for wargame/scenario modeling. */}
          {(item.severity === 'CRITICAL' || item.severity === 'HIGH') && (
            <button 
              onClick={() => onSimulate?.(item)}
              className="px-2 py-0.5 bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/30 rounded-sm text-[var(--color-cyan)] text-[8px] font-bold uppercase tracking-widest hover:bg-[var(--color-cyan)]/20 transition-all pointer-events-auto flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-code-branch"></i> Run Simulation
            </button>
          )}
        </div>

        {/* ----- EXPANDED CONTENT — Revealed on chevron toggle ----- */}
        {/* Contains two optional insight panels:
            1. Actionable Insight (green) — AI-generated recommendation
            2. Cross-Event Correlation (purple) — links to related intelligence items
            Both are conditionally rendered based on data availability. */}
        {expanded && (
          <div className="space-y-2 mb-2 animate-fade-in">
            {/* Actionable Insight panel */}
            {item.actionableInsight && (
              <div className="bg-[#00FF8808] border border-[#00FF8815] rounded-sm px-2.5 py-2">
                <div className="text-[7px] font-bold text-[var(--color-green)] uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                  <i className="fa-solid fa-bullseye" style={{ fontSize: 7 }}></i> Actionable Insight
                </div>
                <p className="text-white/60 text-[10px] leading-relaxed">{item.actionableInsight}</p>
              </div>
            )}
            {/* Cross-Event Correlation panel — hidden for "Isolated event" items
                since there's nothing meaningful to display */}
            {item.relatedEvents && item.relatedEvents !== 'Isolated event' && (
              <div className="bg-[var(--color-purple)]/5 border border-[var(--color-purple)]/15 rounded-sm px-2.5 py-2">
                <div className="text-[7px] font-bold text-[var(--color-purple)] uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                  <i className="fa-solid fa-link" style={{ fontSize: 7 }}></i> Cross-Event Correlation
                </div>
                <p className="text-white/50 text-[10px] leading-relaxed">{item.relatedEvents}</p>
              </div>
            )}
          </div>
        )}

        {/* ----- FOOTER — Flag, timestamp, voting controls, expand toggle ----- */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          {/* Left: Country flag (via iso2 code) + local time of publication */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <FlagIcon iso2={item.iso2 || 'un'} size={16} showLabel />
              <span className="text-white/40 text-[9px] font-mono uppercase">{new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Center: Upvote / downvote control group.
              Inline counter with green monospace readout.
              pointer-events-auto is required because parent overlay
              layers may disable pointer events. */}
          <div className="flex items-center bg-black/40 border border-white/5 rounded-sm overflow-hidden pointer-events-auto">
            <button 
              onClick={() => setUpvotes(prev => prev + 1)}
              className="px-2 py-1 text-white/30 hover:text-white transition-colors border-r border-white/5 bg-transparent"
            >
              <i className="fa-solid fa-arrow-up text-[9px]"></i>
            </button>
            <span className="px-2 py-1 text-[var(--color-green)] font-mono text-[10px] min-w-[30px] text-center">
              {upvotes}
            </span>
            <button 
              onClick={() => setUpvotes(prev => prev - 1)}
              className="px-2 py-1 text-white/30 hover:text-white transition-colors bg-transparent"
            >
              <i className="fa-solid fa-arrow-down text-[9px]"></i>
            </button>
          </div>
          
          {/* Right: Expand/collapse chevron toggle */}
          <button onClick={() => setExpanded(!expanded)} className="bg-transparent border-none cursor-pointer pointer-events-auto">
            <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'} text-white/20 text-[9px] ml-2 hover:text-white/50 transition-colors`}></i>
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// NEWS PANEL — Main intelligence feed container with filtering, search, and list
// =============================================================================
// Full-height sidebar panel housing the "Smart Digest" / "Pulse Feed" interface.
// Composed of 5 vertical sections (top to bottom):
//   1. Title bar — "Smart Digest" branding + optional close button
//   2. Sub-header — "Pulse Feed" label + mute button + last-refresh timestamp
//   3. Filter belt — Severity/type chip toggles with live counts
//   4. Search HUD — Text search input + filter action button
//   5. Intelligence list — Scrollable card feed (or skeleton loader / empty state)
//
// Props:
//   news          — Array of intelligence item objects to display
//   loading       — Boolean; when true, shows SkeletonLoader instead of cards
//   activeFilters — Object mapping event types to boolean on/off states
//                   (e.g., { conflict: false } hides conflict-matching items)
//   timeRange     — Time window filter: '1h' | '6h' | '24h' | '7d'
//   onSimulate    — Callback passed down to IntelligenceCard for simulation CTAs
//   onClose       — Optional callback; renders a close button when provided
//   hideTitle     — Boolean; hides the "Smart Digest" header when true
//                   (used when the panel is embedded inside another layout)
// =============================================================================
export default function NewsPanel({ news = [], loading = false, activeFilters = {}, timeRange = '24h', onSimulate, onClose, hideTitle = false }) {
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('HIGH');

  // ---------------------------------------------------------------------------
  // FILTERED INTELLIGENCE — Memoized pipeline applying 4 filter stages:
  //   1. Text search — case-insensitive title substring match
  //   2. Chip filter — severity-based (HIGH includes CRITICAL; 24H = show all)
  //   3. Time filter — excludes items older than the selected timeRange window
  //   4. Global type filters — keyword regex exclusion from activeFilters map
  //
  // TYPE_KEYWORDS regex patterns are defined inline to keep the filtering logic
  // self-contained. Each pattern matches common vocabulary for its event type.
  // The regex approach trades precision for resilience — it works without
  // requiring a structured `type` field on every item from upstream feeds.
  // ---------------------------------------------------------------------------
  const filtered = useMemo(() => {
    const now = Date.now();

    // Time window limits in milliseconds, keyed by the timeRange prop value
    const timeLimits = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };
    const limit = timeLimits[timeRange] || timeLimits['24h'];

    // Keyword regex patterns for classifying items by event type.
    // Used by the global filter toggle (activeFilters) to exclude
    // entire categories without requiring a structured type field.
    const TYPE_KEYWORDS = {
      conflict: /war|conflict|attack|explosion|military|strike|missile|terror/i,
      protest: /protest|riot|demonstration|strike|march|unrest/i,
      disaster: /disaster|flood|storm|hurricane|typhoon|tornado/i,
      earthquake: /earthquake|quake|tsunami|magnitude/i,
      wildfire: /fire|wildfire|blaze/i
    };

    return news.filter(n => {
      // Stage 1: Text search — skip items whose title doesn't contain the query
      if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
      
      // Stage 2: Severity chip filter
      // "HIGH" chip includes both HIGH and CRITICAL items
      // "24H" chip is a pass-through (shows all severities)
      // Any other chip value filters to exact severity match
      if (activeChip === 'HIGH') {
        if (n.severity !== 'HIGH' && n.severity !== 'CRITICAL') return false;
      } else if (activeChip && activeChip !== '24H' && n.severity !== activeChip) {
        return false;
      }

      // Stage 3: Time window — exclude items published before the cutoff
      if (n.publishedAt) {
        const publishedTime = new Date(n.publishedAt).getTime();
        if (now - publishedTime > limit) return false;
      }

      // Stage 4: Global type filters — exclude items matching disabled categories.
      // Each filter key maps to a regex; when the filter value is explicitly false,
      // items matching that regex are excluded from results.
      const matchConflict = TYPE_KEYWORDS.conflict.test(n.title);
      const matchProtest  = TYPE_KEYWORDS.protest.test(n.title);
      const matchDisaster = TYPE_KEYWORDS.disaster.test(n.title);
      const matchQuake    = TYPE_KEYWORDS.earthquake.test(n.title);
      const matchFire     = TYPE_KEYWORDS.wildfire.test(n.title);

      if (activeFilters.conflict === false && matchConflict) return false;
      if (activeFilters.protest === false && matchProtest) return false;
      if (activeFilters.disaster === false && matchDisaster) return false;
      if (activeFilters.earthquake === false && matchQuake) return false;
      if (activeFilters.wildfire === false && matchFire) return false;

      return true;
    });
  }, [news, search, activeChip, timeRange, activeFilters]);

  return (
    <div className="flex flex-col h-full bg-[#0A0F1E]" style={{ overflow: 'hidden' }}>

      {/* ================================================================== */}
      {/* SECTION 1: TITLE BAR — "Smart Digest" branding + close button      */}
      {/* The lock icon indicates this is a premium/restricted feed.          */}
      {/* hideTitle collapses branding for embedded panel contexts.           */}
      {/* ================================================================== */}
      <div className={`px-4 py-3 border-b border-white/10 flex items-center ${hideTitle ? 'justify-end' : 'justify-between'} gap-2`}>
        {!hideTitle && (
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-book-bookmark text-[var(--color-red)] text-sm"></i>
            <h2 className="text-white font-heading uppercase tracking-[0.3em] text-[11px]">Smart Digest</h2>
            <i className="fa-solid fa-lock-keyhole text-white/40 text-[10px] ml-1"></i>
          </div>
        )}
        
        {/* Close button — only rendered when onClose callback is provided.
            Used in modal/drawer contexts where the panel can be dismissed. */}
        {onClose && (
          <button 
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-sm bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer pointer-events-auto group"
            title="Close Panel"
          >
            <i className="fa-solid fa-xmark text-[10px] group-hover:scale-110 transition-transform"></i>
          </button>
        )}
      </div>

      {/* ================================================================== */}
      {/* SECTION 2: SUB-HEADER — "Pulse Feed" badge + mute + refresh time   */}
      {/* The refresh timestamp shows the current local time on mount/render, */}
      {/* giving the user a visual cue of when the feed was last loaded.      */}
      {/* ================================================================== */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black border border-white/10 rounded-sm">
          <i className="fa-solid fa-rss text-[var(--color-red)] text-xs"></i>
          <span className="text-white font-bold text-[10px] uppercase tracking-wider">Pulse Feed</span>
        </div>
        <div className="flex items-center gap-4">
           {/* Mute/notification toggle (UI-only, not yet wired) */}
           <button className="text-white/40 hover:text-white transition-colors bg-transparent border-none pointer-events-auto">
             <i className="fa-solid fa-bell-slash text-xs"></i>
           </button>
           {/* Last refresh timestamp — re-evaluated on each render */}
           <div className="flex items-center gap-2 text-white/40 font-mono text-[10px]">
             <i className="fa-solid fa-rotate-right text-[10px]"></i>
             <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
           </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* SECTION 3: FILTER BELT — Severity/type chip toggles                */}
      {/* Chips: HIGH, MEDIUM, 24H (all), ESCALATION, DE-ESCALATION          */}
      {/* HIGH and MEDIUM chips show live counts derived from the unfiltered  */}
      {/* news array. 24H shows total count. ESCALATION/DE-ESCALATION chips  */}
      {/* don't show counts (null). Active chip gets a red-tinted background. */}
      {/* ================================================================== */}
      <div className="px-3 pb-3 flex items-center gap-1.5 flex-wrap">
        {['HIGH', 'MEDIUM', '24H', 'ESCALATION', 'DE-ESCALATION'].map(chip => {
          // Compute live count for countable chips; null for type-based chips
          const chipCount = chip === '24H' ? news.length 
            : chip === 'HIGH' ? news.filter(n => n.severity === 'HIGH' || n.severity === 'CRITICAL').length
            : chip === 'MEDIUM' ? news.filter(n => n.severity === 'MEDIUM').length
            : null;
          return (
            <button
              key={chip}
              onClick={() => setActiveChip(chip)}
              className={`px-2 py-1 rounded-sm text-[8px] font-bold uppercase tracking-wider transition-all pointer-events-auto ${
                activeChip === chip 
                  ? 'bg-[#EF444420] border border-[#EF444450] text-[var(--color-red)]' 
                  : 'bg-white/5 border border-white/10 text-white/40 hover:text-white'
              }`}
            >
              {/* Directional trend icons for escalation chips */}
              {chip === 'ESCALATION' && <i className="fa-solid fa-arrow-trend-up mr-1 opacity-50"></i>}
              {chip === 'DE-ESCALATION' && <i className="fa-solid fa-arrow-trend-down mr-1 opacity-50"></i>}
              {chip}{chipCount != null ? ` (${chipCount})` : ''}
            </button>
          );
        })}
      </div>

      {/* ================================================================== */}
      {/* SECTION 4: SEARCH HUD — Text input + filter action button          */}
      {/* Drives Stage 1 of the useMemo filter pipeline via the `search`     */}
      {/* state. The adjacent filter button is a UI placeholder for future    */}
      {/* advanced filter panel expansion.                                    */}
      {/* ================================================================== */}
      <div className="px-3 mb-4 flex items-center gap-2">
        <div className="flex-1 relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-[10px]"></i>
          <input
            type="text"
            placeholder="Analytical search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-sm pl-8 pr-3 py-2 text-[10px] text-white placeholder:text-white/20 focus:border-[var(--color-red)] outline-none transition-all pointer-events-auto"
          />
        </div>
        {/* Advanced filter button — UI stub for future filter panel */}
        <button className="p-2 bg-white/5 border border-white/10 rounded-sm text-white/40 hover:text-white transition-colors pointer-events-auto">
          <i className="fa-solid fa-filter text-[10px]"></i>
        </button>
      </div>

      {/* ================================================================== */}
      {/* SECTION 5: INTELLIGENCE LIST — Scrollable card feed                */}
      {/* Three render states:                                               */}
      {/*   1. loading=true  → SkeletonLoader placeholder (10 lines)         */}
      {/*   2. filtered=[]   → Empty state with radar icon + message         */}
      {/*   3. filtered=[…]  → IntelligenceCard list                         */}
      {/* The first card receives isTop=true ONLY when there's no active     */}
      {/* search query AND the severity chip is set to "HIGH", ensuring the  */}
      {/* gold crown badge only appears in the default high-priority view.   */}
      {/* ================================================================== */}
      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
        {loading ? (
          <div className="p-4"><SkeletonLoader lines={10} /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-white/20">
            <i className="fa-solid fa-radar text-4xl mb-4 opacity-10"></i>
            <p className="text-xs uppercase tracking-[0.2em]">No intelligence matches</p>
          </div>
        ) : (
          filtered.map((item, i) => (
            <IntelligenceCard key={i} item={item} isTop={i === 0 && !search && activeChip === 'HIGH'} onSimulate={onSimulate} />
          ))
        )}
      </div>
    </div>
  );
}