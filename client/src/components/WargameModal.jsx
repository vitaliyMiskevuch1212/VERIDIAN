import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TerminalLoader from './TerminalLoader';

export default function WargameModal({ event, onClose }) {
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeNode, setActiveNode] = useState(null);

  useEffect(() => {
    if (!event) return;
    setLoading(true);
    axios.post('/api/ai/wargame', {
      eventId: event.id,
      eventTitle: event.title,
      eventCountry: event.country
    })
      .then(res => setSimulation(res.data))
      .catch(err => {
        console.warn('Wargame fetch failed:', err.message);
        // Fallback handled in backend
      })
      .finally(() => setLoading(false));
  }, [event]);