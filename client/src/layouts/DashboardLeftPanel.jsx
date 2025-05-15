import React from "react";
import NewsPanel from "../components/NewsPanel";
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
  } = useUI();

  if (!leftPanelVisible) return null;

  return (
    <div className="w-[340px] flex-shrink-0 bg-gradient-to-b from-[#060B14]/95 to-[#0A0F1E]/95 backdrop-blur-3xl border-r border-white/5 flex flex-col z-40 overflow-hidden animate-fade-in">
      <ErrorBoundary name="Pulse Feed">
        <NewsPanel
          news={news}
          loading={newsLoading}
          activeFilters={activeFilters}
          timeRange={timeRange}
          onSimulate={setWargameEvent}
          onClose={() => setLeftPanelVisible(false)}
        />
      </ErrorBoundary>
    </div>
  );
}
