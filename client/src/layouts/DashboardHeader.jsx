import React from 'react';
import Ticker from '../components/Ticker';
import Navbar from '../components/Navbar';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';

export default function DashboardHeader() {
  const { news, isConnected, serverClients } = useData();
  const { 
    missionMetrics, 
    isCommsActive, 
    handleCommsToggle, 
    setActiveTab, 
    defconLevel,
    handleTickerEventClick 
  } = useUI();

  return (
    <>
      {/* 1. TOP Ticker bar */}
      <Ticker events={news} onEventClick={handleTickerEventClick} />

      {/* 2. Brand Navbar */}
      <Navbar 
        activeCount={missionMetrics.active} 
        tensionCount={missionMetrics.tensions} 
        isCommsActive={isCommsActive}
        onCommsToggle={handleCommsToggle}
        onPredictionsClick={() => setActiveTab('predictions')}
        isConnected={isConnected}
        serverClients={serverClients}
        defconLevel={defconLevel}
      />
    </>
  );
}