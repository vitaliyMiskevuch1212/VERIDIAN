import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useDeferredValue,
} from "react";
import { useData } from "./DataContext";
import useTacticalVoice from "../hooks/useTacticalVoice";
import useTacticalAudio from "../hooks/useTacticalAudio";
import { useToast } from "../components/ToastNotifications";
import { COUNTRY_COORDS } from "../utils/geoData";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const {
    events,
    flights,
    globeLoading,
    news,
    newsLoading,
    overview,
    financeLoading,
    fetchOverview,
    fetchPredictions,
    onEvent,
  } = useData();

  const { announce, playSiren } = useTacticalVoice();
  const audio = useTacticalAudio();
  const toast = useToast();

  // ─── UI State ─────────────────────────────────────────────
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [flyToTarget, setFlyToTarget] = useState(null);
  const [showFlights, setShowFlights] = useState(true);
  const [showCyber, setShowCyber] = useState(false);
  const [showRegions, setShowRegions] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [viewMode, setViewMode] = useState("globe");
  const [activeFilters, setActiveFilters] = useState({});
  const deferredFilters = useDeferredValue(activeFilters);
  const [timeRange, setTimeRange] = useState("24h");

  // Scrubber State
  const maxTime = useMemo(() => Date.now(), []);
  const minTime = useMemo(() => maxTime - 7 * 24 * 60 * 60 * 1000, [maxTime]);
  const [scrubTime, setScrubTime] = useState(maxTime);

  const [activeTab, setActiveTab] = useState("news");
  const [isCommsActive, setIsCommsActive] = useState(false);
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [flightCategory, setFlightCategory] = useState("all");
  const [wargameEvent, setWargameEvent] = useState(null);
  const [isOmniOpen, setIsOmniOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const spokenNewsIds = useRef(new Set());
  const spokenAssetIds = useRef(new Set());
  const toastedNewsIds = useRef(new Set());
  const toastedEventIds = useRef(new Set());

  // Handle Voice Comms Initialization
  const handleCommsToggle = useCallback(() => {
    if (!isCommsActive) playSiren();
    setIsCommsActive(!isCommsActive);
  }, [isCommsActive, playSiren]);

  // Omni-Command global listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOmniOpen((prev) => {
          if (!prev) audio.playBloop();
          return !prev;
        });
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [audio]);

  // ─── DEFCON Level Computation ─────────────────────────────
  const defconLevel = useMemo(() => {
    const critCount = events.filter((e) => e.severity === "CRITICAL").length;
    const highCount = events.filter((e) => e.severity === "HIGH").length;
    const breakingCount = news.filter((n) => n.isBreaking).length;
    const score = critCount * 10 + highCount * 3 + breakingCount * 5;
    if (score >= 50) return 1;
    if (score >= 30) return 2;
    if (score >= 15) return 3;
    if (score >= 5) return 4;
    return 5;
  }, [events, news]);

  // Apply DEFCON to root element
  useEffect(() => {
    document.documentElement.setAttribute("data-defcon", String(defconLevel));
    return () => document.documentElement.removeAttribute("data-defcon");
  }, [defconLevel]);

  // ─── Toast Notifications for CRITICAL events ──────────────
  useEffect(() => {
    if (globeLoading) return;
    events.forEach((evt) => {
      if (evt.severity === "CRITICAL" && !toastedEventIds.current.has(evt.id)) {
        toastedEventIds.current.add(evt.id);
        toast.addToast({
          type: "CRITICAL",
          title: evt.title,
          subtitle: evt.country
            ? `REGION: ${evt.country.toUpperCase()}`
            : undefined,
        });
      }
    });
  }, [events, globeLoading, toast]);

  // ─── Toast Notifications for BREAKING news ────────────────
  useEffect(() => {
    if (newsLoading) return;
    news.forEach((n) => {
      if (n.isBreaking && !toastedNewsIds.current.has(n.title)) {
        toastedNewsIds.current.add(n.title);
        toast.addToast({
          type: "BREAKING",
          title: n.title,
          subtitle: n.source ? `SOURCE: ${n.source.toUpperCase()}` : undefined,
        });
      }
    });
  }, [news, newsLoading, toast]);

  // ─── Expanded Keyboard Shortcuts ──────────────────────────
  useEffect(() => {
    const handleKeyboard = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;
      if (isOmniOpen || isShortcutsOpen) return;

      const key = e.key.toLowerCase();

      // View toggles
      if (key === "g") {
        setViewMode((prev) => (prev === "globe" ? "map2d" : "globe"));
        audio.playClick();
      }
      if (key === "h") {
        if (leftPanelVisible || rightPanelVisible) {
          setLeftPanelVisible(false);
          setRightPanelVisible(false);
        } else {
          setLeftPanelVisible(true);
          setRightPanelVisible(true);
        }
        audio.playClick();
      }
      if (key === "f") {
        setShowFlights((prev) => !prev);
        audio.playClick();
      }
      if (key === "c") {
        setShowCyber((prev) => !prev);
        audio.playClick();
      }
      if (key === "r") {
        setShowRegions((prev) => !prev);
        audio.playClick();
      }
      if (key === "m") {
        setShowHeatmap((prev) => !prev);
        audio.playClick();
      }
      if (key === "v") {
        handleCommsToggle();
      }

      // Tab switching
      if (key === "1") {
        setActiveTab("news");
        audio.playClick();
      }
      if (key === "2") {
        setActiveTab("finance");
        audio.playClick();
      }
      if (key === "3") {
        setActiveTab("predictions");
        audio.playClick();
      }
      if (key === "4") {
        setActiveTab("sitrep");
        audio.playClick();
      }

      // Time range
      if (e.altKey && key === "1") {
        e.preventDefault();
        setTimeRange("1h");
      }
      if (e.altKey && key === "2") {
        e.preventDefault();
        setTimeRange("6h");
      }
      if (e.altKey && key === "3") {
        e.preventDefault();
        setTimeRange("24h");
      }
      if (e.altKey && key === "4") {
        e.preventDefault();
        setTimeRange("7d");
      }

      // Help
      if (key === "?" || (e.shiftKey && key === "/")) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [isOmniOpen, isShortcutsOpen, audio, handleCommsToggle]);
  // ─── WebSocket Real-Time Push Listeners ────────────────────
  useEffect(() => {
    const unsub1 = onEvent("data:breakingNews", (breakingItems) => {
      breakingItems.forEach((item) => {
        if (!toastedNewsIds.current.has(item.title)) {
          toastedNewsIds.current.add(item.title);
          toast.addToast({
            type: "BREAKING",
            title: item.title,
            subtitle: `LIVE PUSH • ${item.source || "UNKNOWN"}`,
          });
          audio.playBloop();
        }
      });
    });

    const unsub2 = onEvent("data:newEvents", (newEvents) => {
      newEvents.forEach((evt) => {
        if (
          evt.severity === "CRITICAL" &&
          !toastedEventIds.current.has(evt.id)
        ) {
          toastedEventIds.current.add(evt.id);
          toast.addToast({
            type: "CRITICAL",
            title: evt.title,
            subtitle: `LIVE INTEL • ${evt.country || "GLOBAL"}`,
          });
        }
      });
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [onEvent, toast, audio]);

  // Monitor News for CRITICAL Alerts
  useEffect(() => {
    if (!isCommsActive || newsLoading) return;
    const criticalNews = news.find(
      (n) => n.severity === "CRITICAL" && !spokenNewsIds.current.has(n.id),
    );
    if (criticalNews) {
      spokenNewsIds.current.add(criticalNews.id);
      announce(
        `ATTENTION. CRITICAL INTEL INTERCEPTED. ${criticalNews.title}. STATUS: ACTIVE.`,
        "CRITICAL",
      );
    }
  }, [news, isCommsActive, newsLoading, announce]);

  // Monitor Markets for GEOTRADE SURGE
  useEffect(() => {
    if (!isCommsActive || financeLoading || !overview) return;
    const allAssets = [...(overview.crypto || []), ...(overview.forex || [])];
    const surge = allAssets.find(
      (a) =>
        Math.abs(a.change) >= 10 &&
        !spokenAssetIds.current.has(
          `${a.symbol || a.pair}_${Math.floor(Date.now() / 3600000)}`,
        ),
    );
    if (surge) {
      const symbol = surge.symbol || surge.pair;
      spokenAssetIds.current.add(
        `${symbol}_${Math.floor(Date.now() / 3600000)}`,
      );
      announce(
        `ATTENTION. GEOTRADE SURGE DETECTED. ASSET ${symbol} MOVED ${Math.round(surge.change)} PERCENT. ACTION ADVISED.`,
        "SURGE",
      );
    }
  }, [overview, isCommsActive, financeLoading, announce]);

  // Fetch finance & predictions on mount
  useEffect(() => {
    fetchOverview();
    fetchPredictions();
  }, [fetchOverview, fetchPredictions]);

  // ─── Computed Data ───────────────────────────────────────
  const filteredEvents = useMemo(() => {
    // If we are actively scrubbing backwards, only show events up to that exact minute
    // We create a sliding window of events visible at any point in the scrub
    const windowLength =
      { "1h": 3600000, "6h": 21600000, "24h": 86400000, "7d": 604800000 }[
        timeRange
      ] || 86400000;

    const hasActiveFilters = Object.keys(deferredFilters).length > 0;
    return events.filter((e) => {
      if (deferredFilters[e.type] === false) return false;
      if (!e.timestamp) return true;
      const evtTime = new Date(e.timestamp).getTime();
      return evtTime <= scrubTime && evtTime >= scrubTime - windowLength;
    });
  }, [events, deferredFilters, timeRange, scrubTime]);

  const filteredFlights = useMemo(() => {
    if (flightCategory === "all") return flights;
    return flights.filter((f) => {
      const t = (f.aircraftType || "").toLowerCase();
      if (flightCategory === "isr")
        return (
          t.includes("uav") ||
          t.includes("recon") ||
          t.includes("awacs") ||
          t.includes("strategic") ||
          t.includes("high") ||
          t.includes("maneuv")
        );
      if (flightCategory === "transport")
        return (
          t.includes("heavy") || t.includes("large") || t.includes("transport")
        );
      if (flightCategory === "heli")
        return t.includes("rotor") || t.includes("heli");
      if (flightCategory === "tanker")
        return t.includes("tanker") || t.includes("refuel");
      return !["isr", "transport", "heli", "tanker"].some((cat) => {
        if (cat === "isr")
          return (
            t.includes("uav") ||
            t.includes("recon") ||
            t.includes("awacs") ||
            t.includes("strategic") ||
            t.includes("high")
          );
        if (cat === "transport")
          return (
            t.includes("heavy") ||
            t.includes("large") ||
            t.includes("transport")
          );
        if (cat === "heli") return t.includes("rotor") || t.includes("heli");
        if (cat === "tanker")
          return t.includes("tanker") || t.includes("refuel");
        return false;
      });
    });
  }, [flights, flightCategory]);

  const missionMetrics = useMemo(() => {
    const allIntel = [...events, ...news];
    return {
      active: allIntel.filter((n) => n.severity === "CRITICAL").length,
      tensions: allIntel.filter(
        (n) => n.severity === "HIGH" || n.severity === "MEDIUM",
      ).length,
    };
  }, [events, news]);

  const tabBadges = useMemo(
    () => ({
      news: news.filter((n) => n.isBreaking).length,
      finance: 0,
      predictions: 0,
      sitrep: events.filter((e) => e.severity === "CRITICAL").length,
    }),
    [news, events],
  );

  // ─── Actions ─────────────────────────────────────────────
  const handleCountryClick = useCallback((name, coords) => {
    setSelectedCountry(name);
    if (coords && coords.lat && coords.lng) {
      setFlyToTarget(coords);
    } else if (COUNTRY_COORDS[name]) {
      setFlyToTarget(COUNTRY_COORDS[name]);
    }
  }, []);

  const handleTickerEventClick = useCallback((evt) => {
    if (evt.lat && evt.lng) setFlyToTarget({ lat: evt.lat, lng: evt.lng });
  }, []);

  // REPLACE WITH:
  const handleFilterToggle = useCallback((key) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: prev[key] === false ? undefined : false,
    }));
  }, []);

  const handleRegionClick = useCallback((regionName) => {
    const coords = {
      "Middle East": { lat: 29, lng: 42 },
      Europe: { lat: 50, lng: 15 },
      "Asia-Pacific": { lat: 25, lng: 115 },
      Americas: { lat: 10, lng: -80 },
      Africa: { lat: 5, lng: 20 },
    };
    if (coords[regionName]) setFlyToTarget(coords[regionName]);
  }, []);

  const value = useMemo(
    () => ({
      // View State
      selectedCountry,
      setSelectedCountry,
      flyToTarget,
      setFlyToTarget,
      showFlights,
      setShowFlights,
      showCyber,
      setShowCyber,
      showRegions,
      setShowRegions,
      showHeatmap,
      setShowHeatmap,
      viewMode,
      setViewMode,
      activeFilters,
      setActiveFilters,
      handleFilterToggle,
      timeRange,
      setTimeRange,
      minTime,
      maxTime,
      scrubTime,
      setScrubTime,
      activeTab,
      setActiveTab,
      isCommsActive,
      handleCommsToggle,
      leftPanelVisible,
      setLeftPanelVisible,
      rightPanelVisible,
      setRightPanelVisible,
      flightCategory,
      setFlightCategory,
      wargameEvent,
      setWargameEvent,
      isOmniOpen,
      setIsOmniOpen,
      isShortcutsOpen,
      setIsShortcutsOpen,

      // Computed / Handlers
      defconLevel,
      missionMetrics,
      tabBadges,
      filteredEvents,
      filteredFlights,
      handleCountryClick,
      handleTickerEventClick,
      handleRegionClick,

      // Audio Tooling
      audio,
    }),
    [
      selectedCountry,
      flyToTarget,
      showFlights,
      showCyber,
      showRegions,
      showHeatmap,
      viewMode,
      activeFilters,
      handleFilterToggle,
      timeRange,
      scrubTime,
      activeTab,
      isCommsActive,
      handleCommsToggle,
      leftPanelVisible,
      setLeftPanelVisible,
      rightPanelVisible,
      setRightPanelVisible,
      flightCategory,
      wargameEvent,
      isOmniOpen,
      isShortcutsOpen,
      defconLevel,
      missionMetrics,
      tabBadges,
      filteredEvents,
      filteredFlights,
      handleCountryClick,
      handleTickerEventClick,
      handleRegionClick,
      audio,
    ],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used within a UIProvider");
  return context;
}
