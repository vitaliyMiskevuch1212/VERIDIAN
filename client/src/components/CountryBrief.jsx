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
  
  const OUTLOOK_ICONS = { ... };
  const RISK_SEVERITY_COLORS = { ... };
  const COUNTRY_ISO2 = { ... };
  const SectionHeader = ({ icon, iconColor, title }) => (
    <div className="text-[9px] ...">
      <i className={`${icon}`} style={{ color: iconColor }}></i> {title}
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
        ...
        axios.post('/api/ai/brief', { country, headlines: [] })
          .then(res => setBrief(res.data))
          .catch(err => {
            console.warn(...);
            setBrief({ ...fallback });
          })
          .finally(() => setLoading(false));
      }, [country]);
      