import React, { useCallback } from 'react';
import CountryBrief from '../components/CountryBrief';
import WargameModal from '../components/WargameModal';
import OmniCommand from '../components/OmniCommand';
import KeyboardShortcuts from '../components/KeyboardShortcuts';
import TargetingCursor from '../components/TargetingCursor';
import PageLoader from '../components/PageLoader';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';

export default function DashboardOverlays({ isInitialLoad, setIsInitialLoad }) {
  const { events, news, fetchQuote } = useData();
  const { 
    selectedCountry, setSelectedCountry,
    wargameEvent, setWargameEvent,
    isOmniOpen, setIsOmniOpen,
    isShortcutsOpen, setIsShortcutsOpen,
    handleCountryClick, setFlyToTarget,
    setActiveTab
  } = useUI();