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