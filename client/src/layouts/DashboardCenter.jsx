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

   return (
    <div className="flex-1 relative overflow-hidden">
      {/* Filter Bar + View Controls */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="pointer-events-auto backdrop-blur-md bg-black/40 border-b border-white/5 px-2 min-h-[48px] py-1 flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[300px]">
            <FilterBar
              activeFilters={activeFilters}
              onToggle={handleFilterToggle}
              timeRange={timeRange}
              onTimeChange={setTimeRange}
            />
          </div>