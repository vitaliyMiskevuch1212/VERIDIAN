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
// ─── Single Toast Component ─────────────────────────────────
function Toast({ id, type, title, subtitle, onDismiss, index }) {
  const config = TOAST_CONFIG[type] || TOAST_CONFIG.INFO;
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  const handleDismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(id), 300);
  }, [id, onDismiss]);

  useEffect(() => {
    timerRef.current = setTimeout(handleDismiss, config.duration);
    return () => clearTimeout(timerRef.current);
  }, [config.duration, handleDismiss]);

  // Pause timer on hover
  const handleMouseEnter = () => clearTimeout(timerRef.current);
  const handleMouseLeave = () => {
    timerRef.current = setTimeout(handleDismiss, 3000);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="pointer-events-auto"
      style={{
        animation: exiting
          ? 'toastSlideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          : 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        marginBottom: 8,
        transform: `translateX(0) scale(${1 - index * 0.02})`,
        opacity: 1 - index * 0.1,
        zIndex: 100 - index,
      }}
    >
      <div
        className="relative overflow-hidden rounded-sm backdrop-blur-xl"
        style={{
          background: `linear-gradient(135deg, ${config.bgFrom}, ${config.bgTo})`,
          border: `1px solid ${config.border}`,
          boxShadow: `0 4px 20px ${config.glow}, 0 0 1px ${config.border}`,
          minWidth: 340,
          maxWidth: 420,
        }}
      >
        {/* Progress bar */}
        <div
          className="absolute top-0 left-0 h-[2px]"
          style={{
            background: config.color,
            animation: `toastProgress ${config.duration}ms linear forwards`,
            boxShadow: `0 0 6px ${config.color}`,
          }}
        />

        <div className="flex items-start gap-3 p-3.5">
          {/* Icon */}
          <div
            className="flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center mt-0.5"
            style={{
              background: `${config.color}15`,
              border: `1px solid ${config.color}30`,
            }}
          >
            <i
              className={`fa-solid ${config.icon}`}
              style={{ color: config.color, fontSize: 12 }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[7px] font-bold uppercase tracking-[0.25em] px-1.5 py-0.5 rounded-sm"
                style={{
                  color: config.color,
                  background: `${config.color}15`,
                  border: `1px solid ${config.color}25`,
                }}
              >
                {config.label}
              </span>
              <span className="text-[8px] font-mono text-white/20">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <p className="text-white text-[11px] font-bold leading-tight line-clamp-2 tracking-tight">
              {title}
            </p>
            {subtitle && (
              <p className="text-white/40 text-[9px] mt-1 font-mono uppercase tracking-wider">
                {subtitle}
              </p>
            )}
          </div>

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/20 hover:text-white/60 transition-colors bg-transparent border-none cursor-pointer p-1"
          >
            <i className="fa-solid fa-xmark text-[10px]" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast Provider ──────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback(({ type = 'INFO', title, subtitle }) => {
    const id = ++toastIdRef.current;
    setToasts(prev => {
      const next = [{ id, type, title, subtitle }, ...prev];
      return next.slice(0, MAX_TOASTS);
    });
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, dismissToast }}>
      {children}
      {/* Toast Container - fixed bottom right */}
      <div
        className="fixed top-[220px] right-4 z-[9998] flex flex-col pointer-events-none"
        style={{ maxHeight: '80vh' }}
      >
        {toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            {...toast}
            index={index}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
