import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function useGlobeData() {
  const [events, setEvents] = useState([]);
  const [flights, setFlights] = useState([]);
  const [vessels, setVessels] = useState([]);
  const [cyber, setCyber] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await axios.get('/api/events');
      setEvents(res.data || []);
    } catch (err) {
      console.warn('Events fetch failed:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFlights = useCallback(async () => {
    try {
      const res = await axios.get('/api/flights');
      setFlights(res.data || []);
    } catch (err) {
      console.warn('Flights fetch failed:', err.message);
    }
  }, []);

  const fetchVessels = useCallback(async () => {
    try {
      const res = await axios.get('/api/vessels');
      setVessels(res.data || []);
    } catch (err) {
      console.warn('Vessels fetch failed:', err.message);
    }
  }, []);

  const fetchCyber = useCallback(async () => {
    try {
      const res = await axios.get('/api/cyber');
      setCyber(res.data || []);
    } catch (err) {
      console.warn('Cyber fetch failed:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchFlights();
    fetchVessels();
    fetchCyber();

    const evtInterval = setInterval(fetchEvents, 5 * 60 * 1000);
    const fltInterval = setInterval(fetchFlights, 60 * 1000); // 60s
    const vslInterval = setInterval(fetchVessels, 60 * 1000); // 60s
    const cybInterval = setInterval(fetchCyber, 10 * 60 * 1000);

    return () => {
      clearInterval(evtInterval);
      clearInterval(fltInterval);
      clearInterval(vslInterval);
      clearInterval(cybInterval);
    };
  }, [fetchEvents, fetchFlights, fetchVessels, fetchCyber]);

  return { events, flights, vessels, cyber, loading, refetch: fetchEvents };
}
