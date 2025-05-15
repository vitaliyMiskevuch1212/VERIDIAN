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