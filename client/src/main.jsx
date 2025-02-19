import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import axios from 'axios';
import { ToastProvider } from './components/ToastNotifications';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

// Supress react-globe.gl internal THREE.Clock deprecation warnings
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('THREE.Clock: This module has been deprecated')) return;
  originalError(...args);
};
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('THREE.Clock: This module has been deprecated')) return;
  originalWarn(...args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);
