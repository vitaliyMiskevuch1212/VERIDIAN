import React from 'react';
import NewsPanel from '../components/NewsPanel';
import ErrorBoundary from '../components/ErrorBoundary';
import { useData } from '../context/DataContext';
import { useUI } from '../context/UIContext';

export default function DashboardLeftPanel() {
  const { news, newsLoading } = useData();
  const { 
    panelsVisible, 
    activeFilters, 
    timeRange, 
    setWargameEvent 
  } = useUI();