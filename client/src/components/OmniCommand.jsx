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
  // Compute search results dynamically based on query
  useEffect(() => {
    if (!query.trim()) {
      // Default / empty state suggestions
      setResults([
        { type: 'COMMAND', icon: 'fa-globe', title: 'Open Global SITREP', action: 'sitrep' },
        { type: 'FINANCE', icon: 'fa-chart-line', title: 'Analyze Ticker: LMT', data: 'LMT', action: 'finance' },
        { type: 'REGION', icon: 'fa-map-location-dot', title: 'Fly to Middle East', data: 'iraq', action: 'region' }
      ]);
      setSelectedIndex(0);
      return;
    }

    const q = query.toLowerCase();
    const newResults = [];

    // 1. Check if looks like a Ticker symbol
    if (q.length >= 2 && q.length <= 5 && !q.includes(' ')) {
      const upperQ = q.toUpperCase();
      const hasLivePrice = tickerPrice && tickerPrice.symbol === upperQ;
      
      newResults.push({
        type: 'FINANCE',
        icon: 'fa-chart-line',
        title: hasLivePrice 
          ? `ASSET: ${upperQ} | PRICE: $${tickerPrice.price.toLocaleString()} (${tickerPrice.change >= 0 ? '+' : ''}${tickerPrice.change.toFixed(2)}%)`
          : `Run Financial Analysis on ${upperQ}`,
        data: upperQ,
        action: 'finance',
        isLive: hasLivePrice
      });
    }

    // 2. Search Countries (Unified: Events + GeoData)
    const eventCountries = events.filter(e => e.country).map(e => e.country);
    const allCountries = [...new Set([...eventCountries, ...Object.keys(COUNTRY_COORDS)])];
    
    const matchedCountries = allCountries
      .filter(c => c.toLowerCase().includes(q))
      .sort((a, b) => a.toLowerCase().indexOf(q) - b.toLowerCase().indexOf(q))
      .slice(0, 5);

    matchedCountries.forEach(c => {
      newResults.push({
        type: 'COUNTRY',
        icon: 'fa-flag',
        title: `View Intelligence: ${c}`,
        data: c,
        action: 'country',
        coords: COUNTRY_COORDS[c]
      });
    });

    // 3. Search Events
    const matchedEvents = events.filter(e => e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q))).slice(0, 5);
    matchedEvents.forEach(e => {
      newResults.push({
        type: 'EVENT',
        icon: 'fa-crosshairs',
        severity: e.severity,
        title: e.title,
        data: e,
        action: 'event'
      });
    });

    // 4. Search News
    const matchedNews = news.filter(n => n.title.toLowerCase().includes(q)).slice(0, 5);
    matchedNews.forEach(n => {
      newResults.push({
        type: 'INTEL',
        icon: 'fa-newspaper',
        title: n.title,
        data: n,
        action: 'intel'
      });
    });

    setResults(newResults);
    setSelectedIndex(0);
  }, [query, events, news]);
