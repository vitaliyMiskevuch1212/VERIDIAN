import React from 'react';

export default function GlobalRiskIndex({ context }) {
  if (!context) return null;
  
  const { criticalEvents = 0, militaryFlights = 0, cyberThreats = 0 } = context;
  
  // Calculate a mock Risk Score (0-100)
  const baseScore = 20;
  const eventImpact = Math.min(40, criticalEvents * 10);
  const militaryImpact = Math.min(20, militaryFlights / 5);
  const cyberImpact = Math.min(20, cyberThreats / 3);
  const totalScore = Math.min(98, baseScore + eventImpact + militaryImpact + cyberImpact);
  
  const getStatus = (score) => {
    if (score > 75) return { label: 'CRITICAL', color: 'var(--color-red)' };
    if (score > 40) return { label: 'ELEVATED', color: 'var(--color-orange)' };
    return { label: 'STABLE', color: 'var(--color-green)' };
  };
  