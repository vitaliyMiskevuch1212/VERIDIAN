import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import GlobeGL from 'react-globe.gl';

// ── Severity color palette — used for event points and arc gradients ──────────
const SEVERITY_COLORS = {
  CRITICAL: '#EF4444', // red
  HIGH: '#F97316',     // orange
  MEDIUM: '#EAB308',   // yellow
  LOW: '#00FF88',      // green
};

// ── Persistent conflict/instability hot zones for static ambient rings ────────
// These always render regardless of live events, providing geopolitical context
const HOT_ZONES = [
  { lat: 48.3794, lng: 31.1656, radius: 5 },  // Ukraine
  { lat: 31.0461, lng: 34.8516, radius: 4 },  // Israel / Gaza
  { lat: 32.4279, lng: 53.6880, radius: 6 },  // Iran
  { lat: 26.5667, lng: 56.2500, radius: 3 },  // Strait of Hormuz
];

// ── Country zone classifications for polygon cap color fills ──────────────────
// Priority order in getPolygonColor: criticalCountries > RED > BLUE > ORANGE > default
const RED_ZONES    = ['Russia', 'Iran', 'Ukraine', 'Israel', 'Palestine', 'Yemen', 'Afghanistan'];
const BLUE_ZONES   = ['United States of America', 'China', 'Saudi Arabia', 'Egypt', 'Australia', 'India', 'Japan', 'United Kingdom', 'Germany'];
const ORANGE_ZONES = ['Libya', 'Chad', 'Mali', 'Mexico', 'Venezuela', 'Thailand', 'Myanmar', 'Sudan', 'Somalia', 'Iraq', 'Syria', 'Colombia'];

// ── Virtual SIGINT satellites — used as beam origins for CRITICAL event intel arcs ──
// Each node is assigned to the geographically nearest CRITICAL event via Euclidean distance
const ORBITAL_NODES = [
  { lat: 40, lng: -100, label: 'SAT-USA-01' },
  { lat: 50, lng: 30,   label: 'SAT-EUR-02' },
  { lat: 10, lng: 60,   label: 'SAT-ME-03'  },
  { lat: 20, lng: 110,  label: 'SAT-ASIA-04' },
];

// ── Point radius mapped to severity — CRITICAL renders largest, LOW smallest ──
const SEVERITY_SIZE = {
  CRITICAL: 0.15,
  HIGH: 0.1,
  MEDIUM: 0.05,
  LOW: 0.03,
};

// ── Inline SVG for airplane marker (north-pointing, rotated per heading in DOM) ──
const AIRPLANE_SVG = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
  <path d="M12 2 L10.5 8 L4 11 L4 12.5 L10.5 10.5 L10 18 L7 20 L7 21.5 L12 19.5 L17 21.5 L17 20 L14 18 L13.5 10.5 L20 12.5 L20 11 L13.5 8 Z" fill="currentColor"/>
</svg>`;

// ── Font Awesome ship icon for vessel markers ─────────────────────────────────
const VESSEL_SVG = `<i class="fa-solid fa-ship" style="font-size: 14px;"></i>`;

export default function Globe({
  events = [],        // Array of threat events: { lat, lng, severity, title, country, id }
  flights = [],       // Array of live flight objects: { lat, lng, heading, callsign, altitude, velocity, isSurge, isNearConflict, ... }
  vessels = [],       // Array of live vessel objects: { lat, lng, heading, callsign, speed, isSurge, vesselType, mmsi, ... }
  cyber = [],         // Array of cyber incident objects: { lat, lng, severity, type, country }
  showFlights = false,  // Toggle flight HTML marker layer
  showVessels = false,  // Toggle vessel HTML marker layer
  showCyber = false,    // Toggle cyber incident point layer (purple)
  showHeatmap = false,  // Toggle hexbin heatmap (replaces point markers when active)
  onCountryClick,     // Callback(countryName: string) fired on polygon click
  onFlightClick,      // Callback(flightData: object) fired on airplane marker click
  onVesselClick,      // Callback(vesselData: object) fired on vessel marker click
  flyToTarget,        // { lat, lng } — triggers animated camera pan/zoom when changed
}) {
  // ── Refs ──────────────────────────────────────────────────────────────────
  const globeRef = useRef();          // Direct handle to GlobeGL instance for controls/camera
  const idleTimer = useRef(null);     // Timeout ID for resuming auto-rotation after 8s idle
  const isInteracting = useRef(false);// Tracks whether user is actively interacting
  // Guard that blocks onPolygonClick from firing within 200ms of a marker click,
  // preventing the country handler from triggering when clicking a flight/vessel marker
  const blockCountryClick = useRef(false);

  // ── State ─────────────────────────────────────────────────────────────────
  const [countries, setCountries] = useState({ features: [] }); // GeoJSON country polygons
  const [hoveredPolygon, setHoveredPolygon] = useState(null);   // Currently hovered country feature
  const [selectedFlight, setSelectedFlight] = useState(null);   // Flight with active route arc
  const [selectedVessel, setSelectedVessel] = useState(null);   // Vessel with active route arc

  // ── Fetch GeoJSON country borders on mount ────────────────────────────────
  // Empty deps: runs once. Populates polygonsData for the country fill layer.
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries);
  }, []);

  // ── Globe initialization: camera + auto-rotation ──────────────────────────
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    // Start camera centered on Eastern Europe / Middle East at comfortable zoom
    globe.pointOfView({ lat: 20, lng: 30, altitude: 2.5 });

    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;   // Slow, ambient rotation
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;     // Smooth deceleration on release

      // Pause auto-rotation while user is interacting (drag/zoom)
      const onStart = () => {
        isInteracting.current = true;
        controls.autoRotate = false;
        if (idleTimer.current) clearTimeout(idleTimer.current);
      };
      // Resume auto-rotation 8 seconds after the user stops interacting
      const onEnd = () => {
        isInteracting.current = false;
        idleTimer.current = setTimeout(() => {
          controls.autoRotate = true;
        }, 8000);
      };

      controls.addEventListener('start', onStart);
      controls.addEventListener('end', onEnd);

      // Cleanup listeners and pending timer on unmount
      return () => {
        controls.removeEventListener('start', onStart);
        controls.removeEventListener('end', onEnd);
        if (idleTimer.current) clearTimeout(idleTimer.current);
      };
    }
  }, []);

  // ── Fly to target: animate camera when flyToTarget prop changes ──────────
  // 1500ms gives a smooth cinematic pan without feeling sluggish
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe || !flyToTarget) return;
    globe.pointOfView({ lat: flyToTarget.lat, lng: flyToTarget.lng, altitude: 1.5 }, 1500);
  }, [flyToTarget]);

  // ── Critical country set for O(1) polygon color lookup ───────────────────
  // Using Set instead of Array.includes() avoids O(n) scans on every polygon render
  const criticalCountries = useMemo(() => {
    const set = new Set();
    events.forEach(e => {
      if (e.severity === 'CRITICAL' && e.country) set.add(e.country);
    });
    return set;
  }, [events]);

  // ── Event point markers ───────────────────────────────────────────────────
  // Maps raw event objects to the shape GlobeGL's pointsData expects
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

  // ── Cyber incident points (purple) ────────────────────────────────────────
  // Short-circuits to [] when showCyber is false to avoid unnecessary mapping
  const cyberPoints = useMemo(() =>
    showCyber ? cyber.map((c, i) => ({
      lat: c.lat,
      lng: c.lng,
      size: c.severity === 'CRITICAL' ? 0.6 : 0.4, // CRITICAL cyber events render larger
      color: '#7C3AED',                              // Purple — distinct from threat severity palette
      label: `${c.type.toUpperCase()}: ${c.country}`,
      id: `cyber_${i}`,
    })) : [],
    [cyber, showCyber]
  );

  // ── Flight marker data ────────────────────────────────────────────────────
  // Shapes flight objects for the HTML elements layer.
  // flightData carries the full original object so click handlers can pass it upstream.
  const flightMarkersData = useMemo(() => {
    if (!showFlights) return []; // Skip mapping entirely when layer is toggled off
    return flights.map((f, i) => ({
      lat: f.lat,
      lng: f.lng,
      heading: f.heading ?? 0,          // Degrees — applied as CSS rotate() in createAirplaneElement
      callsign: f.callsign,
      altitude: f.altitude,
      velocity: f.velocity,
      isSurge: f.isSurge,               // True = anomalous traffic surge → red marker
      isNearConflict: f.isNearConflict, // True = within conflict zone proximity → orange marker
      nearConflictZone: f.nearConflictZone,
      aircraftType: f.aircraftType,
      silhouette: f.silhouette,
      flightData: f,                    // Full object passed to onFlightClick callback
      id: `flight_${f.callsign}_${i}`,
      type: 'flight'                    // Used in allHtmlElements to route to correct factory
    }));
  }, [flights, showFlights]);

  // ── Vessel marker data ────────────────────────────────────────────────────
  // Capped at 60 to maintain frame rate — AIS feeds can return thousands of vessels
  const vesselMarkersData = useMemo(() => {
    if (!showVessels) return [];
    return vessels.slice(0, 60).map((v, i) => ({
      lat: v.lat,
      lng: v.lng,
      heading: v.heading ?? 0,
      callsign: v.callsign,
      altitude: 0,
      speed: v.speed,
      isSurge: v.isSurge,   // True = anomalous vessel traffic → red marker
      vesselType: v.vesselType,
      mmsi: v.mmsi,          // Maritime Mobile Service Identity — unique vessel ID
      vesselData: v,         // Full object passed to onVesselClick callback
      id: `vessel_${v.mmsi}_${i}`,
      type: 'vessel'         // Used in allHtmlElements to route to correct factory
    }));
  }, [vessels, showVessels]);

  // ── Arc layer: threat correlation rings + satellite beams + route arcs ────
  // All arc types are merged into a single array; GlobeGL renders them uniformly.
  // Deps: [events, selectedFlight, selectedVessel] — route arcs change on selection.
  const arcsData = useMemo(() => {
    const signalArcs = [];

    // ── CRITICAL Threat Ring ────────────────────────────────────────────────
    // Chains all CRITICAL events in index order, wrapping last → first (modulo)
    // to form a closed ring. Each arc gets random altitude jitter [0.3, 0.45)
    // to prevent z-fighting when events are geographically close.
    // Note: Math.random() here means altitudes re-randomize on every events change;
    // seed by event ID if stable layout is needed.
    const criticalEvents = events.filter(e => e.severity === 'CRITICAL');
    criticalEvents.forEach((origin, idx) => {
      const target = criticalEvents[(idx + 1) % criticalEvents.length];
      // Guard: skip if lat is identical (same point = degenerate arc / self-loop)
      if (target && origin.lat !== target.lat) {
         signalArcs.push({
           startLat: origin.lat,
           startLng: origin.lng,
           endLat: target.lat,
           endLng: target.lng,
           color: ['rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.0)'], // Red → transparent gradient
           label: 'AI CRITICAL CORRELATION',
           stroke: 0.2,
           altitude: 0.3 + Math.random() * 0.15,
           dashAnimateTime: 2500 // ms — faster pulse = higher urgency
         });
      }
    });

    // ── HIGH Risk Correlation Ring ──────────────────────────────────────────
    // Same chain logic as CRITICAL but capped at 10 events to avoid visual clutter.
    // Lower altitude band (0.15–0.25) keeps HIGH arcs visually beneath CRITICAL arcs.
    const highEvents = events.filter(e => e.severity === 'HIGH').slice(0, 10);
    highEvents.forEach((origin, idx) => {
      const target = highEvents[(idx + 1) % highEvents.length];
      if (target && origin.lat !== target.lat) {
         signalArcs.push({
           startLat: origin.lat,
           startLng: origin.lng,
           endLat: target.lat,
           endLng: target.lng,
           color: ['rgba(249, 115, 22, 0.6)', 'rgba(249, 115, 22, 0.0)'], // Orange → transparent
           label: 'AI RISK CORRELATION',
           stroke: 0.15,
           altitude: 0.15 + Math.random() * 0.1,
           dashAnimateTime: 3500 // Slower than CRITICAL — lower urgency
         });
      }
    });

    // ── Satellite Intelligence Beams ────────────────────────────────────────
    // For each CRITICAL event, find the nearest ORBITAL_NODE via Euclidean distance
    // (approximation — Haversine would be more accurate but overkill at this scale).
    // Arc direction is SAT → EVENT (transparent origin, visible destination)
    // to simulate a downward intelligence lock beam.
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
        color: ['rgba(239, 68, 68, 0.0)', 'rgba(239, 68, 68, 0.7)'], // Transparent → red (downward beam)
        label: `${closestSat.label} -> INTEL LOCK`,
        stroke: 0.35,   // Thicker than signal arcs — satellites are primary intel sources
        altitude: 0.4,  // High altitude to simulate orbital origin
        dashAnimateTime: 2000
      });
    });

    // ── Selected Flight Projected Route Arc ─────────────────────────────────
    // Only renders when a flight with a known destination is selected.
    // Color priority: surge (red) > near-conflict (orange) > normal (cyan)
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
        color: [`${routeColor}`, `${routeColor}44`], // Solid → 27% opacity fade at destination
        label: `${selectedFlight.callsign} — PROJECTED ROUTE`,
        stroke: 0.6,      // Thicker than signal arcs — primary focus element
        altitude: 0.06,   // Low altitude = realistic flight path, not orbital
        dashAnimateTime: 1500
      });
    }

    // ── Selected Vessel Projected Route Arc ─────────────────────────────────
    // Same pattern as flight route arc; vessels are slower so no near-conflict tier
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
        altitude: 0.05, // Slightly lower than flight arcs — maritime routes hug the surface
        dashAnimateTime: 1500
      });
    }

    // Merge all arc types into a single flat array for GlobeGL
    return [...signalArcs, ...satelliteBeams, ...flightRouteArc, ...vesselRouteArc];
  }, [events, selectedFlight, selectedVessel]);

  // ── Polygon cap color by zone classification ──────────────────────────────
  // useCallback because this is passed directly to GlobeGL as a prop function;
  // memoizing avoids unnecessary polygon re-renders when unrelated state changes.
  // criticalCountries is the only dep — static zone arrays never change.
  const getPolygonColor = useCallback((geo) => {
    const name = geo.properties.NAME || geo.properties.ADMIN || '';
    if (criticalCountries.has(name) || RED_ZONES.includes(name)) return 'rgba(239, 68,68, 0.25)';  // Red fill — active conflict
    if (BLUE_ZONES.includes(name)) return 'rgba(0, 90, 132, 0.25)';                                 // Blue fill — strategic partners
    if (ORANGE_ZONES.includes(name)) return 'rgba(166, 113, 32, 0.25)';                             // Orange fill — instability
    return 'rgba(0, 212, 255, 0.05)';                                                               // Default: near-transparent cyan
  }, [criticalCountries]);

  // ── Merged point data (events + cyber) ───────────────────────────────────
  // Single array passed to pointsData so GlobeGL manages one points layer
  const allPoints = useMemo(() => [...pointsData, ...cyberPoints], [pointsData, cyberPoints]);

  // ── Threat rings ──────────────────────────────────────────────────────────
  // Two ring types merged into one array:
  //   liveRings  — driven by real events; pulse speed/size reflects severity
  //   staticRings — always-on ambient rings over HOT_ZONES for geopolitical context
  const ringsData = useMemo(() => {
    const liveRings = events
      .filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH')
      .map(e => ({
        lat: e.lat,
        lng: e.lng,
        maxR: e.severity === 'CRITICAL' ? 12 : 6,             // CRITICAL rings spread farther
        propagationSpeed: e.severity === 'CRITICAL' ? 2 : 1,  // CRITICAL pulses travel faster
        repeatPeriod: e.severity === 'CRITICAL' ? 800 : 1500, // CRITICAL repeats more urgently
        color: e.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(249, 115, 22, 0.4)'
      }));

    const staticRings = HOT_ZONES.map(z => ({
      lat: z.lat,
      lng: z.lng,
      maxR: z.radius * 2,   // Scale ring to zone radius
      propagationSpeed: 1,
      repeatPeriod: 2000,   // Slow ambient pulse — background context, not alarm
      color: 'rgba(239, 68, 68, 0.2)' // Low opacity: ambient, not primary attention
    }));

    return [...liveRings, ...staticRings];
  }, [events]);

  // ── Airplane HTML marker factory ──────────────────────────────────────────
  // Called by GlobeGL's htmlElement prop for each flight entry.
  // Creates a DOM element directly (not React) because GlobeGL's HTML layer
  // expects a raw HTMLElement, not a React component.
  // Color tri-state: surge=red, nearConflict=orange, normal=cyan
  const createAirplaneElement = useCallback((d) => {
    const el = document.createElement('div');
    el.style.cursor = 'pointer';
    el.style.pointerEvents = 'auto';

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

    // Native tooltip on hover (no React tooltip needed)
    el.title = `${d.callsign} | ${d.aircraftType || 'Tactical'} | ALT ${d.altitude}ft | ${d.velocity}kts | HDG ${d.heading}°`;

    // Click: select flight + fire parent callback.
    // blockCountryClick prevents the globe's polygon click from also firing
    // within the 200ms debounce window after a marker click.
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      blockCountryClick.current = true;
      setSelectedFlight(d.flightData);
      if (onFlightClick) onFlightClick(d.flightData);
      setTimeout(() => { blockCountryClick.current = false; }, 200);
    });

    // Hover: amplify glow and scale up 1.3× to indicate interactivity
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

  // ── Vessel HTML marker factory ────────────────────────────────────────────
  // Same pattern as createAirplaneElement.
  // Color bi-state: surge=red, normal=neon-green (#00ff7f)
  // Neon green is semantically distinct from the threat palette — signals AIS normal
  const createVesselElement = useCallback((d) => {
    const el = document.createElement('div');
    el.style.cursor = 'pointer';
    el.style.pointerEvents = 'auto';

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

    // Click: select vessel + fire parent callback + debounce country click guard
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      blockCountryClick.current = true;
      setSelectedVessel(d.vesselData);
      if (onVesselClick) onVesselClick(d.vesselData);
      setTimeout(() => { blockCountryClick.current = false; }, 200);
    });

    // Hover: same glow amplification + scale pattern as airplane markers
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

  // ── Combined HTML marker array ────────────────────────────────────────────
  // GlobeGL's htmlElementsData takes a single flat array; type field routes
  // each item to the correct factory in the htmlElement prop function below.
  const allHtmlElements = useMemo(() => {
    return [...flightMarkersData, ...vesselMarkersData];
  }, [flightMarkersData, vesselMarkersData]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <GlobeGL
        ref={globeRef}
        // ── Globe textures ──────────────────────────────────────────────────
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="#00D4FF"    // Cyan atmosphere matches UI accent color
        atmosphereAltitude={0.2}

        // ── Points layer (events + cyber) ───────────────────────────────────
        // Hidden when showHeatmap is true — hexbin replaces individual points
        pointsData={showHeatmap ? [] : allPoints}
        pointLat="lat"
        pointLng="lng"
        pointAltitude={(d) => d.size * 0.05} // Slight elevation so points float above surface
        pointRadius={(d) => d.size}
        pointColor="color"
        pointLabel="label"
        pointsMerge={false} // Keep false: merged points lose individual click/label data

        // ── Hexbin heatmap layer ────────────────────────────────────────────
        // Only populated when showHeatmap is true (mutually exclusive with points layer)
        // Weight: CRITICAL=10, HIGH=5, all others=1 — drives hex height and color tier
        hexBinPointsData={showHeatmap ? events : []}
        hexBinPointLat="lat"
        hexBinPointLng="lng"
        hexBinPointWeight={(d) => d.severity === 'CRITICAL' ? 10 : d.severity === 'HIGH' ? 5 : 1}
        hexBinResolution={4}   // Lower = larger hex cells = broader regional clustering
        hexBinMerge={true}
        hexMargin={0.2}
        hexTopColor={(d) => {
          // Color tiers by aggregated weight: >15=red cluster, >5=orange cluster, else yellow
          if (d.sumWeight > 15) return 'rgba(239, 68, 68, 0.9)';
          if (d.sumWeight > 5)  return 'rgba(249, 115, 22, 0.8)';
          return 'rgba(234, 179, 8, 0.6)';
        }}
        hexSideColor={() => 'rgba(239, 68, 68, 0.1)'} // Subtle side faces — emphasis stays on top
        hexAltitude={(d) => Math.min(0.2, d.sumWeight * 0.01)} // Height scales with weight, capped at 0.2
        hexTransitionDuration={1000} // Smooth 1s transition when data updates

        // ── HTML marker layer (flights + vessels) ───────────────────────────
        // htmlElement is called per item — routes to airplane or vessel factory by type field
        htmlElementsData={allHtmlElements}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={(d) => d.type === 'flight' ? 0.005 : 0.001} // Flights render slightly above vessels
        htmlElement={(d) => d.type === 'flight' ? createAirplaneElement(d) : createVesselElement(d)}

        // ── Arc layer ───────────────────────────────────────────────────────
        // Single layer handles all arc types (threat rings, sat beams, route arcs)
        // arcDashAnimateTime is a function to allow per-arc speed override
        arcsData={arcsData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={0.5}
        arcDashGap={0.3}
        arcDashAnimateTime={(d) => d.dashAnimateTime || 2000} // Per-arc speed; fallback 2000ms
        arcAltitude="altitude"
        arcStroke="stroke"
        arcLabel="label"

        // ── Threat rings layer ──────────────────────────────────────────────
        ringsData={ringsData}
        ringLat="lat"
        ringLng="lng"
        ringColor="color"
        ringMaxRadius="maxR"
        ringPropagationSpeed="propagationSpeed"
        ringRepeatPeriod="repeatPeriod"

        // ── Country polygon layer ───────────────────────────────────────────
        // Hover: lifts polygon to 0.06 and brightens stroke; also pauses auto-rotation
        // Click: fires onCountryClick only if blockCountryClick guard is clear
        polygonsData={countries.features}
        polygonCapColor={getPolygonColor}
        polygonSideColor={(d) => d === hoveredPolygon ? 'rgba(0, 212, 255, 0.1)' : 'rgba(0, 0, 0, 0)'}
        polygonStrokeColor={(d) => d === hoveredPolygon ? 'rgba(0, 212, 255, 1)' : 'rgba(0, 212, 255, 0.2)'}
        polygonAltitude={(d) => d === hoveredPolygon ? 0.06 : 0.01}
        onPolygonHover={(polygon) => {
           setHoveredPolygon(polygon);
           if (globeRef.current) {
             // Pause rotation while hovering a country — lets user read the region
             globeRef.current.controls().autoRotate = !polygon;
           }
         }}
        onPolygonClick={(p) => {
          // blockCountryClick guard: prevents this from firing when user clicks a
          // flight/vessel marker that sits on top of a polygon (200ms debounce)
          if (blockCountryClick.current) return;
          const name = p?.properties?.NAME || p?.properties?.ADMIN || '';
          if (name && onCountryClick) onCountryClick(name);
        }}

        // ── Dimensions ─────────────────────────────────────────────────────
        width={undefined}   // Let CSS/parent control width (100%)
        height={undefined}  // Let CSS/parent control height (100%)
        animateIn={true}    // Globe spins in on first mount
      />
    </div>
  );
}