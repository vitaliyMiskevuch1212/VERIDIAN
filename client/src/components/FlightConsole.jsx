import React, { useMemo, useState } from 'react';

const CATEGORIES = [
  { id: 'all', label: 'All Tracked', icon: 'fa-plane', color: 'var(--color-cyan)' },
  { id: 'unknown', label: 'Unknown', icon: 'fa-question', color: '#888' },
  { id: 'isr', label: 'ISR/AWACS', icon: 'fa-satellite', color: '#a78bfa' },
  { id: 'transport', label: 'Transport', icon: 'fa-truck-plane', color: '#60a5fa' },
  { id: 'heli', label: 'Helicopter', icon: 'fa-helicopter', color: '#34d399' },
  { id: 'tanker', label: 'Tanker', icon: 'fa-gas-pump', color: '#fbbf24' },
];

function mapToCategory(aircraftType = '') {
  const t = aircraftType.toLowerCase();
  if (t.includes('uav') || t.includes('recon') || t.includes('awacs') || t.includes('strategic')) return 'isr';
  if (t.includes('heavy') || t.includes('large') || t.includes('transport')) return 'transport';
  if (t.includes('rotor') || t.includes('heli')) return 'heli';
  if (t.includes('tanker') || t.includes('refuel')) return 'tanker';
  if (t.includes('high') || t.includes('fighter') || t.includes('maneuv')) return 'isr';
  return 'unknown';
}

export default function FlightConsole({ flights = [], activeCategory, onCategoryChange }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const categoryCounts = useMemo(() => {
    const counts = { all: flights.length, unknown: 0, isr: 0, transport: 0, heli: 0, tanker: 0 };
    flights.forEach(f => {
      const cat = mapToCategory(f.aircraftType);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [flights]);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      <div 
        className="backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden transition-all duration-300 panel-glow bg-gradient-to-b from-[#060B14]/80 to-[#0A0F1E]/90"
        style={{ 
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
          minWidth: isExpanded ? 560 : 200
        }}
      ></div>