import React, { useState } from "react";
import FilterBar from "../components/FilterBar";
import Globe from "../components/Globe";
import Map2D from "../components/Map2D";
import RegionPanel from "../components/RegionPanel";
import TensionChart from "../components/TensionChart";
import FlightConsole from "../components/FlightConsole";
import FlightInfoPopup from "../components/FlightInfoPopup";
import VesselConsole from "../components/VesselConsole";
import VesselInfoPopup from "../components/VesselInfoPopup";
import ErrorBoundary from "../components/ErrorBoundary";

// Full Pages
import IntelFullPage from "./IntelFullPage";
import TradeFullPage from "./TradeFullPage";
import ForecastFullPage from "./ForecastFullPage";
import SitrepFullPage from "./SitrepFullPage";
import SignalsFullPage from "./SignalsFullPage";

import { useData } from "../context/DataContext";
import { useUI } from "../context/UIContext";

export default function DashboardCenter() {
  const { flights, cyber, news, aiRegions } = useData();
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const {
    activeFilters,
    handleFilterToggle,
    timeRange,
    setTimeRange,
    viewMode,
    setViewMode,
    showFlights,
    setShowFlights,
    showVessels,
    setShowVessels,
    showCyber,
    setShowCyber,
    showRegions,
    setShowRegions,
    showHeatmap,
    setShowHeatmap,
    showTension,
    setShowTension,
    leftPanelVisible,
    setLeftPanelVisible,
    rightPanelVisible,
    setRightPanelVisible,
    fullPageView,
    setFullPageView,
    audio,
    filteredEvents,
    filteredFlights,
    filteredVessels,
    handleCountryClick,
    flyToTarget,
    handleRegionClick,
    flightCategory,
    setFlightCategory,
    vesselCategory,
    setVesselCategory,
    minTime,
    maxTime,
    scrubTime,
    setScrubTime,
  } = useUI();

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Full Page Overlays */}
      {(fullPageView === "intel" || fullPageView === "news") && (
        <IntelFullPage onClose={() => setFullPageView(null)} />
      )}
      {(fullPageView === "trade" || fullPageView === "finance") && (
        <TradeFullPage onClose={() => setFullPageView(null)} />
      )}
      {(fullPageView === "forecast" || fullPageView === "predictions") && (
        <ForecastFullPage onClose={() => setFullPageView(null)} />
      )}
      {fullPageView === "sitrep" && (
        <SitrepFullPage onClose={() => setFullPageView(null)} />
      )}
      {fullPageView === "signals" && (
        <SignalsFullPage onClose={() => setFullPageView(null)} />
      )}

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
              <button
                onMouseEnter={audio.playHover}
                onClick={() => {
                  setViewMode("globe");
                  audio.playClick();
                }}
                className={`p-1.5 transition-all cursor-pointer border-none rounded-full ${viewMode === "globe" ? "text-[var(--color-cyan)] bg-[var(--color-cyan)]/20" : "text-muted"}`}
                title="3D Globe"
              >
                <i className="fa-solid fa-earth-americas text-sm"></i>
              </button>
              <button
                onMouseEnter={audio.playHover}
                onClick={() => {
                  setViewMode("map2d");
                  audio.playClick();
                }}
                className={`p-1.5 transition-all cursor-pointer border-none rounded-full ${viewMode === "map2d" ? "text-[var(--color-cyan)] bg-[var(--color-cyan)]/20" : "text-muted"}`}
                title="2D Map"
              >
                <i className="fa-solid fa-map text-sm"></i>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onMouseEnter={audio.playHover}
                onClick={() => {
                  setShowFlights(!showFlights);
                  audio.playClick();
                }}
                className={`p-2 transition-all cursor-pointer border border-veridian rounded-full w-8 h-8 flex items-center justify-center ${showFlights ? "text-[var(--color-cyan)] bg-[var(--color-cyan)]/20" : "text-muted"}`}
                title="Military Intelligence"
              >
                <i className="fa-solid fa-fighter-jet text-[10px]"></i>
              </button>
              <button
                onMouseEnter={audio.playHover}
                onClick={() => {
                  setShowVessels(!showVessels);
                  audio.playClick();
                }}
                className={`p-2 transition-all cursor-pointer border border-veridian rounded-full w-8 h-8 flex items-center justify-center ${showVessels ? "text-[#00ff7f] bg-[#00ff7f]/20" : "text-muted"}`}
                title="Maritime Intelligence"
              >
                <i className="fa-solid fa-anchor text-[10px]"></i>
              </button>
              <button
                onMouseEnter={audio.playHover}
                onClick={() => {
                  setShowCyber(!showCyber);
                  audio.playClick();
                }}
                className={`p-2 transition-all cursor-pointer border border-veridian rounded-full w-8 h-8 flex items-center justify-center ${showCyber ? "text-[var(--color-purple)] bg-[var(--color-purple)]/20" : "text-muted"}`}
                title="Cyber Threats"
              >
                <i className="fa-solid fa-shield-halved text-[10px]"></i>
              </button>
              <button
                onMouseEnter={audio.playHover}
                onClick={() => {
                  setShowRegions(!showRegions);
                  audio.playClick();
                }}
                className={`p-2 transition-all cursor-pointer border border-veridian rounded-full w-8 h-8 flex items-center justify-center ${showRegions ? "text-[var(--color-cyan)] bg-[var(--color-cyan)]/20" : "text-muted"}`}
                title="Regions"
              >
                <i className="fa-solid fa-chart-pie text-[10px]"></i>
              </button>
              <button
                onMouseEnter={audio.playHover}
                onClick={() => {
                  setShowHeatmap(!showHeatmap);
                  audio.playClick();
                }}
                className={`p-2 transition-all cursor-pointer border border-veridian rounded-full w-8 h-8 flex items-center justify-center ${showHeatmap ? "text-[#ff4500] bg-[#ff4500]/20" : "text-muted"}`}
                title="Threat Heatmap"
              >
                <i className="fa-solid fa-fire-flame-curved text-[10px]"></i>
              </button>
              <button
                onMouseEnter={audio.playHover}
                onClick={() => {
                  setShowTension(!showTension);
                  audio.playClick();
                }}
                className={`p-2 transition-all cursor-pointer border border-veridian rounded-full w-8 h-8 flex items-center justify-center ${showTension ? "text-[var(--color-yellow)] bg-[var(--color-yellow)]/20" : "text-muted"}`}
                title="Global Tension Index"
              >
                <i className="fa-solid fa-chart-line text-[10px]"></i>
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
              className={`p-2 transition-all cursor-pointer border border-veridian rounded-full w-8 h-8 flex items-center justify-center ml-2 ${!leftPanelVisible && !rightPanelVisible ? "text-[var(--color-gold)] bg-[var(--color-gold)]/20" : "text-muted"}`}
              title={
                leftPanelVisible || rightPanelVisible
                  ? "Hide Intel Panels"
                  : "Show Intel Panels"
              }
            >
              <i
                className={`fa-solid ${leftPanelVisible || rightPanelVisible ? "fa-eye-slash" : "fa-eye"} text-[10px]`}
              ></i>
            </button>
          </div>
        </div>
      </div>

      {/* Globe / Map */}
      <div
        id="tactical-map-container"
        className="absolute inset-0 z-0 bg-[#060B14]"
      >
        <ErrorBoundary name="Tactical Map">
          {viewMode === "globe" ? (
            <Globe
              events={filteredEvents}
              flights={filteredFlights}
              vessels={filteredVessels}
              cyber={cyber}
              showFlights={showFlights}
              showVessels={showVessels}
              showCyber={showCyber}
              showHeatmap={showHeatmap}
              onCountryClick={handleCountryClick}
              onFlightClick={setSelectedFlight}
              onVesselClick={setSelectedVessel}
              flyToTarget={flyToTarget}
            />
          ) : (
            <Map2D
              events={filteredEvents}
              flights={filteredFlights}
              vessels={filteredVessels}
              showFlights={showFlights}
              showVessels={showVessels}
              onCountryClick={handleCountryClick}
              onFlightClick={setSelectedFlight}
              onVesselClick={setSelectedVessel}
            />
          )}
        </ErrorBoundary>
      </div>

      {/* Region Panel Overlay */}
      {showRegions && (
        <div className="absolute bottom-36 left-4 right-4 z-20 pointer-events-auto animate-fade-in-up">
          <RegionPanel
            events={filteredEvents}
            onRegionClick={handleRegionClick}
            aiRegions={aiRegions}
          />
        </div>
      )}

      {/* Tension Chart Overlay */}
      {showTension && <TensionChart events={filteredEvents} news={news} />}

      {/* Military Flight Console */}
      {showFlights && (
        <FlightConsole
          flights={filteredFlights}
          activeCategory={flightCategory}
          onCategoryChange={setFlightCategory}
          onFlyTo={(coords) => handleCountryClick(null, coords)}
        />
      )}

      {/* Maritime Vessel Console */}
      {showVessels && (
        <VesselConsole
          vessels={filteredVessels}
          activeCategory={vesselCategory}
          onCategoryChange={setVesselCategory}
          onFlyTo={(coords) => handleCountryClick(null, coords)}
        />
      )}

      {/* Flight Info Popup — from Globe/Map airplane icon clicks */}
      {selectedFlight && (
        <FlightInfoPopup
          flight={selectedFlight}
          onClose={() => setSelectedFlight(null)}
          onFlyTo={(f) => {
            handleCountryClick(null, { lat: f.lat, lng: f.lng });
            setSelectedFlight(null);
          }}
        />
      )}

      {/* Vessel Info Popup — from Globe/Map vessel icon clicks */}
      {selectedVessel && (
        <VesselInfoPopup
          vessel={selectedVessel}
          onClose={() => setSelectedVessel(null)}
          onFlyTo={(v) => {
            handleCountryClick(null, { lat: v.lat, lng: v.lng });
            setSelectedVessel(null);
          }}
        />
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
        <div className="bg-[#060B14]/80 backdrop-blur-xl border border-white/5 py-2 px-3 flex items-center gap-4 text-[9px] uppercase tracking-tighter font-mono rounded-sm pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            <span className="text-white/60">Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            <span className="text-white/60">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
            <span className="text-white/60">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-white/60">Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}
