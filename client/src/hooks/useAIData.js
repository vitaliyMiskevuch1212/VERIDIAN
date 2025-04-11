import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function useAIData() {
  const [sitrep, setSitrep] = useState(null);
  const [sitrepLoading, setSitrepLoading] = useState(true);

  const fetchSitrep = useCallback(async () => {
    try {
      setSitrepLoading(true);
      const res = await axios.get('/api/ai/sitrep');
      setSitrep(res.data);
    } catch (err) {
      console.warn('SITREP fetch failed:', err.message);
    } finally {
      setSitrepLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSitrep();

    const sitrepInterval = setInterval(fetchSitrep, 15 * 60 * 1000);
    return () => clearInterval(sitrepInterval);
  }, [fetchSitrep]);

  return { sitrep, sitrepLoading, refetchSitrep: fetchSitrep };
}
