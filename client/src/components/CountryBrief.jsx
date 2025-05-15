import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FlagIcon from './FlagIcon';
import TerminalLoader from './TerminalLoader';
import RedactedText from './RedactedText';
import ScrambleText from './ScrambleText';
import DroneFeed from './DroneFeed';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import MarketGraph from './MarketGraph';

function getScoreColor(score) {
  if (score >= 75) return 'var(--color-green)';
  if (score >= 50) return 'var(--color-yellow)';
  if (score >= 25) return 'var(--color-orange)';
  return 'var(--color-red)';
}

const OUTLOOK_ICONS = {
  Stable: 'fa-solid fa-shield-check',
  Deteriorating: 'fa-solid fa-chart-line',
  Escalating: 'fa-solid fa-arrow-trend-up',
  Crisis: 'fa-solid fa-triangle-exclamation',
};

const RISK_SEVERITY_COLORS = {
  CRITICAL: 'var(--color-red)',
  HIGH: 'var(--color-orange)',
  MEDIUM: 'var(--color-yellow)',
  LOW: 'var(--color-green)',
};

const COUNTRY_ISO2 = {
  'United States': 'us', 'United States of America': 'us', 'China': 'cn', 'Russia': 'ru', 'India': 'in', 'Brazil': 'br',
  'United Kingdom': 'gb', 'France': 'fr', 'Germany': 'de', 'Japan': 'jp', 'South Korea': 'kr',
  'Turkey': 'tr', 'Iran': 'ir', 'Iraq': 'iq', 'Syria': 'sy', 'Israel': 'il',
  'Saudi Arabia': 'sa', 'Egypt': 'eg', 'Nigeria': 'ng', 'Pakistan': 'pk', 'Afghanistan': 'af',
  'Ukraine': 'ua', 'Poland': 'pl', 'Taiwan': 'tw', 'Indonesia': 'id', 'Philippines': 'ph',
  'Mexico': 'mx', 'Argentina': 'ar', 'Colombia': 'co', 'Venezuela': 've', 'Lebanon': 'lb',
  'Sudan': 'sd', 'Somalia': 'so', 'DR Congo': 'cd', 'Bangladesh': 'bd', 'UAE': 'ae',
  'Greece': 'gr', 'Australia': 'au', 'Canada': 'ca', 'Spain': 'es', 'Italy': 'it',
};

const SectionHeader = ({ icon, iconColor, title }) => (
  <div className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
    <i className={`${icon} text-[8px]`} style={{ color: iconColor || 'var(--color-cyan)' }}></i> {title}
  </div>
);

export default function CountryBrief({ country, onClose }) {
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStockIdx, setSelectedStockIdx] = useState(0);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (!country) return;
    setLoading(true);
    setBrief(null);
    setSelectedStockIdx(0);
    setActiveSection('overview');

    axios.post('/api/ai/brief', { country, headlines: [] })
      .then(res => setBrief(res.data))
      .catch(err => {
        console.warn('Brief fetch failed:', err.message);
        setBrief({
          countryName: country,
          briefText: 'Intelligence assessment unavailable. Connect API keys for live AI analysis.',
          stabilityScore: 50,
          topRisks: [{ risk: 'Data unavailable', severity: 'LOW' }],
          outlook: 'Stable',
          keyActors: [], escalationFactors: [], deescalationFactors: [],
          economicImpact: '', militaryPosture: '', diplomaticStatus: '', humanitarianConcerns: '',
          sourceHeadlines: [], topStocks: [], affectedSectors: [],
          historicalParallel: '', confidenceLevel: 0,
          demo: true
        });
      })
      .finally(() => setLoading(false));
  }, [country]);

  if (!country) return null;

  const iso2 = COUNTRY_ISO2[country] || '';
  const scoreData = brief ? [{ value: brief.stabilityScore, fill: getScoreColor(brief.stabilityScore) }] : [];

  const handleCopy = () => {
    const text = brief
      ? `VERIDIAN Intel Brief: ${country}\nStability: ${brief.stabilityScore}/100\nOutlook: ${brief.outlook}\nConfidence: ${brief.confidenceLevel}%\n\n${brief.briefText}`
      : '';
    navigator.clipboard.writeText(text);
  };

  const hasAssets = brief?.topStocks && brief.topStocks.length > 0;
  const panelWidth = hasAssets ? 900 : 420;

  const SECTIONS = [
    { id: 'overview', label: 'Overview', icon: 'fa-eye' },
    { id: 'military', label: 'Military', icon: 'fa-jet-fighter' },
    { id: 'economic', label: 'Economic', icon: 'fa-chart-line' },
    { id: 'diplomatic', label: 'Diplomatic', icon: 'fa-handshake' },
  ];

  return (
    <div
      className="slide-in-right panel absolute right-0 top-0 bottom-0 z-40 flex flex-col shadow-2xl"
      style={{ width: panelWidth, maxWidth: '95vw', overflow: 'hidden', background: 'rgba(10, 15, 25, 0.95)', backdropFilter: 'blur(20px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/40 z-10 relative" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <FlagIcon iso2={iso2} size={40} />
          <div>
            <h2 className="text-white text-lg font-heading uppercase tracking-widest font-bold">
              <ScrambleText text={country} duration={800} />
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-1.5 py-0.5 border border-white/20 bg-white/5 rounded text-[8px] font-mono text-white/50">GEO-NODE</span>
              <ScrambleText text={`ID: ${country.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`} className="text-[10px] text-white/40 font-mono tracking-widest" duration={1200} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {brief?.liveDataSources && (
            <div className="flex items-center gap-1.5 text-[8px] font-mono text-white/20 mr-2">
              <span>{brief.liveDataSources.eventsCount}E</span>
              <span>{brief.liveDataSources.newsCount}N</span>
              <span>{brief.liveDataSources.flightsCount}F</span>
              <span>{brief.liveDataSources.cyberCount}C</span>
            </div>
          )}
          <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)' }}>
            <i className="fa-solid fa-copy"></i>
          </button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)' }}>
            <i className="fa-solid fa-xmark" style={{ fontSize: 18 }}></i>
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      {!loading && brief && (
        <div className="flex border-b border-white/5 bg-black/20 px-2">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className="px-3 py-2 text-[8px] font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 border-none transition-all cursor-pointer outline-none relative"
              style={{
                background: activeSection === s.id ? 'rgba(0,212,255,0.08)' : 'transparent',
                color: activeSection === s.id ? 'var(--color-cyan)' : 'var(--color-text-muted)',
              }}>
              <i className={`fa-solid ${s.icon} text-[8px]`}></i>
              {s.label}
              {activeSection === s.id && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-cyan)]"></div>}
            </button>
          ))}
        </div>
      )}