import { useState, useCallback } from 'react';
import axios from 'axios';

export default function useFinanceData() {
  const [quote, setQuote] = useState(null);
  const [signal, setSignal] = useState(null);
  const [overview, setOverview] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);