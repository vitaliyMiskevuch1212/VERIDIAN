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
  
  // Signal + Satellite arcs + selected flight route
  const arcsData = useMemo(() => {
    const signalArcs = [];
    
    // Connect CRITICAL events to form a 'Global Threat Ring'
    const criticalEvents = events.filter(e => e.severity === 'CRITICAL');
    criticalEvents.forEach((origin, idx) => {
      const target = criticalEvents[(idx + 1) % criticalEvents.length];
      if (target && origin.lat !== target.lat) {
         signalArcs.push({
           startLat: origin.lat,
           startLng: origin.lng,
           endLat: target.lat,
           endLng: target.lng,
           color: ['rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.0)'], 
           label: 'AI CRITICAL CORRELATION',
           stroke: 0.2,
           altitude: 0.3 + Math.random() * 0.15,
           dashAnimateTime: 2500
         });
      }
    });

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

  // Signal + Satellite arcs + selected flight route
  const arcsData = useMemo(() => {
    const signalArcs = [];
    
    // Connect CRITICAL events to form a 'Global Threat Ring'
    const criticalEvents = events.filter(e => e.severity === 'CRITICAL');
    criticalEvents.forEach((origin, idx) => {
      const target = criticalEvents[(idx + 1) % criticalEvents.length];
      if (target && origin.lat !== target.lat) {
         signalArcs.push({
           startLat: origin.lat,
           startLng: origin.lng,
           endLat: target.lat,
           endLng: target.lng,
           color: ['rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.0)'], 
           label: 'AI CRITICAL CORRELATION',
           stroke: 0.2,
           altitude: 0.3 + Math.random() * 0.15,
           dashAnimateTime: 2500
         });
      }
    });

    // Connect HIGH events for density
    const highEvents = events.filter(e => e.severity === 'HIGH').slice(0, 10);
    highEvents.forEach((origin, idx) => {
      const target = highEvents[(idx + 1) % highEvents.length];
      if (target && origin.lat !== target.lat) {
         signalArcs.push({
           startLat: origin.lat,
           startLng: origin.lng,
           endLat: target.lat,
           endLng: target.lng,
           color: ['rgba(249, 115, 22, 0.6)', 'rgba(249, 115, 22, 0.0)'], 
           label: 'AI RISK CORRELATION',
           stroke: 0.15,
           altitude: 0.15 + Math.random() * 0.1,
           dashAnimateTime: 3500
         });
      }
    });
    
    // Satellite Beams
    const satelliteBeams = [];
    criticalEvents.forEach((evt) => {
      const closestSat = ORBITAL_NODES.reduce((prev, curr) => {
        const dPrev = Math.sqrt(Math.pow(prev.lat - evt.lat, 2) + Math.pow(prev.lng - evt.lng, 2));
        const dCurr = Math.sqrt(Math.pow(curr.lat - evt.lat, 2) + Math.pow(curr.lng - evt.lng, 2));
        return dCurr < dPrev ? curr : prev;
      });
      satelliteBeams.push({
        startLat: closestSat.lat,
        startLng: closestSat.lng,
        endLat: evt.lat,
        endLng: evt.lng,
        color: ['rgba(239, 68, 68, 0.0)', 'rgba(239, 68, 68, 0.7)'],
        label: `${closestSat.label} -> INTEL LOCK`,
        stroke: 0.35,
        altitude: 0.4,
        dashAnimateTime: 2000
      });
    });

    // ── Selected Flight Route Arc ──────────────────────────
    const flightRouteArc = [];
    if (selectedFlight && selectedFlight.destLat != null && selectedFlight.destLng != null) {
      const routeColor = selectedFlight.isSurge 
        ? '#EF4444' 
        : selectedFlight.isNearConflict 
          ? '#F97316' 
          : '#00D4FF';

      flightRouteArc.push({
        startLat: selectedFlight.lat,
        startLng: selectedFlight.lng,
        endLat: selectedFlight.destLat,
        endLng: selectedFlight.destLng,
        color: [`${routeColor}`, `${routeColor}44`],
        label: `${selectedFlight.callsign} — PROJECTED ROUTE`,
        stroke: 0.6,
        altitude: 0.06,
        dashAnimateTime: 1500
      });
    }

    // ── Selected Vessel Route Arc ──────────────────────────
    const vesselRouteArc = [];
    if (selectedVessel && selectedVessel.destLat != null && selectedVessel.destLng != null) {
      const routeColor = selectedVessel.isSurge ? '#EF4444' : '#00D4FF';

      vesselRouteArc.push({
        startLat: selectedVessel.lat,
        startLng: selectedVessel.lng,
        endLat: selectedVessel.destLat,
        endLng: selectedVessel.destLng,
        color: [`${routeColor}`, `${routeColor}44`],
        label: `${selectedVessel.callsign} — PROJECTED ROUTE`,
        stroke: 0.6,
        altitude: 0.05,
        dashAnimateTime: 1500
      });
    }

    return [...signalArcs, ...satelliteBeams, ...flightRouteArc, ...vesselRouteArc];
  }, [events, selectedFlight, selectedVessel]);

  const getPolygonColor = useCallback((geo) => {
    const name = geo.properties.NAME || geo.properties.ADMIN || '';
    if (criticalCountries.has(name) || RED_ZONES.includes(name)) return 'rgba(239, 68,68, 0.25)'; 
    if (BLUE_ZONES.includes(name)) return 'rgba(0, 90, 132, 0.25)'; 
    if (ORANGE_ZONES.includes(name)) return 'rgba(166, 113, 32, 0.25)'; 
    return 'rgba(0, 212, 255, 0.05)'; 
  }, [criticalCountries]);

  const allPoints = useMemo(() => [...pointsData, ...cyberPoints], [pointsData, cyberPoints]);

  // Tactical Threat Rings around severe events
  const ringsData = useMemo(() => {
    const liveRings = events
      .filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH')
      .map(e => ({
        lat: e.lat,
        lng: e.lng,
        maxR: e.severity === 'CRITICAL' ? 12 : 6,
        propagationSpeed: e.severity === 'CRITICAL' ? 2 : 1,
        repeatPeriod: e.severity === 'CRITICAL' ? 800 : 1500,
        color: e.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(249, 115, 22, 0.4)'
      }));

    const staticRings = HOT_ZONES.map(z => ({
      lat: z.lat,
      lng: z.lng,
      maxR: z.radius * 2,
      propagationSpeed: 1,
      repeatPeriod: 2000,
      color: 'rgba(239, 68, 68, 0.2)'
    }));

    return [...liveRings, ...staticRings];
  }, [events]);

  // ── HTML Element factory for airplane markers ───────────────
  const createAirplaneElement = useCallback((d) => {
    const el = document.createElement('div');
    el.style.cursor = 'pointer';
    el.style.pointerEvents = 'auto';
    
    // Color based on status
    const color = d.isSurge 
      ? '#EF4444' 
      : d.isNearConflict 
        ? '#F97316' 
        : '#00D4FF';
    
    const glowColor = d.isSurge 
      ? 'rgba(239,68,68,0.6)' 
      : d.isNearConflict 
        ? 'rgba(249,115,22,0.5)' 
        : 'rgba(0,212,255,0.4)';

    el.innerHTML = `
      <div style="
        position: relative;
        width: 22px;
        height: 22px;
        transform: rotate(${d.heading}deg);
        color: ${color};
        filter: drop-shadow(0 0 4px ${glowColor}) drop-shadow(0 0 8px ${glowColor});
        transition: transform 0.3s ease;
      ">
        ${AIRPLANE_SVG}
      </div>
      <div style="
        position: absolute;
        top: 22px;
        left: 50%;
        transform: translateX(-50%);
        white-space: nowrap;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 7px;
        font-weight: 700;
        color: ${color};
        text-shadow: 0 0 3px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.8);
        letter-spacing: 0.05em;
        pointer-events: none;
        text-align: center;
        opacity: 0.85;
      ">${d.callsign}</div>
    `;

    el.title = `${d.callsign} | ${d.aircraftType || 'Tactical'} | ALT ${d.altitude}ft | ${d.velocity}kts | HDG ${d.heading}°`;

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      blockCountryClick.current = true;
      setSelectedFlight(d.flightData);
      if (onFlightClick) onFlightClick(d.flightData);
      setTimeout(() => { blockCountryClick.current = false; }, 200);
    });

    // Hover effects
    el.addEventListener('mouseenter', () => {
      el.firstElementChild.style.filter = `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 16px ${glowColor})`;
      el.firstElementChild.style.transform = `rotate(${d.heading}deg) scale(1.3)`;
    });
    el.addEventListener('mouseleave', () => {
      el.firstElementChild.style.filter = `drop-shadow(0 0 4px ${glowColor}) drop-shadow(0 0 8px ${glowColor})`;
      el.firstElementChild.style.transform = `rotate(${d.heading}deg) scale(1)`;
    });

    return el;
  }, [onFlightClick]);

  // ── HTML Element factory for vessel markers ───────────────
  const createVesselElement = useCallback((d) => {
    const el = document.createElement('div');
    el.style.cursor = 'pointer';
    el.style.pointerEvents = 'auto';
    
    // Color based on status (Neon green = normal maritime, Red = surge)
    const color = d.isSurge ? '#EF4444' : '#00ff7f';
    const glowColor = d.isSurge ? 'rgba(239,68,68,0.6)' : 'rgba(0,255,127,0.4)';

    el.innerHTML = `
      <div style="
        position: relative;
        width: 18px;
        height: 18px;
        transform: rotate(${d.heading}deg);
        color: ${color};
        filter: drop-shadow(0 0 4px ${glowColor}) drop-shadow(0 0 8px ${glowColor});
        transition: transform 0.3s ease;
      ">
        ${VESSEL_SVG}
      </div>
      <div style="
        position: absolute;
        top: 18px;
        left: 50%;
        transform: translateX(-50%);
        white-space: nowrap;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 6px;
        font-weight: 700;
        color: ${color};
        text-shadow: 0 0 3px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,0.8);
        letter-spacing: 0.05em;
        pointer-events: none;
        text-align: center;
        opacity: 0.75;
      ">${d.callsign}</div>
    `;

    el.title = `${d.callsign} | ${d.vesselType || 'Cargo'} | ${Math.round(d.speed)}kts | HDG ${Math.round(d.heading)}°`;

    // Click handler — select vessel + show route arc + open popup
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      blockCountryClick.current = true;
      setSelectedVessel(d.vesselData);
      if (onVesselClick) onVesselClick(d.vesselData);
      setTimeout(() => { blockCountryClick.current = false; }, 200);
    });

    // Hover effects
    el.addEventListener('mouseenter', () => {
      el.firstElementChild.style.filter = `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 16px ${glowColor})`;
      el.firstElementChild.style.transform = `rotate(${d.heading}deg) scale(1.3)`;
    });
    el.addEventListener('mouseleave', () => {
      el.firstElementChild.style.filter = `drop-shadow(0 0 4px ${glowColor}) drop-shadow(0 0 8px ${glowColor})`;
      el.firstElementChild.style.transform = `rotate(${d.heading}deg) scale(1)`;
    });

    return el;
  }, [onVesselClick]);

  // Combined HTML elements render
  const allHtmlElements = useMemo(() => {
    return [...flightMarkersData, ...vesselMarkersData];
  }, [flightMarkersData, vesselMarkersData]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <GlobeGL
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="#00D4FF"
        atmosphereAltitude={0.2}

        // Points layer (events + cyber)
        pointsData={showHeatmap ? [] : allPoints}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={(d) => d.size * 0.05}
        pointRadius={(d) => d.size}
        pointColor="color"
        pointLabel="label"
        pointsMerge={false}

        // Heatmap HexBin Layer
        hexBinPointsData={showHeatmap ? events : []}
        hexBinPointLat="lat"
        hexBinPointLng="lng"
        hexBinPointWeight={(d) => d.severity === 'CRITICAL' ? 10 : d.severity === 'HIGH' ? 5 : 1}
        hexBinResolution={4}
        hexBinMerge={true}
        hexMargin={0.2}
        hexTopColor={(d) => {
          if (d.sumWeight > 15) return 'rgba(239, 68, 68, 0.9)';
          if (d.sumWeight > 5) return 'rgba(249, 115, 22, 0.8)';
          return 'rgba(234, 179, 8, 0.6)';
        }}
        hexSideColor={() => 'rgba(239, 68, 68, 0.1)'}
        hexAltitude={(d) => Math.min(0.2, d.sumWeight * 0.01)}
        hexTransitionDuration={1000}

        // ── Markers (HTML Elements layer) ──────────
        htmlElementsData={allHtmlElements}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={(d) => d.type === 'flight' ? 0.005 : 0.001}
        htmlElement={(d) => d.type === 'flight' ? createAirplaneElement(d) : createVesselElement(d)}

        // Arcs layer (signal + satellite only — NO flight arcs)
        arcsData={arcsData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.5}
        arcDashGap={0.3}
        arcDashAnimateTime={(d) => d.dashAnimateTime || 2000}
        arcAltitude="altitude"
        arcStroke="stroke"
        arcLabel="label"

        // Threat Rings Layer
        ringsData={ringsData}
        ringLat="lat"
        ringLng="lng"
        ringColor="color"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"

        // Interactive Country polygons (Analytical Fills)
        polygonsData={countries.features}
        polygonCapColor={getPolygonColor}
        polygonSideColor={(d) => d === hoveredPolygon ? 'rgba(0, 212, 255, 0.1)' : 'rgba(0, 0, 0, 0)'}
        polygonStrokeColor={(d) => d === hoveredPolygon ? 'rgba(0, 212, 255, 1)' : 'rgba(0, 212, 255, 0.2)'}
        polygonAltitude={(d) => d === hoveredPolygon ? 0.06 : 0.01}
        onPolygonHover={(polygon) => {
           setHoveredPolygon(polygon);
           if (globeRef.current) {
             globeRef.current.controls().autoRotate = !polygon;
           }
         }}
        onPolygonClick={(p) => {
          if (blockCountryClick.current) return;
          const name = p?.properties?.NAME || p?.properties?.ADMIN || '';
          if (name && onCountryClick) onCountryClick(name);
        }}

        // Dimensions
        width={undefined}
        height={undefined}
        animateIn={true}
      />
    </div>
  );
}