import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import GlobeGL from 'react-globe.gl';

const SEVERITY_COLORS = {
  CRITICAL: '#EF4444',
  HIGH: '#F97316',
  MEDIUM: '#EAB308',
  LOW: '#00FF88',
};

const HOT_ZONES = [
  { lat: 48.3794, lng: 31.1656, radius: 5 },  // Ukraine
  { lat: 31.0461, lng: 34.8516, radius: 4 },  // Israel / Gaza
  { lat: 32.4279, lng: 53.6880, radius: 6 },  // Iran
  { lat: 26.5667, lng: 56.2500, radius: 3 },  // Strait of Hormuz
];

const RED_ZONES = ['Russia', 'Iran', 'Ukraine', 'Israel', 'Palestine', 'Yemen', 'Afghanistan'];
const BLUE_ZONES = ['United States of America', 'China', 'Saudi Arabia', 'Egypt', 'Australia', 'India', 'Japan', 'United Kingdom', 'Germany'];
const ORANGE_ZONES = ['Libya', 'Chad', 'Mali', 'Mexico', 'Venezuela', 'Thailand', 'Myanmar', 'Sudan', 'Somalia', 'Iraq', 'Syria', 'Colombia'];

// Virtual SIGINT Satellites at high altitude
const ORBITAL_NODES = [
  { lat: 40, lng: -100, label: 'SAT-USA-01' },
  { lat: 50, lng: 30, label: 'SAT-EUR-02' },
  { lat: 10, lng: 60, label: 'SAT-ME-03' },
  { lat: 20, lng: 110, label: 'SAT-ASIA-04' },
];

const SEVERITY_SIZE = {
  CRITICAL: 0.15,
  HIGH: 0.1,
  MEDIUM: 0.05,
  LOW: 0.03,
};

// Compact airplane SVG path (pointing north / up)
const AIRPLANE_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
  <path d="M12 2 L10.5 8 L4 11 L4 12.5 L10.5 10.5 L10 18 L7 20 L7 21.5 L12 19.5 L17 21.5 L17 20 L14 18 L13.5 10.5 L20 12.5 L20 11 L13.5 8 Z" fill="currentColor"/>
</svg>`;

// Vessel icon
const VESSEL_SVG = `<i class="fa-solid fa-ship" style="font-size: 14px;"></i>`;

export default function Globe({
  events = [],
  flights = [],
  vessels = [],
  cyber = [],
  showFlights = false,
  showVessels = false,
  showCyber = false,
  showHeatmap = false,
  onCountryClick,
  onFlightClick,
  onVesselClick,
  flyToTarget,
}) {
  const globeRef = useRef();
  const idleTimer = useRef(null);
  const isInteracting = useRef(false);
  const blockCountryClick = useRef(false);
  const [countries, setCountries] = useState({ features: [] });
  const [hoveredPolygon, setHoveredPolygon] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [selectedVessel, setSelectedVessel] = useState(null);

  // Fetch GeoJSON for country borders
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries);
  }, []);

  // Initialize globe settings
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    // Camera position
    globe.pointOfView({ lat: 20, lng: 30, altitude: 2.5 });

    // Auto-rotation
    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;

      // Pause rotation on interaction, resume after 8s
      const onStart = () => {
        isInteracting.current = true;
        controls.autoRotate = false;
        if (idleTimer.current) clearTimeout(idleTimer.current);
      };
      const onEnd = () => {
        isInteracting.current = false;
        idleTimer.current = setTimeout(() => {
          controls.autoRotate = true;
        }, 8000);
      };

      controls.addEventListener('start', onStart);
      controls.addEventListener('end', onEnd);

      return () => {
        controls.removeEventListener('start', onStart);
        controls.removeEventListener('end', onEnd);
        if (idleTimer.current) clearTimeout(idleTimer.current);
      };
    }
  }, []);

  // Fly to target
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !flyToTarget) return;
    globe.pointOfView({ lat: flyToTarget.lat, lng: flyToTarget.lng, altitude: 1.5 }, 1500);
  }, [flyToTarget]);

  // Pre-calculate critical country set for O(1) lookup
  const criticalCountries = useMemo(() => {
    const set = new Set();
    events.forEach(e => {
      if (e.severity === 'CRITICAL' && e.country) set.add(e.country);
    });
    return set;
  }, [events]);

  // Event points
  const pointsData = useMemo(() =>
    events.map((evt, i) => ({
      lat: evt.lat,
      lng: evt.lng,
      size: SEVERITY_SIZE[evt.severity] || 0.4,
      color: SEVERITY_COLORS[evt.severity] || SEVERITY_COLORS.MEDIUM,
      label: evt.title,
      severity: evt.severity,
      id: evt.id || i,
    })),
    [events]
  );

  // Cyber points (purple)
  const cyberPoints = useMemo(() =>
    showCyber ? cyber.map((c, i) => ({
      lat: c.lat,
      lng: c.lng,
      size: c.severity === 'CRITICAL' ? 0.6 : 0.4,
      color: '#7C3AED',
      label: `${c.type.toUpperCase()}: ${c.country}`,
      id: `cyber_${i}`,
    })) : [],
    [cyber, showCyber]
  );

  // ── Flight Airplane Markers (htmlElementsData) ──────────────
  const flightMarkersData = useMemo(() => {
    if (!showFlights) return [];
    return flights.map((f, i) => ({
      lat: f.lat,
      lng: f.lng,
      heading: f.heading ?? 0,
      callsign: f.callsign,
      altitude: f.altitude,
      velocity: f.velocity,
      isSurge: f.isSurge,
      isNearConflict: f.isNearConflict,
      nearConflictZone: f.nearConflictZone,
      aircraftType: f.aircraftType,
      silhouette: f.silhouette,
      flightData: f, // full flight object for click handler
      id: `flight_${f.callsign}_${i}`,
      type: 'flight'
    }));
  }, [flights, showFlights]);

  // ── Vessel Markers (htmlElementsData) ──────────────
  const vesselMarkersData = useMemo(() => {
    if (!showVessels) return [];
    return vessels.slice(0, 60).map((v, i) => ({
      lat: v.lat,
      lng: v.lng,
      heading: v.heading ?? 0,
      callsign: v.callsign,
      altitude: 0,
      speed: v.speed,
      isSurge: v.isSurge,
      vesselType: v.vesselType,
      mmsi: v.mmsi,
      vesselData: v, // full vessel object for click handler
      id: `vessel_${v.mmsi}_${i}`,
      type: 'vessel'
    }));
  }, [vessels, showVessels]);