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