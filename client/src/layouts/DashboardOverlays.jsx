import React, { useCallback } from 'react';
import CountryBrief from '../components/CountryBrief';
import WargameModal from '../components/WargameModal';
import OmniCommand from '../components/OmniCommand';
import KeyboardShortcuts from '../components/KeyboardShortcuts';
import TargetingCursor from '../components/TargetingCursor';
import PageLoader from '../components/PageLoader';
import FridayHUD from '../components/FridayHUD';
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

  const handleFinanceSearch = useCallback((ticker) => fetchQuote(ticker), [fetchQuote]);

  return (
    <>
      {/* COUNTRY BRIEF OVERLAY */}
      {selectedCountry && (
        <div className="absolute right-0 top-0 bottom-0 z-50">
           <CountryBrief country={selectedCountry} onClose={() => setSelectedCountry(null)} />
        </div>
      )}

      {/* WARGAME MODAL */}
      {wargameEvent && (
        <WargameModal event={wargameEvent} onClose={() => setWargameEvent(null)} />
      )}

      {/* OMNI COMMAND TERMINAL */}
      <OmniCommand 
        isOpen={isOmniOpen} 
        onClose={() => setIsOmniOpen(false)} 
        events={events} 
        news={news} 
        onNavigateCountry={handleCountryClick} 
        onNavigateEvent={(evt) => setFlyToTarget({ lat: evt.lat, lng: evt.lng })} 
        onSearchFinance={(ticker) => {
          setActiveTab('finance');
          handleFinanceSearch(ticker);
        }} 
      />

      {/* KEYBOARD SHORTCUTS MODAL */}
      <KeyboardShortcuts isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      
      {/* TARGETING CURSOR */}
      <TargetingCursor />

      {/* GLOBAL PAGE LOADER */}
      {isInitialLoad && <PageLoader onComplete={() => setIsInitialLoad(false)} />}

      {/* FRIDAY VOICE ASSISTANT HUD */}
      <FridayHUD />
    </>
  );
}
