import React, { useState } from "react";
import NewsPanel from "../components/NewsPanel";
import ChokepointMonitor from "../components/ChokepointMonitor";
import ErrorBoundary from "../components/ErrorBoundary";
import { useData } from "../context/DataContext";
import { useUI } from "../context/UIContext";

export default function DashboardLeftPanel() {
  const { news, newsLoading } = useData();
  const {
    leftPanelVisible,
    setLeftPanelVisible,
    activeFilters,
    timeRange,
    setWargameEvent,
    setFullPageView,
    setFlyToTarget,
  } = useUI();

  const [leftTab, setLeftTab] = useState('intel'); // 'intel' | 'chokepoints'

  if (!leftPanelVisible) return null;

  return (
    <div className="absolute md:relative inset-y-0 left-0 w-[85vw] sm:w-[340px] md:w-[340px] flex-shrink-0 bg-gradient-to-b from-[#040A16]/95 via-[#060C18]/95 to-[#0A1020]/95 backdrop-blur-2xl border-r border-white/[0.05] flex flex-col z-40 overflow-hidden panel-slide-in-left shadow-2xl md:shadow-none">
      {/* Tab Switcher */}
      <div className="flex border-b border-white/[0.06] bg-black/30 flex-shrink-0">
        {[
          { id: 'intel', label: 'Intel Feed', icon: 'fa-tower-broadcast' },
          { id: 'chokepoints', label: 'Chokepoints', icon: 'fa-anchor' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setLeftTab(tab.id)}
            className="flex-1 py-3 text-[9px] font-heading uppercase tracking-[0.1em] flex flex-col items-center justify-center gap-1 border-none transition-all cursor-pointer outline-none relative group btn-press"
            style={{
              background: leftTab === tab.id ? 'rgba(0,212,255,0.06)' : 'transparent',
              color: leftTab === tab.id ? 'var(--color-cyan)' : 'var(--color-text-muted)',
            }}>
            <i className={`fa-solid ${tab.icon} text-xs ${leftTab === tab.id ? 'text-[var(--color-cyan)]' : ''}`} />
            <span className="group-hover:text-white transition-colors">{tab.label}</span>
            {leftTab === tab.id && <div className="absolute bottom-0 left-0 right-0 tab-active-indicator" />}
          </button>
        ))}
        {/* Close */}
        <button onClick={() => setLeftPanelVisible(false)}
          className="px-3 py-3 text-white/15 hover:text-[var(--color-red)] transition-all cursor-pointer border-l border-white/[0.06] bg-transparent group outline-none btn-press"
          title="Close Panel">
          <i className="fa-solid fa-xmark text-xs group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ErrorBoundary name="Left Panel Content">
          {leftTab === 'intel' && (
            <NewsPanel
              news={news}
              loading={newsLoading}
              activeFilters={activeFilters}
              timeRange={timeRange}
              onSimulate={setWargameEvent}
              onExpand={() => setFullPageView("intel")}
              onClose={() => setLeftPanelVisible(false)}
              hideTitle={true}
            />
          )}
          {leftTab === 'chokepoints' && (
            <ChokepointMonitor onFlyTo={setFlyToTarget} />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}
