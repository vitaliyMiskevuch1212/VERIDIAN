import { useState, useCallback } from "react";
import axios from "axios";

export default function useFinanceData() {
  const [quote, setQuote] = useState(null);
  const [signal, setSignal] = useState(null);
  const [overview, setOverview] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchQuote = useCallback(async (ticker) => {
    if (!ticker) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/finance/${ticker}`);
      setQuote(res.data);
    } catch (err) {
      console.warn("Quote fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSignal = useCallback(async (ticker, events) => {
    if (!ticker) return;
    try {
      const res = await axios.post("/api/ai/signal", { ticker, events });
      setSignal(res.data);
    } catch (err) {
      console.warn("Signal fetch failed:", err.message);
    }
  }, []);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await axios.get("/api/finance");
      setOverview(res.data);
    } catch (err) {
      console.warn("Finance overview failed:", err.message);
    }
  }, []);

  const fetchPredictions = useCallback(async () => {
    try {
      const res = await axios.get("/api/finance/predictions");
      setPredictions(res.data);
    } catch (err) {
      console.warn("Predictions fetch failed:", err.message);
    }
  }, []);

  return {
    quote,
    signal,
    overview,
    predictions,
    loading,
    fetchQuote,
    fetchSignal,
    fetchOverview,
    fetchPredictions,
  };
}
