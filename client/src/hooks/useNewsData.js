import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function useNewsData() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = useCallback(async () => {
    try {
      const res = await axios.get('/api/news');
      setNews(res.data || []);
    } catch (err) {
      console.warn('News fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  return { news, loading, refetch: fetchNews };
}
