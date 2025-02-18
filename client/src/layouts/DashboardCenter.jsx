import React from 'react';
import FilterBar from '../components/FilterBar';
import Globe from '../components/Globe';
import Map2D from '../components/Map2D';
import RegionPanel from '../components/RegionPanel';
import TensionChart from '../components/TensionChart';
import FlightConsole from '../components/FlightConsole';
import ErrorBoundary from '../components/ErrorBoundary';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';

export default function DashboardCenter() {
  const { flights, cyber, news, aiRegions } = useData();
  const {
    activeFilters,
    handleFilterToggle,
    timeRange,
    setTimeRange,
    viewMode,
    setViewMode,
    showFlights,
    setShowFlights,
    showCyber,
    setShowCyber,
    showRegions,
    setShowRegions,
    showHeatmap,
    setShowHeatmap,
    panelsVisible,
    setPanelsVisible,
    audio,
    filteredEvents,
    filteredFlights,
    handleCountryClick,
    flyToTarget,
    handleRegionClick,
    flightCategory,
    setFlightCategory,
    minTime,
    maxTime,
    scrubTime,
    setScrubTime
  } = useUI();