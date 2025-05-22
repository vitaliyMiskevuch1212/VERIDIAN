import { useState, useCallback } from 'react';
import axios from 'axios';

/**
 * useFinanceData
 * Central data hook for VERIDIAN — manages all finance and signal state.
 *
 * State is split into three buckets:
 *  1. Market data  — quote, overview, predictions (REST, Alpha Vantage / internal)
 *  2. AI signals   — manual signal, auto-signals from WebSocket, watchlist
 *  3. Signal history — paginated history + aggregate stats from MongoDB
 */
export default function useFinanceData() {
  // ── Market data ────────────────────────────────────────────────────────────
  const [quote, setQuote] = useState(null);         // single ticker quote: { price, change, ... }
  const [signal, setSignal] = useState(null);       // latest manually-requested AI signal
  const [overview, setOverview] = useState(null);   // market-wide overview snapshot
  const [predictions, setPredictions] = useState(null); // short-term price predictions array
  const [loading, setLoading] = useState(false);    // quote fetch in-flight flag

  // ── Auto-signal pipeline (WebSocket-fed) ───────────────────────────────────
  const [autoSignals, setAutoSignals] = useState([]); // rolling list of event-driven signals (max 50)
  const [watchlist, setWatchlist] = useState(null);   // auto-generated watchlist from signal engine

  // ── Signal history (MongoDB via REST) ─────────────────────────────────────
  const [signalHistory, setSignalHistory] = useState(null); // paginated history response
  const [signalStats, setSignalStats] = useState(null);     // aggregate stats (distribution, avg confidence)
  const [historyLoading, setHistoryLoading] = useState(false); // history/stats fetch in-flight flag

  // ── Fetchers ───────────────────────────────────────────────────────────────

  // GET /api/finance/:ticker — fetch real-time quote for a single ticker
  const fetchQuote = useCallback(async (ticker) => {
    if (!ticker) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/finance/${ticker}`);
      setQuote(res.data);
    } catch (err) {
      console.warn('Quote fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // POST /api/ai/signal — request a manual AI signal for a ticker + event context
  // body: { ticker: string, events: GeopoliticalEvent[] }
  const fetchSignal = useCallback(async (ticker, events) => {
    if (!ticker) return;
    try {
      const res = await axios.post('/api/ai/signal', { ticker, events });
      setSignal(res.data);
    } catch (err) {
      console.warn('Signal fetch failed:', err.message);
    }
  }, []);

  // GET /api/finance — fetch market-wide overview (indices, movers, etc.)
  const fetchOverview = useCallback(async () => {
    try {
      const res = await axios.get('/api/finance');
      setOverview(res.data);
    } catch (err) {
      console.warn('Finance overview failed:', err.message);
    }
  }, []);

  // GET /api/finance/predictions — fetch short-term AI price predictions
  const fetchPredictions = useCallback(async () => {
    try {
      const res = await axios.get('/api/finance/predictions');
      setPredictions(res.data);
    } catch (err) {
      console.warn('Predictions fetch failed:', err.message);
    }
  }, []);

  // GET /api/ai/signals/history — paginated, filterable signal history from MongoDB
  // Supported params: page (int), limit (1–50), type (BUY|SELL|HOLD), trigger (manual|auto)
  const fetchSignalHistory = useCallback(async (params = {}) => {
    setHistoryLoading(true);
    try {
      const query = new URLSearchParams();
      if (params.page)    query.set('page', params.page);
      if (params.limit)   query.set('limit', params.limit);
      if (params.type)    query.set('type', params.type);
      if (params.trigger) query.set('trigger', params.trigger);
      const res = await axios.get(`/api/ai/signals/history?${query.toString()}`);
      setSignalHistory(res.data); // { signals, total, page, limit }
    } catch (err) {
      console.warn('Signal history fetch failed:', err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // GET /api/ai/signals/stats — aggregate stats: distribution, trigger breakdown, avg confidence
  const fetchSignalStats = useCallback(async () => {
    try {
      const res = await axios.get('/api/ai/signals/stats');
      setSignalStats(res.data); // { total, distribution, triggerBreakdown, avgConfidence, recentSignals }
    } catch (err) {
      console.warn('Signal stats fetch failed:', err.message);
    }
  }, []);

  // ── WebSocket handlers ─────────────────────────────────────────────────────

  // Called by Socket.IO listener when the signal engine emits new auto-signals.
  // Prepends incoming signals and caps the list at 50 to avoid unbounded growth.
  const addAutoSignals = useCallback((incoming) => {
    setAutoSignals(prev => [...incoming, ...prev].slice(0, 50));
  }, []);

  // Called by Socket.IO listener when the signal engine pushes a refreshed watchlist.
  const setAutoWatchlist = useCallback((data) => {
    setWatchlist(data);
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    // Market data
    quote, signal, overview, predictions, loading,
    fetchQuote, fetchSignal, fetchOverview, fetchPredictions,
    // Auto-signal pipeline (WebSocket)
    autoSignals, addAutoSignals,
    watchlist, setAutoWatchlist,
    // Signal history (MongoDB)
    signalHistory, signalStats, historyLoading,
    fetchSignalHistory, fetchSignalStats,
  };
}