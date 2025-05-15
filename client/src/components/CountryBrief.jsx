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
