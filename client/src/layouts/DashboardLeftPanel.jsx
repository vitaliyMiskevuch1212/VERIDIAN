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
    setFullPageView,
  } = useUI();

  if (!leftPanelVisible) return null;

  return (
    <div className="w-[340px] flex-shrink-0 bg-gradient-to-b from-[#040A16]/95 via-[#060C18]/95 to-[#0A1020]/95 backdrop-blur-2xl border-r border-white/[0.05] flex flex-col z-40 overflow-hidden panel-slide-in-left">
      <ErrorBoundary name="Pulse Feed">
        <NewsPanel
          news={news}
          loading={newsLoading}
          activeFilters={activeFilters}
          timeRange={timeRange}
          onSimulate={setWargameEvent}
          onExpand={() => setFullPageView("intel")}
          onClose={() => setLeftPanelVisible(false)}
        />
      </ErrorBoundary>
    </div>
  );
}
