import React, { createContext, useContext, useMemo } from 'react';
import useGlobeData from '../hooks/useGlobeData';
import useNewsData from '../hooks/useNewsData';
import useFinanceData from '../hooks/useFinanceData';
import useAIData from '../hooks/useAIData';
import useSocket from '../hooks/useSocket';

/**
 * DataContext
 * Single source of truth for all domain data in VERIDIAN.
 * Wraps five domain hooks and exposes their state + actions
 * to the entire component tree via a single context value.
 *
 * Consumers should use the useData() hook — never read this context directly.
 */
const DataContext = createContext(null);

/**
 * DataProvider
 * Mount at the app root (or below the router) so every page
 * and panel can access shared state without prop drilling.
 */
export function DataProvider({ children }) {
  // Globe layer — real-time geopolitical events, flight paths, vessel tracks, cyber incidents
  const { events, flights, vessels, cyber, loading: globeLoading } = useGlobeData();

  // News layer — live news feed with loading state
  const { news, loading: newsLoading } = useNewsData();

  // Finance layer — split into three sub-groups:
  //   1. Market data:         quote, signal, overview, predictions + their fetchers
  //   2. Auto-signal pipeline: autoSignals (WebSocket-fed), watchlist
  //   3. Signal history:      paginated history + aggregate stats from MongoDB
  const {
    quote, signal, overview, predictions, loading: financeLoading,
    fetchQuote, fetchSignal, fetchOverview, fetchPredictions,
    // Auto-signal pipeline (populated via WebSocket, not REST)
    autoSignals, addAutoSignals,
    watchlist, setAutoWatchlist,
    // Signal history (fetched from MongoDB via REST)
    signalHistory, signalStats, historyLoading,
    fetchSignalHistory, fetchSignalStats,
  } = useFinanceData();

  // AI layer — situation report (sitrep) and regional intelligence summaries
  const { sitrep, regions: aiRegions, sitrepLoading, regionsLoading } = useAIData();

  // WebSocket layer — connection status, connected client count, event subscription helper
  const { isConnected, serverClients, onEvent } = useSocket();

  /**
   * Memoized context value.
   * useMemo ensures the value object reference stays stable across renders
   * so consumers only re-render when a piece of data they actually use changes,
   * not on every DataProvider render.
   */
  const value = useMemo(() => ({
    // ── Globe data ─────────────────────────────────────────────────────────
    events, flights, vessels, cyber, globeLoading,

    // ── News data ──────────────────────────────────────────────────────────
    news, newsLoading,

    // ── Finance data ───────────────────────────────────────────────────────
    quote, signal, overview, predictions, financeLoading,
    fetchQuote, fetchSignal, fetchOverview, fetchPredictions,

    // ── Auto-signal pipeline (WebSocket) ───────────────────────────────────
    autoSignals, addAutoSignals,
    watchlist, setAutoWatchlist,

    // ── Signal history (MongoDB) ───────────────────────────────────────────
    signalHistory, signalStats, historyLoading,
    fetchSignalHistory, fetchSignalStats,

    // ── AI / Sitrep data ───────────────────────────────────────────────────
    sitrep, aiRegions, sitrepLoading, regionsLoading,

    // ── WebSocket ──────────────────────────────────────────────────────────
    isConnected, serverClients, onEvent
  }), [
    events, flights, vessels, cyber, globeLoading,
    news, newsLoading,
    quote, signal, overview, predictions, financeLoading, fetchQuote, fetchSignal, fetchOverview, fetchPredictions,
    autoSignals, addAutoSignals, watchlist, setAutoWatchlist,
    signalHistory, signalStats, historyLoading, fetchSignalHistory, fetchSignalStats,
    sitrep, aiRegions, sitrepLoading, regionsLoading,
    isConnected, serverClients, onEvent
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

/**
 * useData()
 * Convenience hook for consuming the DataContext.
 * Throws a descriptive error if called outside a DataProvider —
 * catches misuse early instead of silently returning null.
 */
export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
}