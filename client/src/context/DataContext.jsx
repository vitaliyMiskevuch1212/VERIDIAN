import React, { createContext, useContext, useMemo } from 'react';
import useGlobeData from '../hooks/useGlobeData';
import useNewsData from '../hooks/useNewsData';
import useFinanceData from '../hooks/useFinanceData';
import useAIData from '../hooks/useAIData';
import useSocket from '../hooks/useSocket';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { events, flights, vessels, cyber, loading: globeLoading } = useGlobeData();
  const { news, loading: newsLoading } = useNewsData();
  const { quote, signal, overview, predictions, loading: financeLoading, fetchQuote, fetchSignal, fetchOverview, fetchPredictions } = useFinanceData();
  const { sitrep, regions: aiRegions, sitrepLoading, regionsLoading } = useAIData();
  const { isConnected, serverClients, onEvent } = useSocket();

  const value = useMemo(() => ({
    // Globe Data
    events, flights, vessels, cyber, globeLoading,
    
    // News Data
    news, newsLoading,
    
    // Finance Data
    quote, signal, overview, predictions, financeLoading, fetchQuote, fetchSignal, fetchOverview, fetchPredictions,
    
    // AI / Sitrep Data
    sitrep, aiRegions, sitrepLoading, regionsLoading,
    
    // WebSocket
    isConnected, serverClients, onEvent
  }), [
    events, flights, vessels, cyber, globeLoading,
    news, newsLoading,
    quote, signal, overview, predictions, financeLoading, fetchQuote, fetchSignal, fetchOverview, fetchPredictions,
    sitrep, aiRegions, sitrepLoading, regionsLoading,
    isConnected, serverClients, onEvent
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
}
