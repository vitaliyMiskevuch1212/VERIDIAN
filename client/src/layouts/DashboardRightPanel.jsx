import React, { useCallback } from 'react';
import MarketWatch from '../components/MarketWatch';
import TopKeywords from '../components/TopKeywords';
import NewsPanel from '../components/NewsPanel';
import FinancePanel from '../components/FinancePanel';
import PredictionPanel from '../components/PredictionPanel';
import SitrepPanel from '../components/SitrepPanel';
import ErrorBoundary from '../components/ErrorBoundary';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';

export default function DashboardRightPanel() {
  const { 
    news, newsLoading, 
    quote, signal, overview, predictions, financeLoading, fetchQuote, fetchSignal,
    sitrep, sitrepLoading, 
    events 
  } = useData();
  
  const { 
    panelsVisible, 
    activeTab, 
    setActiveTab, 
    tabBadges, 
    setWargameEvent 
  } = useUI();

  const handleFinanceSearch = useCallback((ticker) => fetchQuote(ticker), [fetchQuote]);
  const handleGetSignal = useCallback((ticker) => {
    const eventTitles = events.slice(0, 5).map(e => e.title);
    const newsTitles = news.slice(0, 5).map(n => n.title);
    fetchSignal(ticker, [...eventTitles, ...newsTitles]);
  }, [fetchSignal, events, news]);

  if (!panelsVisible) return null;

  return (
    <div className="w-[340px] flex-shrink-0 bg-gradient-to-b from-[#060B14]/95 to-[#0A0F1E]/95 backdrop-blur-3xl border-l border-[var(--defcon-border,var(--color-cyan))]/20 panel-glow flex flex-col z-40 overflow-hidden animate-fade-in">
      {/* Tab Header */}
      <div className="flex border-b border-white/5 bg-black/20">
        {[
          { id: 'news', label: 'Intel', icon: 'fa-tower-broadcast' },
          { id: 'finance', label: 'Trade', icon: 'fa-chart-line' },
          { id: 'predictions', label: 'Forecast', icon: 'fa-crystal-ball' },
          { id: 'sitrep', label: 'SITREP', icon: 'fa-shield-halved' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-3 text-[9px] font-heading uppercase tracking-[0.15em] flex flex-col items-center justify-center gap-1.5 border-none transition-all cursor-pointer outline-none relative group"
            style={{ 
              background: activeTab === tab.id ? 'rgba(0,212,255,0.08)' : 'transparent', 
              color: activeTab === tab.id ? (tab.id === 'sitrep' ? 'var(--color-red)' : 'var(--color-cyan)') : 'var(--color-text-muted)',
            }}
          >
            <i className={`fa-solid ${tab.icon} text-xs ${activeTab === tab.id ? (tab.id === 'sitrep' ? 'text-[var(--color-red)]' : 'text-[var(--color-cyan)]') : ''}`}></i>
            <span className="group-hover:text-white transition-colors">{tab.label}</span>
            {tabBadges[tab.id] > 0 && activeTab !== tab.id && (
              <span className="absolute top-1.5 right-2 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[7px] font-bold text-white leading-none"
                style={{ background: tab.id === 'sitrep' ? 'var(--color-red)' : 'var(--color-orange)', boxShadow: `0 0 6px ${tab.id === 'sitrep' ? 'rgba(239,68,68,0.5)' : 'rgba(249,115,22,0.5)'}` }}>
                {tabBadges[tab.id]}
              </span>
            )}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: tab.id === 'sitrep' ? 'var(--color-red)' : 'var(--color-cyan)' }}></div>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <ErrorBoundary name="Intel Panel">
        {activeTab === 'news' && (
          <div>
            {/* Market Watch Section */}
            <div className="border-b border-white/5">
              <MarketWatch overview={overview} />
            </div>
            {/* Top Keywords Section */}
            <div className="border-b border-white/5">
              <TopKeywords news={news} />
            </div>
            {/* MAIN NEWS FEED */}
            <NewsPanel news={news} loading={newsLoading} />
          </div>
        )}
        {activeTab === 'finance' && (
          <FinancePanel quote={quote} signal={signal} overview={overview} loading={financeLoading} onSearch={handleFinanceSearch} onGetSignal={handleGetSignal} />
        )}
        {activeTab === 'predictions' && <PredictionPanel data={predictions} loading={financeLoading} onSimulate={(title) => setWargameEvent({ id: 'PRED-' + Math.floor(Math.random() * 9000), title, country: 'GLOBAL' })} />}
        {activeTab === 'sitrep' && <SitrepPanel data={sitrep} loading={sitrepLoading} />}
        </ErrorBoundary>
      </div>
    </div>
  );
}
