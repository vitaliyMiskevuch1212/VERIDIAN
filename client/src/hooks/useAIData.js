import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function useAIData() {
  const [sitrep, setSitrep] = useState(null);
  const [regions, setRegions] = useState([]);
  const [sitrepLoading, setSitrepLoading] = useState(true);
  const [regionsLoading, setRegionsLoading] = useState(true);

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

  const fetchRegions = useCallback(async () => {
    try {
      setRegionsLoading(true);
      const res = await axios.get('/api/ai/regions');
      setRegions(res.data || []);
    } catch (err) {
      console.warn('Regions fetch failed:', err.message);
    } finally {
      setRegionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSitrep();
    fetchRegions();

    const sitrepInterval = setInterval(fetchSitrep, 15 * 60 * 1000);
    const regionsInterval = setInterval(fetchRegions, 5 * 60 * 1000);

    return () => {
      clearInterval(sitrepInterval);
      clearInterval(regionsInterval);
    };
  }, [fetchSitrep, fetchRegions]);

  return { sitrep, regions, sitrepLoading, regionsLoading, refetchSitrep: fetchSitrep, refetchRegions: fetchRegions };
}
