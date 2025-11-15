import React, { useEffect, useState } from 'react';
import useFriday from '../hooks/useFriday';

/**
 * FridayHUD — Floating FRIDAY voice assistant overlay
 *
 * Components:
 * 1. Mic Badge (top-right) — status indicator with glow states
 * 2. Push-to-Talk button — manual activation trigger
 * 3. Subtitle Bar (bottom-center) — shows FRIDAY's speech + user transcript
 */
export default function FridayHUD() {
  const {
    status,
    subtitle,
    transcript,
    isEnabled,
    error,
    toggleFriday,
    pushToTalk,
  } = useFriday();

  const [showWelcome, setShowWelcome] = useState(false);

  // Show welcome message briefly when FRIDAY is first enabled
  useEffect(() => {
    if (isEnabled && status === 'STANDBY') {
      setShowWelcome(true);
      const timer = setTimeout(() => setShowWelcome(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isEnabled]);

  // Status-specific styling
  const statusConfig = {
    OFF: { label: 'FRIDAY OFFLINE', color: '#64748b', glow: 'none', icon: 'fa-microphone-slash' },
    STANDBY: { label: 'FRIDAY STANDBY', color: '#00D4FF', glow: '0 0 12px rgba(0,212,255,0.3)', icon: 'fa-microphone' },
    LISTENING: { label: 'FRIDAY LISTENING', color: '#00D4FF', glow: '0 0 24px rgba(0,212,255,0.6)', icon: 'fa-waveform-lines' },
    PROCESSING: { label: 'FRIDAY THINKING', color: '#F59E0B', glow: '0 0 20px rgba(245,158,11,0.5)', icon: 'fa-brain' },
    SPEAKING: { label: 'FRIDAY SPEAKING', color: '#10B981', glow: '0 0 20px rgba(16,185,129,0.5)', icon: 'fa-volume-high' },
  };

  const cfg = statusConfig[status] || statusConfig.OFF;

  return (
    <>
      {/* ═══ MIC BADGE — top right ═══ */}
      <div className={`friday-badge friday-badge--${status.toLowerCase()}`}
           style={{ '--friday-color': cfg.color, '--friday-glow': cfg.glow }}>
        
        {/* Status dot */}
        <div className="friday-badge__dot" />

        {/* Icon */}
        <i className={`fa-solid ${cfg.icon} friday-badge__icon`} />

        {/* Label */}
        <span className="friday-badge__label">{cfg.label}</span>

        {/* Toggle button */}
        <button
          onClick={toggleFriday}
          className="friday-badge__toggle"
          title={isEnabled ? 'Disable FRIDAY' : 'Enable FRIDAY'}
        >
          <i className={`fa-solid ${isEnabled ? 'fa-power-off' : 'fa-power-off'}`} />
        </button>
      </div>

      {/* ═══ PUSH-TO-TALK BUTTON — below mic badge ═══ */}
      {isEnabled && (
        <button
          onClick={pushToTalk}
          className={`friday-ptt ${status === 'LISTENING' ? 'friday-ptt--active' : ''}`}
          title="Push to Talk (or say 'Hey Friday')"
          disabled={status === 'PROCESSING' || status === 'SPEAKING'}
        >
          <div className="friday-ptt__rings">
            <div className="friday-ptt__ring friday-ptt__ring--1" />
            <div className="friday-ptt__ring friday-ptt__ring--2" />
          </div>
          <i className={`fa-solid ${status === 'LISTENING' ? 'fa-waveform-lines' : 'fa-microphone'}`} />
          <span className="friday-ptt__label">
            {status === 'LISTENING' ? 'LISTENING' : 'PUSH TO TALK'}
          </span>
        </button>
      )}

      {/* ═══ TRANSCRIPT PREVIEW — above subtitle ═══ */}
      {status === 'LISTENING' && transcript && (
        <div className="friday-transcript">
          <i className="fa-solid fa-ear-listen friday-transcript__icon" />
          <span>{transcript}</span>
        </div>
      )}

      {/* ═══ SUBTITLE BAR — bottom center ═══ */}
      {(subtitle || showWelcome) && (
        <div className="friday-subtitle">
          <div className="friday-subtitle__indicator">
            <span className="friday-subtitle__label">FRIDAY</span>
            {status === 'SPEAKING' && (
              <div className="friday-subtitle__waveform">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="friday-subtitle__bar" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}
            {status === 'PROCESSING' && (
              <div className="friday-subtitle__dots">
                <span>.</span><span>.</span><span>.</span>
              </div>
            )}
          </div>
          <span className="friday-subtitle__text">
            {showWelcome && !subtitle
              ? 'FRIDAY online. VERIDIAN systems nominal. Say "Hey Friday" or push to talk.'
              : subtitle}
          </span>
        </div>
      )}

      {/* ═══ ERROR STATE ═══ */}
      {error && (
        <div className="friday-error">
          <i className="fa-solid fa-triangle-exclamation" />
          <span>{error}</span>
        </div>
      )}
    </>
  );
}
