/**
 * CountryBrief.jsx
 *
 * A slide-in intelligence panel that renders a detailed geopolitical brief
 * for a selected country. Fetches AI-generated analysis from the backend,
 * displays stability scores, risk factors, military/economic/diplomatic
 * assessments, and optionally renders live asset charts for affected stocks.
 *
 * @component
 * @param {Object}   props
 * @param {string}   props.country  - Display name of the country to analyse (e.g. "Ukraine")
 * @param {Function} props.onClose  - Callback invoked when the user dismisses the panel
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FlagIcon from './FlagIcon';
import TerminalLoader from './TerminalLoader';
import RedactedText from './RedactedText';
import ScrambleText from './ScrambleText';
import DroneFeed from './DroneFeed';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import MarketGraph from './MarketGraph';
import { exportBrief, copyToClipboard, downloadReport } from '../utils/exportReport';
import ExportButton from './ExportButton';

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

/**
 * Maps a numeric stability score (0–100) to a semantic CSS colour variable.
 *  ≥ 75  → green  (stable)
 *  ≥ 50  → yellow (cautionary)
 *  ≥ 25  → orange (elevated risk)
 *  < 25  → red    (crisis)
 *
 * @param {number} score - Stability score returned by the AI brief API
 * @returns {string} A CSS `var(--color-*)` reference
 */
function getScoreColor(score) {
  if (score >= 75) return 'var(--color-green)';
  if (score >= 50) return 'var(--color-yellow)';
  if (score >= 25) return 'var(--color-orange)';
  return 'var(--color-red)';
}

// ---------------------------------------------------------------------------
// Static data maps
// ---------------------------------------------------------------------------

/**
 * Maps each outlook label returned by the API to a Font Awesome icon class.
 * Used to render a small icon next to the outlook badge.
 */
const OUTLOOK_ICONS = {
  Stable: 'fa-solid fa-shield-check',
  Deteriorating: 'fa-solid fa-chart-line',
  Escalating: 'fa-solid fa-arrow-trend-up',
  Crisis: 'fa-solid fa-triangle-exclamation',
};

/**
 * Colour coding for risk severity levels.
 * Maps the severity string from the API to a CSS variable for the dot indicator.
 */
const RISK_SEVERITY_COLORS = {
  CRITICAL: 'var(--color-red)',
  HIGH: 'var(--color-orange)',
  MEDIUM: 'var(--color-yellow)',
  LOW: 'var(--color-green)',
};

/**
 * Lookup table: country display name → ISO 3166-1 alpha-2 code.
 * Used by <FlagIcon> to resolve the correct flag image.
 * Extend this map whenever new countries are added to the globe dataset.
 */
const COUNTRY_ISO2 = {
  'United States': 'us', 'United States of America': 'us', 'China': 'cn', 'Russia': 'ru', 'India': 'in', 'Brazil': 'br',
  'United Kingdom': 'gb', 'France': 'fr', 'Germany': 'de', 'Japan': 'jp', 'South Korea': 'kr',
  'Turkey': 'tr', 'Iran': 'ir', 'Iraq': 'iq', 'Syria': 'sy', 'Israel': 'il',
  'Saudi Arabia': 'sa', 'Egypt': 'eg', 'Nigeria': 'ng', 'Pakistan': 'pk', 'Afghanistan': 'af',
  'Ukraine': 'ua', 'Poland': 'pl', 'Taiwan': 'tw', 'Indonesia': 'id', 'Philippines': 'ph',
  'Mexico': 'mx', 'Argentina': 'ar', 'Colombia': 'co', 'Venezuela': 've', 'Lebanon': 'lb',
  'Sudan': 'sd', 'Somalia': 'so', 'DR Congo': 'cd', 'Bangladesh': 'bd', 'UAE': 'ae',
  'Greece': 'gr', 'Australia': 'au', 'Canada': 'ca', 'Spain': 'es', 'Italy': 'it',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * SectionHeader
 *
 * A compact, all-caps label row used to visually separate content blocks
 * within the panel. Renders a tiny Font Awesome icon followed by a title.
 *
 * @param {Object} props
 * @param {string} props.icon      - Full Font Awesome class string (e.g. "fa-solid fa-shield-halved")
 * @param {string} [props.iconColor] - Optional CSS colour for the icon; defaults to cyan
 * @param {string} props.title     - Text label displayed next to the icon
 */
const SectionHeader = ({ icon, iconColor, title }) => (
  <div className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
    <i className={`${icon} text-[8px]`} style={{ color: iconColor || 'var(--color-cyan)' }}></i> {title}
  </div>
);

// ---------------------------------------------------------------------------
// Tab configuration
// ---------------------------------------------------------------------------

/**
 * Navigation tabs shown beneath the panel header.
 * Each entry maps a section `id` (used in `activeSection` state) to a human
 * label and a Font Awesome icon.
 */
const SECTIONS = [
  { id: 'overview',   label: 'Overview',   icon: 'fa-eye' },
  { id: 'military',   label: 'Military',   icon: 'fa-jet-fighter' },
  { id: 'economic',   label: 'Economic',   icon: 'fa-chart-line' },
  { id: 'diplomatic', label: 'Diplomatic', icon: 'fa-handshake' },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CountryBrief({ country, onClose }) {
  // The full brief payload returned by the AI API, or null while loading
  const [brief, setBrief] = useState(null);

  // True while an API request is in-flight
  const [loading, setLoading] = useState(true);

  // Index of the stock ticker currently displayed in the MarketGraph panel
  const [selectedStockIdx, setSelectedStockIdx] = useState(0);

  // Which tab the user has selected: 'overview' | 'military' | 'economic' | 'diplomatic'
  const [activeSection, setActiveSection] = useState('overview');

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  /**
   * Re-fetch the AI brief whenever the selected country changes.
   * Resets all local state first to avoid stale data leaking between renders.
   *
   * On failure, falls back to a safe demo object so the panel still renders
   * with placeholder content rather than crashing.
   */
  useEffect(() => {
    if (!country) return;

    // Reset state for the incoming country
    setLoading(true);
    setBrief(null);
    setSelectedStockIdx(0);
    setActiveSection('overview');

    axios.post('/api/ai/brief', { country, headlines: [] })
      .then(res => setBrief(res.data))
      .catch(err => {
        console.warn('Brief fetch failed:', err.message);

        // Demo/fallback brief – shown when API keys are not configured or the
        // request fails for any other reason.
        setBrief({
          countryName: country,
          briefText: 'Intelligence assessment unavailable. Connect API keys for live AI analysis.',
          stabilityScore: 50,
          topRisks: [{ risk: 'Data unavailable', severity: 'LOW' }],
          outlook: 'Stable',
          keyActors: [],
          escalationFactors: [],
          deescalationFactors: [],
          economicImpact: '',
          militaryPosture: '',
          diplomaticStatus: '',
          humanitarianConcerns: '',
          sourceHeadlines: [],
          topStocks: [],
          affectedSectors: [],
          historicalParallel: '',
          confidenceLevel: 0,
          demo: true, // flag that controls the demo-mode banner
        });
      })
      .finally(() => setLoading(false));
  }, [country]);

  // Don't render anything if no country is selected
  if (!country) return null;

  // Resolve the ISO 3166-1 alpha-2 code for the flag component
  const iso2 = COUNTRY_ISO2[country] || '';

  // Shape the stability score into the format expected by Recharts RadialBarChart
  const scoreData = brief
    ? [{ value: brief.stabilityScore, fill: getScoreColor(brief.stabilityScore) }]
    : [];

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Layout decisions
  // -------------------------------------------------------------------------

  /**
   * If the AI returned relevant stock tickers, render the asset-charting
   * column on the right. This widens the panel to accommodate both columns.
   */
  const hasAssets = brief?.topStocks && brief.topStocks.length > 0;
  const panelWidth = hasAssets ? 900 : 420;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      className="slide-in-right panel absolute right-0 top-0 bottom-0 z-40 flex flex-col shadow-2xl"
      style={{
        width: panelWidth,
        maxWidth: '95vw',
        overflow: 'hidden',
        background: 'rgba(10, 15, 25, 0.95)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Panel header: flag, country name, live-data counters, action icons  */}
      {/* ------------------------------------------------------------------ */}
      <div
        className="flex items-center justify-between p-4 bg-black/40 z-10 relative"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          {/* Country flag resolved via ISO-2 code */}
          <FlagIcon iso2={iso2} size={40} />

          <div>
            {/* Country name with scramble-text reveal animation */}
            <h2 className="text-white text-lg font-heading uppercase tracking-widest font-bold">
              <ScrambleText text={country} duration={800} />
            </h2>

            {/* Metadata badges: node type and a pseudo-random GEO-NODE ID */}
            <div className="flex items-center gap-2 mt-1">
              <span className="px-1.5 py-0.5 border border-white/20 bg-white/5 rounded text-[8px] font-mono text-white/50">
                GEO-NODE
              </span>
              <ScrambleText
                text={`ID: ${country.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`}
                className="text-[10px] text-white/40 font-mono tracking-widest"
                duration={1200}
              />
            </div>
          </div>
        </div>

        {/* Right side: live data source counts, copy button, close button */}
        <div className="flex items-center gap-2">
          {/* Show individual source-type counts when live data is available */}
          {brief?.liveDataSources && (
            <div className="flex items-center gap-1.5 text-[8px] font-mono text-white/20 mr-2">
              <span>{brief.liveDataSources.eventsCount}E</span>   {/* Events */}
              <span>{brief.liveDataSources.newsCount}N</span>     {/* News */}
              <span>{brief.liveDataSources.flightsCount}F</span>  {/* Flights */}
              <span>{brief.liveDataSources.cyberCount}C</span>    {/* Cyber signals */}
            </div>
          )}

          {/* Export button */}
          <ExportButton 
            label="" 
            onCopy={() => copyToClipboard(exportBrief(brief))}
            onDownload={() => downloadReport(exportBrief(brief), `veridian-brief-${country.toLowerCase()}.txt`)}
          />

          {/* Dismiss panel */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)' }}
          >
            <i className="fa-solid fa-xmark" style={{ fontSize: 18 }}></i>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section tab bar (hidden while loading)                              */}
      {/* ------------------------------------------------------------------ */}
      {!loading && brief && (
        <div className="flex border-b border-white/5 bg-black/20 px-2">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="px-3 py-2 text-[8px] font-bold uppercase tracking-[0.15em] flex items-center gap-1.5 border-none transition-all cursor-pointer outline-none relative"
              style={{
                background: activeSection === s.id ? 'rgba(0,212,255,0.08)' : 'transparent',
                color: activeSection === s.id ? 'var(--color-cyan)' : 'var(--color-text-muted)',
              }}
            >
              <i className={`fa-solid ${s.icon} text-[8px]`}></i>
              {s.label}

              {/* Active-tab underline indicator */}
              {activeSection === s.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-cyan)]"></div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Scrollable content area                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

        {/* Loading state: terminal-style animated loader */}
        {loading ? (
          <TerminalLoader context={`ANALYZING GEO-POLITICAL NODE: ${country.toUpperCase()}`} />

        ) : brief ? (
          <>
            {/*
              Two-column layout when asset data is present:
              - Left column  : intelligence narrative (always shown)
              - Right column : MarketGraph stock charts (conditional)
            */}
            <div className={`flex flex-1 overflow-hidden h-full ${hasAssets ? 'flex-row' : 'flex-col'}`}>

              {/* ---------------------------------------------------------- */}
              {/* LEFT COLUMN — Intelligence narrative                        */}
              {/* ---------------------------------------------------------- */}
              <div className={`flex flex-col space-y-4 p-2 overflow-y-auto custom-scrollbar ${hasAssets ? 'w-[360px] pr-4 border-r border-border' : 'w-full'}`}>

                {/* Stability score: radial gauge + numeric readout + outlook badge */}
                <div className="flex items-center gap-4">
                  <div style={{ width: 90, height: 90 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        cx="50%" cy="50%"
                        innerRadius="70%" outerRadius="100%"
                        data={scoreData}
                        startAngle={90} endAngle={-270}
                      >
                        <RadialBar
                          dataKey="value"
                          cornerRadius={6}
                          background={{ fill: 'var(--color-surface)' }}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    {/* Large numeric score */}
                    <div
                      className="font-mono-num"
                      style={{ fontSize: 32, fontWeight: 700, color: getScoreColor(brief.stabilityScore) }}
                    >
                      {brief.stabilityScore}
                    </div>
                    <div className="text-muted text-xs">Stability Score</div>

                    {/* Outlook pill badge */}
                    <span className={`outlook-${brief.outlook} px-2 py-0.5 rounded-full text-[9px] font-medium flex items-center gap-1 mt-1 w-fit`}>
                      <i className={OUTLOOK_ICONS[brief.outlook] || 'fa-solid fa-chart-line'} style={{ fontSize: 8 }}></i>
                      {brief.outlook}
                    </span>
                  </div>
                </div>

                {/* -------------------------------------------------------- */}
                {/* OVERVIEW TAB                                              */}
                {/* -------------------------------------------------------- */}
                {activeSection === 'overview' && (
                  <>
                    {/* Top risk items with severity colour coding */}
                    <div>
                      <SectionHeader icon="fa-solid fa-shield-halved" iconColor="var(--color-red)" title="Top Risks" />
                      {(brief.topRisks || []).map((riskItem, i) => {
                        // Normalise: the API may return either a plain string or an object
                        const risk = typeof riskItem === 'string'
                          ? { risk: riskItem, severity: 'MEDIUM' }
                          : riskItem;
                        return (
                          <div key={i} className="flex items-start gap-2 text-[11px] mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                            {/* Severity dot */}
                            <span
                              className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                              style={{ background: RISK_SEVERITY_COLORS[risk.severity] || 'var(--color-yellow)' }}
                            ></span>
                            <span>{risk.risk || risk}</span>
                            {risk.severity && (
                              <span
                                className="text-[7px] font-bold ml-auto flex-shrink-0 mt-0.5"
                                style={{ color: RISK_SEVERITY_COLORS[risk.severity] }}
                              >
                                {risk.severity}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Classified assessment text with redaction effect */}
                    <div>
                      <SectionHeader icon="fa-solid fa-file-lines" title="Classified Assessment" />
                      {brief.briefText?.split('\n').filter(Boolean).map((para, i) => (
                        <p key={i} className="font-medium text-[11px] leading-relaxed mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                          {/* RedactedText randomly obscures words to simulate a classified document */}
                          <RedactedText text={para} frequency={0.6} />
                        </p>
                      ))}
                    </div>

                    {/* Simulated OSINT drone-feed widget */}
                    <div>
                      <SectionHeader icon="fa-solid fa-satellite" iconColor="var(--color-green)" title="Live OSINT Telemetry" />
                      {/*
                        DroneFeed renders an animated surveillance-style feed.
                        lat/lng are repurposed from confidenceLevel/stabilityScore
                        as visual seeds — not actual coordinates.
                      */}
                      <DroneFeed
                        region={country}
                        lat={brief.confidenceLevel || 40.7128}
                        lng={brief.stabilityScore || -74.0060}
                      />
                    </div>

                    {/* Key political/military actors */}
                    {brief.keyActors?.length > 0 && (
                      <div>
                        <SectionHeader icon="fa-solid fa-users" iconColor="var(--color-cyan)" title="Key Actors" />
                        {brief.keyActors.map((actor, i) => (
                          <div key={i} className="flex items-start gap-2 text-[10px] mb-1.5 text-white/60">
                            <i className="fa-solid fa-user-tie text-[8px] text-[var(--color-cyan)] mt-0.5"></i>
                            <span>{actor}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Escalation vs de-escalation factors in a two-column grid */}
                    {(brief.escalationFactors?.length > 0 || brief.deescalationFactors?.length > 0) && (
                      <div className="grid grid-cols-2 gap-3">
                        {brief.escalationFactors?.length > 0 && (
                          <div>
                            <SectionHeader icon="fa-solid fa-arrow-trend-up" iconColor="var(--color-red)" title="Escalation" />
                            {brief.escalationFactors.map((f, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[9px] mb-1.5 text-white/50">
                                <i className="fa-solid fa-caret-up text-[var(--color-red)] mt-0.5" style={{ fontSize: 7 }}></i>
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {brief.deescalationFactors?.length > 0 && (
                          <div>
                            <SectionHeader icon="fa-solid fa-arrow-trend-down" iconColor="var(--color-green)" title="De-escalation" />
                            {brief.deescalationFactors.map((f, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[9px] mb-1.5 text-white/50">
                                <i className="fa-solid fa-caret-down text-[var(--color-green)] mt-0.5" style={{ fontSize: 7 }}></i>
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Historical parallel — contextual analogy from the AI */}
                    {brief.historicalParallel && (
                      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-sm p-3">
                        <SectionHeader icon="fa-solid fa-clock-rotate-left" iconColor="var(--color-gold)" title="Historical Parallel" />
                        <p className="text-[10px] text-white/50 leading-relaxed italic">{brief.historicalParallel}</p>
                      </div>
                    )}
                  </>
                )}

                {/* -------------------------------------------------------- */}
                {/* MILITARY TAB                                              */}
                {/* -------------------------------------------------------- */}
                {activeSection === 'military' && (
                  <>
                    {brief.militaryPosture && (
                      <div>
                        <SectionHeader icon="fa-solid fa-jet-fighter" iconColor="var(--color-red)" title="Military Posture" />
                        <p className="text-[11px] text-white/60 leading-relaxed">{brief.militaryPosture}</p>
                      </div>
                    )}
                    {brief.humanitarianConcerns && (
                      <div>
                        <SectionHeader icon="fa-solid fa-hand-holding-heart" iconColor="var(--color-yellow)" title="Humanitarian Assessment" />
                        <p className="text-[11px] text-white/60 leading-relaxed">{brief.humanitarianConcerns}</p>
                      </div>
                    )}
                  </>
                )}

                {/* -------------------------------------------------------- */}
                {/* ECONOMIC TAB                                              */}
                {/* -------------------------------------------------------- */}
                {activeSection === 'economic' && (
                  <>
                    {brief.economicImpact && (
                      <div>
                        <SectionHeader icon="fa-solid fa-chart-line" iconColor="var(--color-cyan)" title="Economic Impact" />
                        <p className="text-[11px] text-white/60 leading-relaxed">{brief.economicImpact}</p>
                      </div>
                    )}
                    {brief.affectedSectors?.length > 0 && (
                      <div>
                        <SectionHeader icon="fa-solid fa-industry" iconColor="var(--color-gold)" title="Affected Sectors" />
                        {/* Pill tags for each affected industry sector */}
                        <div className="flex flex-wrap gap-1.5">
                          {brief.affectedSectors.map((s, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-sm bg-white/5 border border-white/10 text-white/50"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* -------------------------------------------------------- */}
                {/* DIPLOMATIC TAB                                            */}
                {/* -------------------------------------------------------- */}
                {activeSection === 'diplomatic' && (
                  <>
                    {brief.diplomaticStatus && (
                      <div>
                        <SectionHeader icon="fa-solid fa-handshake" iconColor="var(--color-cyan)" title="Diplomatic Status" />
                        <p className="text-[11px] text-white/60 leading-relaxed">{brief.diplomaticStatus}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Source headlines shown across all tabs */}
                {brief.sourceHeadlines?.length > 0 && (
                  <div>
                    <SectionHeader icon="fa-solid fa-newspaper" title="Source Headlines" />
                    {brief.sourceHeadlines.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px] py-1" style={{ color: 'var(--color-text-muted)' }}>
                        <i className="fa-solid fa-link mt-0.5" style={{ fontSize: 8 }}></i>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ---------------------------------------------------------- */}
              {/* RIGHT COLUMN — Asset / stock chart panel (conditional)      */}
              {/* ---------------------------------------------------------- */}
              {hasAssets && (
                <div className="flex-1 flex flex-col pl-6 pr-2 h-full gap-4">

                  {/* Ticker selector tabs */}
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted uppercase tracking-wider mr-2">
                      <i className="fa-solid fa-shapes"></i> Selected Asset
                    </div>
                    <div
                      className="flex p-1 rounded-lg"
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                    >
                      {brief.topStocks.map((stock, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedStockIdx(idx)}
                          className="px-4 py-1.5 rounded-md text-xs font-mono-num font-bold transition-colors cursor-pointer"
                          style={{
                            background: selectedStockIdx === idx ? 'rgba(0,212,255,0.1)' : 'transparent',
                            color: selectedStockIdx === idx ? 'var(--color-cyan)' : 'var(--color-text-muted)',
                            border: selectedStockIdx === idx ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
                          }}
                        >
                          {stock.ticker}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Market chart for the currently selected ticker */}
                  <div className="flex-1 w-full relative">
                    <MarketGraph
                      stock={brief.topStocks[selectedStockIdx]}
                      stabilityScore={brief.stabilityScore}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Demo-mode banner — only rendered when API keys are not set */}
            {brief.demo && (
              <div
                className="text-xs text-muted text-center py-2 px-3 rounded-lg"
                style={{ background: 'var(--color-surface)' }}
              >
                <i className="fa-solid fa-info-circle"></i> Demo mode — connect API keys for live AI intel
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}