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
    leftPanelVisible,
    setLeftPanelVisible,
    rightPanelVisible,
    setRightPanelVisible,
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

          <div className="flex items-center gap-1.5 ml-auto flex-shrink-0 px-2">
            <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/5">
              <button onMouseEnter={audio.playHover} onClick={() => { setViewMode('globe'); audio.playClick(); }} className={`p-1.5 transition-all cursor-pointer border-none rounded-full ${viewMode === 'globe' ? 'text-[var(--color-cyan)] bg-[var(--color-cyan)]/20' : 'text-muted'}`} title="3D Globe">
                <i className="fa-solid fa-earth-americas text-sm"></i>
              </button>
              <button onMouseEnter={audio.playHover} onClick={() => { setViewMode('map2d'); audio.playClick(); }} className={`p-1.5 transition-all cursor-pointer border-none rounded-full ${viewMode === 'map2d' ? 'text-[var(--color-cyan)] bg-[var(--color-cyan)]/20' : 'text-muted'}`} title="2D Map">
                <i className="fa-solid fa-map text-sm"></i>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button onMouseEnter={audio.playHover} onClick={() => { setShowFlights(!showFlights); audio.playClick(); }} className={`p-2 transition-all cursor-pointer border border-veridian rounded-full w-8 h-8 flex items-center justify-center ${showFlights ? 'text-[var(--color-cyan)] bg-[var(--color-cyan)]/20' : 'text-muted'}`} title="Military Intelligence">
                <i className="fa-solid fa-fighter-jet text-[10px]"></i>
              </button>
              <button onMouseEnter={audio.playHover} onClick={() => { setShowCyber(!showCyber); audio.playClick(); }} className={`p-2 transition-all cursor-pointer border border-veridian rounded-full w-8 h-8 flex items-center justify-center ${showCyber ? 'text-[var(--color-purple)] bg-[var(--color-purple)]/20' : 'text-muted'}`} title="Cyber Threats">
                <i className="fa-solid fa-shield-halved text-[10px]"></i>
              </button>
              <button onMouseEnter={audio.playHover} onClick={() => { setShowRegions(!showRegions); audio.playClick(); }} className={`p-2 transition-all cursor-pointer border border-veridian rounded-full w-8 h-8 flex items-center justify-center ${showRegions ? 'text-[var(--color-cyan)] bg-[var(--color-cyan)]/20' : 'text-muted'}`} title="Regions">
                <i className="fa-solid fa-chart-pie text-[10px]"></i>
              </button>
              <button onMouseEnter={audio.playHover} onClick={() => { setShowHeatmap(!showHeatmap); audio.playClick(); }} className={`p-2 transition-all cursor-pointer border border-veridian rounded-full w-8 h-8 flex items-center justify-center ${showHeatmap ? 'text-[#ff4500] bg-[#ff4500]/20' : 'text-muted'}`} title="Threat Heatmap">
                <i className="fa-solid fa-fire-flame-curved text-[10px]"></i>
              </button>
            </div>

            {/* HIDE PANELS TOGGLE */}
            <button 
              onMouseEnter={audio.playHover}
              onClick={() => { 
                if (leftPanelVisible || rightPanelVisible) {
                  setLeftPanelVisible(false);
                  setRightPanelVisible(false);
                } else {
                  setLeftPanelVisible(true);
                  setRightPanelVisible(true);
                }
                audio.playClick(); 
              }} 
              className={`p-2 transition-all cursor-pointer border border-veridian rounded-full w-8 h-8 flex items-center justify-center ml-2 ${(!leftPanelVisible && !rightPanelVisible) ? 'text-[var(--color-gold)] bg-[var(--color-gold)]/20' : 'text-muted'}`} 
              title={(leftPanelVisible || rightPanelVisible) ? "Hide Intel Panels" : "Show Intel Panels"}
            >
              <i className={`fa-solid ${(leftPanelVisible || rightPanelVisible) ? 'fa-eye-slash' : 'fa-eye'} text-[10px]`}></i>
            </button>
          </div>
        </div>
      </div>

      {/* Globe / Map */}
      <div id="tactical-map-container" className="absolute inset-0 z-0 bg-[#060B14]">
        <ErrorBoundary name="Tactical Map">
        {viewMode === 'globe' ? (
          <Globe 
            events={filteredEvents} 
            flights={filteredFlights} 
            cyber={cyber} 
            showFlights={showFlights} 
            showCyber={showCyber} 
            showHeatmap={showHeatmap}
            onCountryClick={handleCountryClick} 
            flyToTarget={flyToTarget} 
          />
        ) : (
          <Map2D 
            events={filteredEvents} 
            flights={filteredFlights}
            showFlights={showFlights}
            onCountryClick={handleCountryClick} 
          />
        )}
        </ErrorBoundary>
      </div>

      {/* Region Panel Overlay */}
      {showRegions && (
        <div className="absolute bottom-36 left-4 right-4 z-20 pointer-events-auto animate-fade-in-up">
          <RegionPanel events={filteredEvents} onRegionClick={handleRegionClick} aiRegions={aiRegions} />
        </div>
      )}

      {/* Tension Chart Overlay */}
      <TensionChart events={filteredEvents} news={news} />

      {/* Military Flight Console */}
      {showFlights && (
        <FlightConsole 
          flights={flights} 
          activeCategory={flightCategory} 
          onCategoryChange={setFlightCategory} 
        />
      )}



      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
        <div className="bg-[#060B14]/80 backdrop-blur-xl border border-white/5 py-2 px-3 flex items-center gap-4 text-[9px] uppercase tracking-tighter font-mono rounded-sm pointer-events-auto">
          <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span><span className="text-white/60">Critical</span></div>
          <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span><span className="text-white/60">High</span></div>
          <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span><span className="text-white/60">Medium</span></div>
          <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span className="text-white/60">Low</span></div>
        </div>
      </div>
    </div>
  );
}
