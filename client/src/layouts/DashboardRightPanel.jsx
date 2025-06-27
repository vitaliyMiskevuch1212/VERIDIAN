import React, { useCallback } from "react";
import MarketWatch from "../components/MarketWatch";
import TopKeywords from "../components/TopKeywords";
import NewsPanel from "../components/NewsPanel";
import FinancePanel from "../components/FinancePanel";
import PredictionPanel from "../components/PredictionPanel";
import SitrepPanel from "../components/SitrepPanel";
import SignalHistoryPanel from "../components/SignalHistoryPanel";
import ErrorBoundary from "../components/ErrorBoundary";
import { useData } from "../context/DataContext";
import { useUI } from "../context/UIContext";

export default function DashboardRightPanel() {
  const {
    news,
    newsLoading,
    quote,
    signal,
    overview,
    predictions,
    financeLoading,
    fetchQuote,
    fetchSignal,
    sitrep,
    sitrepLoading,
    events,
    watchlist,
    signalHistory,
    signalStats,
    historyLoading,
    fetchSignalHistory,
    fetchSignalStats,
  } = useData();

  const {
    rightPanelVisible,
    setRightPanelVisible,
    activeTab,
    setActiveTab,
    tabBadges,
    setWargameEvent,
    setUnviewedSignalCount,
    setFullPageView,
  } = useUI();

  const handleFinanceSearch = useCallback(
    (ticker) => fetchQuote(ticker),
    [fetchQuote],
  );
  const handleGetSignal = useCallback(
    (ticker) => {
      const eventTitles = events.slice(0, 5).map((e) => e.title);
      const newsTitles = news.slice(0, 5).map((n) => n.title);
      fetchSignal(ticker, [...eventTitles, ...newsTitles]);
    },
    [fetchSignal, events, news],
  );

  const handleSignalRefresh = useCallback(() => {
    fetchSignalHistory();
    fetchSignalStats();
  }, [fetchSignalHistory, fetchSignalStats]);

  const handleSignalFilterChange = useCallback(
    (filters) => {
      fetchSignalHistory({ type: filters.type, trigger: filters.trigger });
    },
    [fetchSignalHistory],
  );

  const handleSignalsTabClick = useCallback(() => {
    setActiveTab("signals");
    setUnviewedSignalCount(0);
  }, [setActiveTab, setUnviewedSignalCount]);

  if (!rightPanelVisible) return null;

  return (
    <div className="w-[340px] flex-shrink-0 bg-gradient-to-b from-[#070C18]/95 via-[#090E1C]/95 to-[#0C1222]/95 backdrop-blur-2xl border-l border-white/[0.05] flex flex-col z-40 overflow-hidden panel-slide-in-right">
      {/* Tab Header */}
      <div className="flex border-b border-white/[0.06] bg-black/30">
        {[
          { id: "news", label: "Intel", icon: "fa-tower-broadcast" },
          { id: "finance", label: "Trade", icon: "fa-chart-line" },
          { id: "predictions", label: "Forecast", icon: "fa-chart-area" },
          { id: "sitrep", label: "SITREP", icon: "fa-shield-halved" },
          { id: "signals", label: "Signals", icon: "fa-brain" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              tab.id === "signals"
                ? handleSignalsTabClick()
                : setActiveTab(tab.id)
            }
            className="flex-1 py-3.5 text-[9px] font-heading uppercase tracking-[0.1em] flex flex-col items-center justify-center gap-1.5 border-none transition-all cursor-pointer outline-none relative group btn-press"
            style={{
              background:
                activeTab === tab.id ? "rgba(0,212,255,0.06)" : "transparent",
              color:
                activeTab === tab.id
                  ? tab.id === "sitrep"
                    ? "var(--color-red)"
                    : "var(--color-cyan)"
                  : "var(--color-text-muted)",
            }}
          >
            <i
              className={`fa-solid ${tab.icon} text-xs ${activeTab === tab.id ? (tab.id === "sitrep" ? "text-[var(--color-red)]" : "text-[var(--color-cyan)]") : ""}`}
            ></i>
            <span className="group-hover:text-white transition-colors">
              {tab.label}
            </span>
            {tabBadges[tab.id] > 0 && activeTab !== tab.id && (
              <span
                className="absolute top-1.5 right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[7px] font-bold text-white leading-none"
                style={{
                  background:
                    tab.id === "sitrep"
                      ? "var(--color-red)"
                      : tab.id === "signals"
                        ? "var(--color-cyan)"
                        : "var(--color-orange)",
                  boxShadow: `0 0 8px ${tab.id === "sitrep" ? "rgba(239,68,68,0.5)" : tab.id === "signals" ? "rgba(0,212,255,0.5)" : "rgba(249,115,22,0.5)"}`,
                }}
              >
                {tabBadges[tab.id]}
              </span>
            )}
            {/* Glowing tab indicator */}
            {activeTab === tab.id && (
              <div
                className={`absolute bottom-0 left-0 right-0 ${tab.id === "sitrep" ? "tab-active-indicator-red" : "tab-active-indicator"}`}
              ></div>
            )}
          </button>
        ))}
        {/* Full Page Button */}
        <button
          onClick={() => setFullPageView(activeTab)}
          className="px-2.5 py-3.5 text-white/15 hover:text-[var(--color-cyan)] transition-all cursor-pointer border-l border-white/[0.06] bg-transparent group outline-none btn-press"
          title="Open Full Page View"
        >
          <i className="fa-solid fa-expand text-xs group-hover:scale-110 transition-transform"></i>
        </button>
        {/* Close Button */}
        <button
          onClick={() => setRightPanelVisible(false)}
          className="px-3 py-3.5 text-white/15 hover:text-[var(--color-red)] transition-all cursor-pointer border-l border-white/[0.06] bg-transparent group outline-none btn-press"
          title="Close Panel"
        >
          <i className="fa-solid fa-xmark text-xs group-hover:scale-110 transition-transform"></i>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <ErrorBoundary name="Intel Panel">
          {activeTab === "news" && (
            <div>
              <div className="border-b border-white/[0.05]">
                <MarketWatch overview={overview} />
              </div>
              <div className="border-b border-white/[0.05]">
                <TopKeywords news={news} />
              </div>
              <NewsPanel
                news={news}
                loading={newsLoading}
                onClose={() => setRightPanelVisible(false)}
                hideTitle={true}
              />
            </div>
          )}
          {activeTab === "finance" && (
            <FinancePanel
              quote={quote}
              signal={signal}
              overview={overview}
              loading={financeLoading}
              onSearch={handleFinanceSearch}
              onGetSignal={handleGetSignal}
              watchlist={watchlist}
            />
          )}
          {activeTab === "predictions" && (
            <PredictionPanel
              data={predictions}
              loading={financeLoading}
              onSimulate={(title) =>
                setWargameEvent({
                  id: "PRED-" + Math.floor(Math.random() * 9000),
                  title,
                  country: "GLOBAL",
                })
              }
            />
          )}
          {activeTab === "sitrep" && (
            <SitrepPanel data={sitrep} loading={sitrepLoading} />
          )}
          {activeTab === "signals" && (
            <SignalHistoryPanel
              data={signalHistory}
              stats={signalStats}
              loading={historyLoading}
              onRefresh={handleSignalRefresh}
              onFilterChange={handleSignalFilterChange}
            />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}
