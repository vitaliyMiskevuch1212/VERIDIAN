import { useState, useCallback } from 'react';
import axios from 'axios';

export default function useFinanceData() {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);

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

  return { quote, loading, fetchQuote };
}