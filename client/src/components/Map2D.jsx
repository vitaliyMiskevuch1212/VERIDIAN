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
