import React, { useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';

const geoUrl = "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson";

// We define our conflict zones to match the specific aesthetic requested
const RED_ZONES = ['Russia', 'Iran', 'Ukraine', 'Israel', 'Palestine', 'Yemen', 'Afghanistan'];
const BLUE_ZONES = ['United States of America', 'China', 'Saudi Arabia', 'Egypt', 'Australia', 'India', 'Japan', 'United Kingdom', 'Germany'];
const ORANGE_ZONES = ['Libya', 'Chad', 'Mali', 'Mexico', 'Venezuela', 'Thailand', 'Myanmar', 'Sudan', 'Somalia', 'Iraq', 'Syria', 'Colombia'];

const SEVERITY_COLORS = {
  CRITICAL: '#EF4444',
  HIGH: '#F97316',
  MEDIUM: '#EAB308',
  LOW: '#00FF88',
};

// Airplane SVG path (compact, points up/north at 0°)
const AIRPLANE_PATH = "M12 2 L10.5 8 L4 11 L4 12.5 L10.5 10.5 L10 18 L7 20 L7 21.5 L12 19.5 L17 21.5 L17 20 L14 18 L13.5 10.5 L20 12.5 L20 11 L13.5 8 Z";
const VESSEL_PATH = "M4 6 L20 6 L20 18 L16 22 L8 22 L4 18 Z";

function getFlightColor(f) {
  if (f.isSurge) return '#EF4444';
  if (f.isNearConflict) return '#F97316';
  return '#00D4FF';
}

function getVesselColor(v) {
  if (v.isSurge) return '#EF4444';
  return '#00ff7f';
}

export default function Map2D({ events = [], flights = [], vessels = [], showFlights = false, showVessels = false, onCountryClick, onFlightClick, onVesselClick }) {
  const getGeographyColor = (geo) => {
    const name = geo.properties.ADMIN || geo.properties.NAME;
    if (RED_ZONES.includes(name)) return "#902828"; 
    if (BLUE_ZONES.includes(name)) return "#005a84"; 
    if (ORANGE_ZONES.includes(name)) return "#a67120"; 
    return "#0b3421"; 
  };
const geographies = useMemo(() => (
    <Geographies geography={geoUrl}>
      {({ geographies: geos }) =>
        geos.map((geo) => (
          <Geography
            key={geo.rsmKey}
            geography={geo}
            fill={getGeographyColor(geo)}
            stroke="rgba(0, 0, 0, 0.6)" 
            strokeWidth={0.3}
            onClick={() => {
              if (onCountryClick) {
                 const name = geo.properties.ADMIN || geo.properties.NAME;
                 onCountryClick(name);
              }
            }}
            style={{
              default: { outline: "none" },
              hover: { fill: "#00d4ff", opacity: 0.8, outline: "none", cursor: "pointer", transition: "all 0.2s" },
              pressed: { outline: "none" },
            }}
          />
        ))
      }
    </Geographies>
  ), [onCountryClick]);

  // Use useMemo to prevent unnecessary calculations on re-renders
  const eventMarkers = useMemo(() => {
    return events.filter(e => e.lat && e.lng).map((evt, i) => (
      <Marker key={`evt-${i}`} coordinates={[evt.lng, evt.lat]}>
        <circle 
          r={evt.severity === 'CRITICAL' ? 6 : evt.severity === 'HIGH' ? 4 : 3} 
          fill={SEVERITY_COLORS[evt.severity] || SEVERITY_COLORS.MEDIUM} 
          className="transition-all duration-300"
          style={{ cursor: 'pointer', filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' }}
        />
      </Marker>
    ));
  }, [events]);

  const flightMarkers = useMemo(() => {
    if (!showFlights) return null;
    return flights.map((f, i) => {
      const color = getFlightColor(f);
      const heading = f.heading ?? 0;
      const glowColor = f.isSurge 
        ? 'rgba(239,68,68,0.5)' 
        : f.isNearConflict 
          ? 'rgba(249,115,22,0.4)' 
          : 'rgba(0,212,255,0.3)';

      return (
        <Marker key={`flight-${i}`} coordinates={[f.lng, f.lat]}>
          <g 
            transform={`rotate(${heading})`} 
            style={{ 
              cursor: 'pointer', 
              filter: `drop-shadow(0 0 3px ${glowColor}) drop-shadow(0 0 6px ${glowColor})`,
              transition: 'filter 0.2s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (onFlightClick) onFlightClick(f);
            }}
          >
            <g transform="translate(-12, -12) scale(1)">
              <path 
                d={AIRPLANE_PATH} 
                fill={color} 
                stroke={color}
                strokeWidth="0.3"
                opacity="0.95"
              />
            </g>
          </g>
          {/* Callsign label */}
          <text 
            y={14} 
            textAnchor="middle" 
            style={{ 
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '6px', 
              fontWeight: 700, 
              fill: color, 
              opacity: 0.7,
              pointerEvents: 'none',
              textShadow: '0 0 3px rgba(0,0,0,0.8)'
            }}
          >
            {f.callsign}
          </text>
          <title>{`${f.callsign} | ${f.aircraftType || 'Tactical'} | ALT ${f.altitude}ft | ${f.velocity}kts | HDG ${heading}°`}</title>
        </Marker>
      );
    });
  }, [flights, showFlights, onFlightClick]);
