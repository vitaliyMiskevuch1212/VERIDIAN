import React, { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';

// ─── Toast Context ───────────────────────────────────────────
const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

// ─── Toast Types & Config ────────────────────────────────────
const TOAST_CONFIG = {
  CRITICAL: {
    icon: 'fa-triangle-exclamation',
    label: 'CRITICAL ALERT',
    color: 'var(--color-red)',
    bgFrom: 'rgba(239, 68, 68, 0.15)',
    bgTo: 'rgba(239, 68, 68, 0.05)',
    border: 'rgba(239, 68, 68, 0.4)',
    glow: 'rgba(239, 68, 68, 0.15)',
    duration: 8000,
  },
  HIGH: {
    icon: 'fa-bolt',
    label: 'HIGH SEVERITY',
    color: 'var(--color-orange)',
    bgFrom: 'rgba(249, 115, 22, 0.15)',
    bgTo: 'rgba(249, 115, 22, 0.05)',
    border: 'rgba(249, 115, 22, 0.3)',
    glow: 'rgba(249, 115, 22, 0.1)',
    duration: 6000,
  },
  BREAKING: {
    icon: 'fa-tower-broadcast',
    label: 'BREAKING',
    color: 'var(--color-red)',
    bgFrom: 'rgba(239, 68, 68, 0.2)',
    bgTo: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.5)',
    glow: 'rgba(239, 68, 68, 0.2)',
    duration: 10000,
  },
  SURGE: {
    icon: 'fa-chart-line',
    label: 'MARKET SURGE',
    color: 'var(--color-green)',
    bgFrom: 'rgba(0, 255, 136, 0.15)',
    bgTo: 'rgba(0, 255, 136, 0.05)',
    border: 'rgba(0, 255, 136, 0.3)',
    glow: 'rgba(0, 255, 136, 0.1)',
    duration: 6000,
  },
  INFO: {
    icon: 'fa-satellite-dish',
    label: 'INTEL UPDATE',
    color: 'var(--color-cyan)',
    bgFrom: 'rgba(0, 212, 255, 0.12)',
    bgTo: 'rgba(0, 212, 255, 0.04)',
    border: 'rgba(0, 212, 255, 0.25)',
    glow: 'rgba(0, 212, 255, 0.08)',
    duration: 5000,
  },
};

const MAX_TOASTS = 5;
