import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { COUNTRY_COORDS } from '../utils/geoData';

export default function OmniCommand({ isOpen, onClose, events = [], news = [], onNavigateCountry, onNavigateEvent, onSearchFinance }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [tickerPrice, setTickerPrice] = useState(null);
  const inputRef = useRef(null);

  // Close on Escape, focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
      setTickerPrice(null);
    }
  }, [isOpen]);

  const handleSelect = (item) => {
    if (item.action === 'country' || item.action === 'region') {
      onNavigateCountry(item.data, item.coords);
    } else if (item.action === 'event' || item.action === 'intel') {
      if (item.data.lat && item.data.lng) {
        onNavigateEvent(item.data);
      } else if (item.data.country) {
        onNavigateCountry(item.data.country);
      }
    } else if (item.action === 'finance') {
      onSearchFinance(item.data);
    } else if (item.action === 'sitrep') {
      console.log('Open SITREP');
    }
    
    setQuery('');
    onClose();
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
      if (e.key === 'Enter' && results.length > 0) {
        handleSelect(results[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Live Finance Fetcher
  useEffect(() => {
    const q = query.trim().toUpperCase();
    if (q.length >= 2 && q.length <= 5 && !q.includes(' ')) {
      const controller = new AbortController();
      const timer = setTimeout(async () => {
        try {
          const res = await axios.get(`/api/finance/${q}`, { signal: controller.signal });
          if (res.data && res.data.price) {
            setTickerPrice({ symbol: q, price: res.data.price, change: res.data.change });
          }
        } catch (e) {
          if (e.name !== 'AbortError') setTickerPrice(null);
        }
      }, 300);
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    } else {
      setTickerPrice(null);
    }
  }, [query]);