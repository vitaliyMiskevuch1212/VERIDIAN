import React, { useState, useMemo } from 'react';
import FlagIcon from './FlagIcon';
import SkeletonLoader from './SkeletonLoader';

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

const SEVERITY_COLORS = {
  CRITICAL: 'var(--color-red)',
  HIGH: 'var(--color-red)', // Match ref: High is red
  MEDIUM: 'var(--color-yellow)',
  LOW: 'var(--color-green)',
};

/**
 * Internal Intelligence Card Component
 */
const ESCALATION_COLORS = {
  HIGH: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: 'var(--color-red)' },
  MEDIUM: { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.3)', text: 'var(--color-yellow)' },
  LOW: { bg: 'rgba(0, 255, 136, 0.1)', border: 'rgba(0, 255, 136, 0.3)', text: 'var(--color-green)' },
};

const IntelligenceCard = ({ item, isTop, onSimulate }) => {
  // Deterministic upvote count from title hash instead of random
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
        borderLeft: `3px solid ${isTop ? 'var(--color-gold)' : severityColor}`,
        boxShadow: isTop ? '0 0 15px rgba(245, 158, 11, 0.05)' : '0 2px 10px rgba(0,0,0,0.2)'
      }}
    >
      {isTop && (
        <div className="px-3 py-1 bg-black/40 border-b border-white/5 flex items-center gap-2">
          <i className="fa-solid fa-crown text-[var(--color-gold)] text-[10px]"></i>
          <span className="text-[var(--color-gold)] text-[9px] font-heading uppercase tracking-widest">Top Intel 24h</span>
        </div>
      )}

      <div className="p-3">
        {/* Header: ID + Severity */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="px-1.5 py-0.5 bg-black/60 border border-white/10 rounded-sm text-[var(--color-red)] font-mono text-[9px] flex items-center gap-1.5">
              <i className="fa-solid fa-layer-group text-[8px]"></i>
              {item.tacticalId || '#INT-0000'}
            </div>
            <h3 className="text-white font-bold text-xs leading-tight tracking-tight flex-1">
              {item.title}
            </h3>
          </div>
          <div className="px-2 py-0.5 border border-[#EF444450] text-[var(--color-red)] text-[8px] font-bold rounded-sm">
            {item.severity}
          </div>
        </div>

        {/* Summary */}
        <p className={`text-white/60 text-[11px] leading-relaxed mb-2 ${expanded ? '' : 'line-clamp-2'}`}>
          {item.intelSummary || 'Deep neural analysis evaluating secondary impacts and cross-border escalation risks.'}
        </p>

        {/* Escalation Risk + Source */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-[8px] font-bold text-white/30 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-sm">{source}</span>
          <span className="text-white/20 text-[8px] font-mono">{timeAgo(item.publishedAt)}</span>
          {item.escalationRisk && (
            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1"
              style={{ background: escalation.bg, border: `1px solid ${escalation.border}`, color: escalation.text }}>
              <i className="fa-solid fa-arrow-trend-up" style={{ fontSize: 6 }}></i>
              ESC: {item.escalationRisk}
            </span>
          )}
        </div>

        {/* Impact Sectors */}
        {item.impactSectors?.length > 0 && (
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            {item.impactSectors.map((sector, i) => (
              <span key={i} className="px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/20 rounded-sm text-[var(--color-cyan)]">
                {sector}
              </span>
            ))}
          </div>
        )}

        {/* Confidence Badge & Wargame */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#00FF8810] border border-[#00FF8830] rounded-sm text-[var(--color-green)] text-[8px] font-bold">
            <i className="fa-solid fa-shield-check text-[9px]"></i>
            CONFIDENCE {item.confidence || 85}%
          </div>
          {(item.severity === 'CRITICAL' || item.severity === 'HIGH') && (
            <button 
              onClick={() => onSimulate?.(item)}
              className="px-2 py-0.5 bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/30 rounded-sm text-[var(--color-cyan)] text-[8px] font-bold uppercase tracking-widest hover:bg-[var(--color-cyan)]/20 transition-all pointer-events-auto flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-code-branch"></i> Run Simulation
            </button>
          )}
        </div>

        {/* Expanded: Actionable Insight + Related Events */}
        {expanded && (
          <div className="space-y-2 mb-2 animate-fade-in">
            {item.actionableInsight && (
              <div className="bg-[#00FF8808] border border-[#00FF8815] rounded-sm px-2.5 py-2">
                <div className="text-[7px] font-bold text-[var(--color-green)] uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                  <i className="fa-solid fa-bullseye" style={{ fontSize: 7 }}></i> Actionable Insight
                </div>
                <p className="text-white/60 text-[10px] leading-relaxed">{item.actionableInsight}</p>
              </div>
            )}
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

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <FlagIcon iso2={item.iso2 || 'un'} size={16} showLabel />
              <span className="text-white/40 text-[9px] font-mono uppercase">{new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

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
          
          <button onClick={() => setExpanded(!expanded)} className="bg-transparent border-none cursor-pointer pointer-events-auto">
            <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'} text-white/20 text-[9px] ml-2 hover:text-white/50 transition-colors`}></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function NewsPanel({ news = [], loading = false, activeFilters = {}, timeRange = '24h', onSimulate, onClose, hideTitle = false }) {
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('HIGH');

  const filtered = useMemo(() => {
    const now = Date.now();
    const timeLimits = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };
    const limit = timeLimits[timeRange] || timeLimits['24h'];

    const TYPE_KEYWORDS = {
      conflict: /war|conflict|attack|explosion|military|strike|missile|terror/i,
      protest: /protest|riot|demonstration|strike|march|unrest/i,
      disaster: /disaster|flood|storm|hurricane|typhoon|tornado/i,
      earthquake: /earthquake|quake|tsunami|magnitude/i,
      wildfire: /fire|wildfire|blaze/i
    };

    return news.filter(n => {
      // 1. Text Search
      if (search && !n.title.toLowerCase().includes(search.toLowerCase())) return false;
      
      // 2. Chip Filter (Severity)
      if (activeChip === 'HIGH') {
        if (n.severity !== 'HIGH' && n.severity !== 'CRITICAL') return false;
      } else if (activeChip && activeChip !== '24H' && n.severity !== activeChip) {
        return false;
      }

      // 3. Time Filter
      if (n.publishedAt) {
        const publishedTime = new Date(n.publishedAt).getTime();
        if (now - publishedTime > limit) return false;
      }

      // 4. Global Top Filters (activeFilters)
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
      <div className={`px-4 py-3 border-b border-white/10 flex items-center ${hideTitle ? 'justify-end' : 'justify-between'} gap-2`}>
        {!hideTitle && (
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-book-bookmark text-[var(--color-red)] text-sm"></i>
            <h2 className="text-white font-heading uppercase tracking-[0.3em] text-[11px]">Smart Digest</h2>
            <i className="fa-solid fa-lock-keyhole text-white/40 text-[10px] ml-1"></i>
          </div>
        )}
        
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

      {/* 2. Sub-Header: PULSE FEED */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black border border-white/10 rounded-sm">
          <i className="fa-solid fa-rss text-[var(--color-red)] text-xs"></i>
          <span className="text-white font-bold text-[10px] uppercase tracking-wider">Pulse Feed</span>
        </div>
        <div className="flex items-center gap-4">
           <button className="text-white/40 hover:text-white transition-colors bg-transparent border-none pointer-events-auto">
             <i className="fa-solid fa-bell-slash text-xs"></i>
           </button>
           <div className="flex items-center gap-2 text-white/40 font-mono text-[10px]">
             <i className="fa-solid fa-rotate-right text-[10px]"></i>
             <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
           </div>
        </div>
      </div>

      {/* 3. Filter Belt */}
      <div className="px-3 pb-3 flex items-center gap-1.5 flex-wrap">
        {['HIGH', 'MEDIUM', '24H', 'ESCALATION', 'DE-ESCALATION'].map(chip => {
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
              {chip === 'ESCALATION' && <i className="fa-solid fa-arrow-trend-up mr-1 opacity-50"></i>}
              {chip === 'DE-ESCALATION' && <i className="fa-solid fa-arrow-trend-down mr-1 opacity-50"></i>}
              {chip}{chipCount != null ? ` (${chipCount})` : ''}
            </button>
          );
        })}
      </div>

      {/* 4. Search HUD */}
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
        <button className="p-2 bg-white/5 border border-white/10 rounded-sm text-white/40 hover:text-white transition-colors pointer-events-auto">
          <i className="fa-solid fa-filter text-[10px]"></i>
        </button>
      </div>

      {/* 5. Intelligence List */}
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