<div align="center">

# 🌐 VERIDIAN

**Real-Time Geopolitical Intelligence + AI Trading Signals**

![VERIDIAN Preview](Screenshot/home.png)

> **"Right now, somewhere on Earth, a missile was just fired, a government just collapsed, or a major trade route just closed. A trader who knows this in the next 30 seconds can make a fortune. A trader who finds out in 3 hours loses one. We built the 30-second version."**

<a href="#" target="_blank">
  <img src="https://img.shields.io/badge/%20Live%20Demo-Launch%20VERIDIAN-00D4FF?style=for-the-badge&labelColor=0A0F1E" alt="Live Demo" />
</a>

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-00D4FF?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Groq AI](https://img.shields.io/badge/AI-Groq_Llama_3.1-00FF88?style=for-the-badge)](https://groq.com/)
[![WebGL](https://img.shields.io/badge/WebGL-Globe.gl-7C3AED?style=for-the-badge)](https://globe.gl/)
[![Free APIs](https://img.shields.io/badge/Cost-100%25_Free_APIs-F59E0B?style=for-the-badge)](/)
[![License](https://img.shields.io/badge/License-MIT-EF4444?style=for-the-badge)](/)

</div>

---

## 🔴 The Problem — Why VERIDIAN Exists

In today's hyper-connected global economy, geopolitical events move markets in seconds. Military escalations, supply chain blockades, natural disasters, and civil unrest all trigger immediate financial consequences. Yet the tools available to retail traders and independent analysts are fundamentally broken.

### The Intelligence Gap

**1. The "So What?" Void**

Traditional geopolitical tracking platforms — LiveUAMap, Crisis24, Conflictly — are exceptional at plotting events on a map. They tell you *where* and *what*. When an oil pipeline ruptures or a shipping lane is blockaded, they show you the dot on the map and abandon you entirely when it comes to *what to do about it financially*. There is a definitive lack of accessible systems that instantly translate a geographic or political risk into a quantifiable financial action.

**2. The Latency Squeeze**

By the time a retail trader reads a breaking headline, evaluates the affected region, cross-references live market data, and formulates a trading thesis — high-frequency algorithms and institutional players have already priced the event in. Human synthesis is fundamentally too slow. Retail traders consistently lose the execution race because no accessible system exists to autonomously evaluate geopolitical context natively and in real time.

**3. Deep Tool Fragmentation**

Building a coherent threat assessment today requires juggling 10+ disconnected tabs simultaneously: Reuters for news, Flightradar24 for military aircraft, alternative.me for sentiment, Yahoo Finance for price action, and X for ground-truth OSINT. This fragmentation destroys situational awareness, prevents cross-domain correlation, and forces decisions on incomplete data.

**4. The Institutional Paywall**

Integrated, multi-axis geopolitical financial intelligence platforms do exist — Bloomberg Terminal and Reuters Eikon. But they cost **$24,000–$30,000 per user per year**. Students, independent analysts, and retail traders are locked out of enterprise-grade intelligence entirely, creating a massive and unfair market asymmetry.

---

## ⚡ The Solution — VERIDIAN

VERIDIAN is a fully public, real-time geopolitical intelligence command centre that directly eliminates all four failure points above. No login. No paywall. Everything usable by any visitor, instantly.

| The Gap | How VERIDIAN Closes It |
|---------|----------------------|
| **"So What?" Void** | GeoTrade AI Signal Engine auto-generates `BUY` / `HOLD` / `SELL` in under 10 seconds from live events |
| **Latency Squeeze** | Groq's sub-second LLaMA 3.1 inference — from world event to financial signal faster than any human workflow |
| **Tool Fragmentation** | Globe, news, military flights, cyber threats, and market data unified on one zero-tab interface |
| **Institutional Paywall** | Built entirely on free-tier APIs. $0 to run. Enterprise-grade intelligence, democratised |

---

## 🎯 What Makes VERIDIAN Different

No commercial OSINT tool — not Reuters Eikon, not Bloomberg Terminal, not Conflictly — automatically converts a live geopolitical event into a financial trading signal with AI reasoning. VERIDIAN does this in **under 10 seconds**.

```
Hormuz tensions escalating  →  Oil supply disruption likely  →  BUY $XOM   (confidence: 81%)
China suspends rare earths  →  EV supply chain at risk       →  SELL $TSLA  (confidence: 74%)
Middle East escalation      →  Safe haven demand rising      →  BUY $GLD   (confidence: 78%)
```

### Competitor Comparison

| Capability | Conflictly.app | LiveUAMap | Crisis24 | Bloomberg Terminal | **VERIDIAN** |
|------------|:-:|:-:|:-:|:-:|:-:|
| 3D Interactive Globe | ✅ | ✅ | ❌ | ❌ | ✅ |
| Live Conflict Event Data | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI Country Intelligence Briefs | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Financial Trading Signals** | ❌ | ❌ | ❌ | Manual | ✅ |
| **Stock / Crypto / Forex Panel** | ❌ | ❌ | ❌ | ✅ | ✅ |
| Military Flight Tracking | ❌ | ✅ | ❌ | ❌ | ✅ |
| Cyber Threat Globe Overlay | ❌ | ❌ | ❌ | ❌ | ✅ |
| **4-Key AI Rotation (zero downtime)** | ❌ | ❌ | ❌ | ❌ | ✅ |
| Wargame Scenario Simulation | ❌ | ❌ | ❌ | ❌ | ✅ |
| Predictive Escalation Engine | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Annual Cost Per User** | Paid | Paid | Paid | **$24,000+** | **$0** |

---

## ✨ Core Features

### 🤖 Feature 1 — GeoTrade AI Signal Engine *(The Core Differentiator)*

The engine that closes the "So What?" void. VERIDIAN's AI reads live geopolitical events and generates real-time financial signals — the only platform of its kind to do so autonomously.

| Capability | Description |
|------------|-------------|
| **AI Signal Generation** | Groq LLaMA 3.1 reads current GDELT events related to a stock's sector/country → outputs `BUY` / `HOLD` / `SELL` with a full reasoning paragraph |
| **Signal Confidence** | Each signal shows a confidence percentage (e.g., `BUY — 81%`) |
| **Stock Search** | Input any ticker: `AAPL` `TSLA` `XOM` `GLD` `SPY` |
| **Live Price & Change** | Real-time price, % change, volume via `yahoo-finance2` npm (free, no key) |
| **7-Day Sparkline Chart** | Recharts `LineChart` sparkline for past 7-day price history |
| **Fear & Greed Index** | `alternative.me` API dial widget showing global market sentiment (0–100) |
| **Crypto Panel** | BTC / ETH / SOL / XRP live prices via CoinGecko with geo-risk correlation labels |
| **Forex Panel** | USD/JPY, EUR/USD, GBP/USD, USD/INR live rates with country flags |
| **Commodity Panel** | Gold, Crude Oil, Natural Gas via yahoo-finance2 with conflict-driven context labels |
| **Signal History** | Last 5 AI signals per ticker stored in MongoDB, shown as a mini timeline |

**Signal Badges:**

| Signal | Colour |
|--------|--------|
| `BUY` | `#00FF88` Signal Green |
| `SELL` | `#EF4444` Red |
| `HOLD` | `#EAB308` Yellow |

---

### 🌍 Feature 2 — Live 3D Geopolitical Globe

The operational centrepiece. A WebGL globe that shows every active geopolitical event on Earth as glowing, colour-coded dots — replacing the need for any external OSINT map tool.

| Capability | Description |
|------------|-------------|
| **Auto-Rotation** | Globe spins at ~2 RPM on idle, stops on user interaction, resumes after 8 seconds |
| **Glowing Event Dots** | Each event plotted at real lat/lon. Dot size scales with severity. Colour maps to threat level |
| **Pulsing Red Rings** | `CRITICAL` events show a double CSS keyframe ring animation |
| **Click-to-Brief** | Clicking any country triggers Groq AI to generate a full intelligence brief in a slide-in side panel |
| **2D Map Toggle** | Smooth transition between Globe.gl 3D view and Mapbox GL JS flat 2D map |
| **Event Type Filters** | Toggle: `Conflicts` `Protests` `Disasters` `Earthquakes` `Wildfires` `Military Flights` |
| **Time Range Filter** | `Last 1h` / `6h` / `24h` / `7 days` — filters globe dots by event timestamp |
| **Heatmap Layer** | Deck.gl density heatmap overlay showing event concentration per region |
| **Fly-to Animation** | Clicking a news headline or ticker item smoothly flies the globe camera to that event |
| **Arc Layer** | Military flight paths rendered as animated arcs on the globe surface |

**Severity Colour System:**

| Level | Colour | Hex |
|-------|--------|-----|
| `CRITICAL` | 🔴 Red | `#EF4444` |
| `HIGH` | 🟠 Orange | `#F97316` |
| `MEDIUM` | 🟡 Yellow | `#EAB308` |
| `LOW` | 🟢 Green | `#00FF88` |

---

### 📰 Feature 3 — Live Intelligence News Feed

Real-time, severity-coded news panel aggregating **150+ global sources** — replacing the Reuters/BBC/Al Jazeera tab stack with a single unified feed.

| Capability | Description |
|------------|-------------|
| **Multi-Source Aggregation** | NewsAPI.org + direct RSS via `rss-parser` from Reuters, BBC, Al Jazeera, Bloomberg |
| **GDELT Event Feed** | Real-time geopolitical events with coordinates. Unlimited, no key required |
| **Severity Colour Coding** | Every headline auto-tagged by backend NLP keyword scoring: `CRITICAL` / `HIGH` / `MEDIUM` / `LOW` |
| **Auto-Refresh** | Silently refreshes every 5 minutes. New items fade in at top |
| **`BREAKING` Badge** | Stories covered by 3+ sources within 15 minutes get a pulsing gold `BREAKING` badge |
| **Region Filter Tabs** | `Middle East` `Europe` `Asia-Pacific` `Americas` `Africa` |
| **Entity Linking** | Country names in headlines are clickable — zooms globe camera to that country |
| **Country Flags** | Every headline shows the inline country flag via `flagcdn.com` |

---

### 🤖 Feature 4 — AI Country Intelligence Briefs

Click any country on the globe → a slide-in panel delivers a full AI-generated intelligence brief in under 2 seconds. This is the capability that replaces expensive country-risk subscriptions.

| Capability | Description |
|------------|-------------|
| **Groq LLaMA 3.1 8B** | Generates a 3-paragraph intelligence brief using live headlines as context |
| **4-Key Rotation System** | 4 free Groq API keys in round-robin. If key 1 hits rate limit, key 2 activates instantly |
| **Google Gemini Fallback** | If all 4 Groq keys exhausted, Gemini API (15 req/min free) handles seamlessly |
| **Stability Score** | AI assigns a 0–100 score rendered as a glowing `Recharts RadialBarChart` ring |
| **Top 3 Risks** | AI returns the three most critical current risk factors as structured bullet points |
| **Outlook Badge** | `Stable` / `Deteriorating` / `Escalating` / `Crisis` — colour-coded |
| **Source Citations** | Brief lists exactly which headlines were used as context |
| **15-Min MongoDB Cache** | Generated briefs cached with TTL to prevent rate limit abuse |

---

### ✈️ Feature 5 — Military Flight Tracker

Live aircraft positions from OpenSky Network plotted on the 3D globe — replacing the need for Flightradar24 or ADS-B Exchange tabs.

| Capability | Description |
|------------|-------------|
| **Live Positions** | Real-time aircraft lat/lon/altitude from OpenSky Network API (free, anonymous) |
| **Military Filter** | Filters to military/government aircraft using ICAO type codes and callsign patterns |
| **Globe Arc Overlay** | Flight paths rendered as animated cyan arcs on the Globe.gl arc layer |
| **Conflict Proximity Alert** | Aircraft within 200km of an active conflict zone flagged with orange warning badge |
| **Surge Detection** | Flags unusual concentration of military flights (>5 in same region) with `SURGE` badge |
| **Aircraft Info Popup** | Click any flight → callsign, type, origin, destination, altitude, speed |
| **60-Second Auto-Refresh** | Flight positions update every 60 seconds (rate-limit friendly) |

---

### 📡 Feature 6 — Tension Ticker

A scrolling alert bar at the top of the dashboard styled like a financial stock ticker — turning geopolitical noise into an always-on awareness layer.

| Capability | Description |
|------------|-------------|
| **Continuous Horizontal Scroll** | CSS keyframe animation scrolling live geopolitical alerts across the full screen |
| **Severity Colour Coding** | Dot + label: `CRITICAL` in red, `HIGH` in orange, `MEDIUM` in yellow |
| **Click to Globe Focus** | Clicking any ticker item calls `Globe.gl flyTo()` to zoom to that event |
| **5-Min Auto-Refresh** | Updates with latest GDELT + NewsAPI data every 5 minutes |

---

### 🗺️ Feature 7 — Regional Intelligence Panels

Four region-specific intelligence cards — replacing the need to manually synthesise regional threat reports.

| Capability | Description |
|------------|-------------|
| **4 Panels** | `Middle East` · `Europe` · `Asia-Pacific` · `Americas` — each with regional analysis |
| **Top 3 Events** | Most critical current events per region, severity-coded |
| **Stability Index** | Regional score 0–100 as a coloured progress bar |
| **Trending Keywords** | Top 5 trending geopolitical terms per region (e.g., `ceasefire`, `sanctions`) |
| **Event Count + Trend** | Total events in last 24h with trend vs previous 24h |
| **Click to Expand** | Clicking a region panel flies the globe camera to that region |

---

### 🎮 Feature 8 — Tactical Command Interface

Advanced command-centre features that collectively eliminate the multi-tab workflow entirely.

| Component | Description |
|-----------|-------------|
| **OmniCommand** | `Ctrl+K` command palette for instant navigation and search across the entire platform |
| **WargameModal** | AI-powered scenario simulator — "What if Iran closes the Strait of Hormuz?" with cascading market impact analysis |
| **PredictionPanel** | AI escalation predictions with probability scores and timelines |
| **SitrepPanel** | Auto-generated 24h Situation Reports |
| **GlobalRiskIndex** | Composite global risk score aggregating all active events, updated in real time |
| **Cyber Threat Layer** | Live botnet C2 servers and malware hosts from `abuse.ch` and `URLhaus` overlaid on the globe |
| **Tactical Voice** | Voice command interface — speak queries, hear AI briefs via text-to-speech |
| **TimelineScrubber** | Scrub through historical event data on a draggable timeline |
| **KeyboardShortcuts** | Full keyboard navigation — `G` globe, `N` news, `F` finance, `M` map toggle |

---

## 🛠️ Tech Stack

### Frontend

![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Globe.gl](https://img.shields.io/badge/Globe.gl-WebGL-7C3AED?style=flat-square)
![Mapbox](https://img.shields.io/badge/Mapbox_GL_JS-000000?style=flat-square&logo=mapbox&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-Charts-22B5BF?style=flat-square)
![Socket.io](https://img.shields.io/badge/Socket.io-Client-010101?style=flat-square&logo=socket.io&logoColor=white)

### Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)

### AI & Intelligence

![Groq](https://img.shields.io/badge/Groq_Llama_3.1-00FF88?style=flat-square)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=flat-square&logo=google&logoColor=white)
![GDELT](https://img.shields.io/badge/GDELT_Project-F59E0B?style=flat-square)

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend Framework** | React 18 + Vite | Fast SPA — instant hot reload |
| **Styling** | Tailwind CSS + Custom CSS | Dark command-centre UI + animations |
| **3D Globe** | Globe.gl | WebGL globe — dots, arcs, heatmap |
| **2D Map** | Mapbox GL JS + MapLibre GL JS | Flat map toggle view |
| **Data Layers** | Deck.gl | Heatmap + arc flight paths |
| **Charts** | Recharts | Sparklines, stability ring, sentiment dial |
| **Real-Time** | Socket.io | Live data push to clients |
| **State Management** | React Context API | DataContext + UIContext |
| **Backend** | Node.js + Express | REST API server |
| **Database** | MongoDB Atlas + Mongoose | Brief cache, event cache, signal history |
| **AI Primary** | Groq API — 4 keys rotating | LLaMA 3.1 8B — briefs + signals |
| **AI Fallback** | Google Gemini API | Backup when all 4 Groq keys rate-limited |
| **Finance Data** | yahoo-finance2 npm | Stocks + commodities, no API key |
| **Crypto Data** | CoinGecko API | BTC/ETH/SOL/XRP live prices |
| **Flight Data** | OpenSky Network | Military aircraft positions |
| **Frontend Deploy** | Vercel | Free, unlimited deployments |
| **Backend Deploy** | Railway | $5 free credit, no cold starts |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                            │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  GDELT/ACLED │  NewsAPI/RSS │  OpenSky     │  Yahoo Finance     │
│  USGS/GDACS  │              │  ADS-B Exch. │  CoinGecko         │
│  NASA FIRMS  │              │              │  ExchangeRate API  │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────────┘
       │              │              │                │
       ▼              ▼              ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS BACKEND (Node.js)                     │
│                                                                 │
│  /api/events    /api/news    /api/flights    /api/finance       │
│  /api/cyber     /api/ai/brief               /api/ai/signal     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  groqService.js — 4-Key Rotation                         │  │
│  │  Key 1 → Key 2 → Key 3 → Key 4 → Gemini Fallback        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────┐   ┌─────────────────────────────────┐   │
│  │  cacheService.js  │   │  MongoDB Atlas                  │   │
│  │  (in-memory Map)  │   │  BriefCache + EventCache +      │   │
│  │  5-min TTL        │   │  SignalHistory                  │   │
│  └───────────────────┘   └─────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │  REST API + Socket.io
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND (Vite)                       │
│                                                                 │
│  ┌─ DashboardHeader ────────────────────────────────────────┐  │
│  │  Navbar (UTC clock + event count) → Ticker (scrolling)   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ DashboardLeftPanel ──┐  ┌─ DashboardCenter ──────────┐    │
│  │  NewsPanel            │  │  Globe.gl (3D) / Map2D     │    │
│  │  SitrepPanel          │  │  Event dots + arcs +       │    │
│  │  TopKeywords          │  │  heatmap + targeting       │    │
│  └───────────────────────┘  └────────────────────────────┘    │
│                                                                 │
│  ┌─ DashboardRightPanel ────────────────────────────────────┐  │
│  │  CountryBrief → StabilityRing + Risks                    │  │
│  │  FinancePanel → MarketWatch + MarketGraph + SignalBadge  │  │
│  │  FlightConsole → Military flight tracker                 │  │
│  │  PredictionPanel → AI escalation forecasts               │  │
│  │  GlobalRiskIndex → Composite threat score                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ DashboardOverlays ──────────────────────────────────────┐  │
│  │  OmniCommand (Ctrl+K) + WargameModal + KeyboardShortcuts │  │
│  │  ToastNotifications + TerminalLoader + PageLoader        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
VERIDIAN/
├── client/                                  # ⚛️ React 18 + Vite Frontend
│   ├── public/
│   │   └── favicon.png
│   ├── index.html                           # Google Fonts + Font Awesome CDN
│   ├── src/
│   │   ├── components/
│   │   │   ├── Globe.jsx                    # 🌍 Globe.gl 3D globe — event dots, arcs, heatmap
│   │   │   ├── Map2D.jsx                    # 🗺️ Mapbox GL JS flat 2D map
│   │   │   ├── Navbar.jsx                   # 🧭 Logo, UTC clock, event count, search
│   │   │   ├── Ticker.jsx                   # 📡 Scrolling tension alert ticker bar
│   │   │   ├── NewsPanel.jsx                # 📰 Live intelligence news feed
│   │   │   ├── CountryBrief.jsx             # 🤖 AI country brief slide-in panel
│   │   │   ├── FinancePanel.jsx             # 📈 GeoTrade signal engine
│   │   │   ├── MarketWatch.jsx              # 💹 Live market data
│   │   │   ├── MarketGraph.jsx              # 📊 Market price charts and sparklines
│   │   │   ├── FlightConsole.jsx            # ✈️ Military flight tracker
│   │   │   ├── RegionPanel.jsx              # 🗺️ 4 regional intelligence cards
│   │   │   ├── FilterBar.jsx                # 🔽 Event type + time range filters
│   │   │   ├── GlobalRiskIndex.jsx          # 🔴 Composite global risk score
│   │   │   ├── PredictionPanel.jsx          # 🔮 AI escalation predictions
│   │   │   ├── SitrepPanel.jsx              # 📋 Auto-generated Situation Reports
│   │   │   ├── WargameModal.jsx             # 🎮 AI wargame scenario simulator
│   │   │   ├── OmniCommand.jsx              # ⌘ Ctrl+K command palette
│   │   │   ├── NetworkGraph.jsx             # 🕸️ Entity relationship graph
│   │   │   ├── SystemTelemetry.jsx          # 📟 Live system health stats
│   │   │   ├── TargetingCursor.jsx          # 🎯 Military-style crosshair cursor
│   │   │   ├── TimelineScrubber.jsx         # ⏱️ Draggable historical event timeline
│   │   │   └── ToastNotifications.jsx       # 🔔 Alert toast notification system
│   │   │
│   │   ├── context/
│   │   │   ├── DataContext.jsx              # 📦 Global data state
│   │   │   └── UIContext.jsx                # 🎛️ UI state — panels, modals, view mode
│   │   │
│   │   ├── hooks/
│   │   │   ├── useGlobeData.js
│   │   │   ├── useNewsData.js
│   │   │   ├── useFinanceData.js
│   │   │   ├── useAIData.js
│   │   │   ├── useSocket.js
│   │   │   ├── useTacticalAudio.js
│   │   │   └── useTacticalVoice.js
│   │   │
│   │   ├── layouts/
│   │   │   ├── DashboardHeader.jsx
│   │   │   ├── DashboardLeftPanel.jsx
│   │   │   ├── DashboardCenter.jsx
│   │   │   ├── DashboardRightPanel.jsx
│   │   │   └── DashboardOverlays.jsx
│   │   │
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                        # Tailwind + CSS variables + animations
│   │
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                                  # 🖥️ Node.js + Express Backend
│   ├── models/
│   │   ├── BriefCache.js                    # AI briefs — 15-min TTL
│   │   ├── EventCache.js                    # GDELT/ACLED events — 5-min TTL
│   │   └── SignalHistory.js                 # Last 5 AI signals per ticker
│   │
│   ├── routes/
│   │   ├── events.js                        # GET /api/events
│   │   ├── news.js                          # GET /api/news
│   │   ├── finance.js                       # GET /api/finance/:ticker
│   │   ├── flights.js                       # GET /api/flights
│   │   ├── ai.js                            # POST /api/ai/brief + /api/ai/signal
│   │   └── cyber.js                         # GET /api/cyber
│   │
│   ├── services/
│   │   ├── groqService.js                   # 4-key Groq rotation + Gemini fallback
│   │   └── cacheService.js                  # In-memory Map() cache — 5-min TTL
│   │
│   ├── .env.example
│   ├── index.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🔌 APIs Used

| Category | Service | Key Required? | Free Limit |
|----------|---------|:---:|------------|
| **Globe** | Globe.gl | No | Unlimited |
| **Map** | Mapbox GL JS | Yes (free) | 50,000 loads/mo |
| **Map (Fallback)** | MapLibre GL JS | No | Unlimited |
| **Geopolitical Events** | GDELT Project API | No | Unlimited |
| **Conflict Data** | ACLED API | Yes (free) | Free for researchers |
| **News** | NewsAPI.org | Yes (free) | 100 req/day |
| **News (RSS)** | rss-parser npm | No | Unlimited |
| **Earthquakes** | USGS Earthquake API | No | Unlimited |
| **Country Metadata** | RestCountries API | No | Unlimited |
| **AI (Primary)** | Groq API — 4 rotating keys | Yes (free) | Free tier |
| **AI (Fallback)** | Google Gemini API | Yes (free) | 15 req/min |
| **Stocks/Commodities** | yahoo-finance2 npm | No | Unlimited |
| **Crypto** | CoinGecko API | No | 10,000 req/mo |
| **Forex** | ExchangeRate API | Yes (free) | 1,500 req/mo |
| **Market Sentiment** | alternative.me API | No | Unlimited |
| **Flights** | OpenSky Network API | No | Free (anonymous) |
| **Botnets** | abuse.ch Feodo Tracker | No | Unlimited |
| **Malware** | URLhaus API | No | Unlimited |
| **Internet Outages** | Cloudflare Radar API | Yes (free) | Free |
| **Icons** | Font Awesome 6 Free | No | Unlimited (CDN) |
| **Fonts** | Google Fonts | No | Unlimited (CDN) |

---

## 🔑 Environment Variables

Create a `.env` file inside `server/`:

```env
# ─── AI — 4 Groq Keys for Round-Robin Rotation ───────────────────
GROQ_API_KEY_1=gsk_xxxxxxxxxxxxxxxxxxxx
GROQ_API_KEY_2=gsk_xxxxxxxxxxxxxxxxxxxx
GROQ_API_KEY_3=gsk_xxxxxxxxxxxxxxxxxxxx
GROQ_API_KEY_4=gsk_xxxxxxxxxxxxxxxxxxxx

# ─── AI Fallback ──────────────────────────────────────────────────
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxx

# ─── News & Event Data ────────────────────────────────────────────
NEWS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ACLED_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NASA_FIRMS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── Map ──────────────────────────────────────────────────────────
MAPBOX_TOKEN=pk.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── Finance ──────────────────────────────────────────────────────
EXCHANGE_RATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxx

# ─── Cyber ────────────────────────────────────────────────────────
CLOUDFLARE_RADAR_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── Database ─────────────────────────────────────────────────────
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/veridian
PORT=5000
```

| Variable | Required | Description |
|----------|:---:|-------------|
| `GROQ_API_KEY_1–4` | ✅ | 4 free Groq keys — create at console.groq.com |
| `GEMINI_API_KEY` | ⚡ | Google Gemini fallback |
| `NEWS_API_KEY` | ✅ | NewsAPI.org |
| `MAPBOX_TOKEN` | ✅ | Mapbox GL JS access token |
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `ACLED_API_KEY` | ⚡ | Conflict data (enhances globe) |
| `EXCHANGE_RATE_KEY` | ⚡ | Forex panel |
| `CLOUDFLARE_RADAR_KEY` | ⚡ | Cyber threat layer |

> **Legend:** ✅ Required · ⚡ Optional (enhances functionality)

> ⚠️ Never commit `.env` to version control. It is included in `.gitignore`.

---

## 🎨 Design System

VERIDIAN is designed to look and feel like a **military intelligence command centre** — deep navy backgrounds, glowing cyan and green accents, and data-dense layouts that communicate urgency and precision.

### Typography

| Font | Usage |
|------|-------|
| **Inter** | All UI text — headings, labels, body, badges |
| **JetBrains Mono** | All numerical data — prices, coordinates, scores, timestamps |

### Colour Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#0A0F1E` | Main background — deep space black |
| `--color-navy` | `#0D1B2A` | Sidebar / secondary background |
| `--color-panel` | `#111827` | Card / panel background |
| `--color-surface` | `#1E293B` | Elevated: dropdowns, hover states |
| `--color-border` | `#1E3A5F` | All borders and dividers |
| `--color-cyan` | `#00D4FF` | Primary — headings, globe glow, active states |
| `--color-green` | `#00FF88` | BUY signal, positive values, LOW severity |
| `--color-red` | `#EF4444` | SELL signal, CRITICAL alerts |
| `--color-orange` | `#F97316` | HIGH alerts |
| `--color-yellow` | `#EAB308` | HOLD signal, MEDIUM alerts |
| `--color-gold` | `#F59E0B` | BREAKING badge |
| `--color-purple` | `#7C3AED` | Cyber threat layer |

### Panel Style — Glassmorphism

```css
.panel {
  background: rgba(13, 27, 42, 0.85);
  border: 1px solid #1E3A5F;
  border-top: 1px solid rgba(0, 212, 255, 0.30);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  box-shadow: 0 0 24px rgba(0, 212, 255, 0.06);
}
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **MongoDB Atlas** account ([Sign up](https://www.mongodb.com/cloud/atlas))
- At least **1 Groq API key** ([Get free key](https://console.groq.com))
- **Mapbox** access token ([Sign up](https://www.mapbox.com/))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/veridian.git
cd veridian

# 2. Install server dependencies
cd server && npm install

# 3. Install client dependencies
cd ../client && npm install

# 4. Set up environment variables
cd ../server
cp .env.example .env
# Fill in your API keys in .env

# 5. Start both services

# Terminal 1 — Backend (port 5000)
cd server && node index.js

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Visit `http://localhost:5173` — the globe loads automatically. No login required.

### Running with Concurrently

```bash
# From project root
npm run dev    # Starts client and server simultaneously
```

---

## 🚢 Deployment

### Frontend → Vercel

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set **Root Directory** to `client`
3. Set **Build Command** to `npm run build`
4. Set **Output Directory** to `dist`

### Backend → Railway

1. Create a new project on [Railway](https://railway.app)
2. Set **Root Directory** to `server`
3. Set **Start Command** to `node index.js`
4. Add all environment variables from the `.env` template

---

## 🗄️ Database Models

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   BriefCache    │     │   EventCache    │     │ SignalHistory   │
│─────────────────│     │─────────────────│     │─────────────────│
│ countryName     │     │ source          │     │ ticker          │
│ brief           │     │ events[]        │     │ signal          │
│ stabilityScore  │     │ ├─ title        │     │ confidence      │
│ risks[]         │     │ ├─ lat/lon      │     │ reasoning       │
│ outlook         │     │ ├─ severity     │     │ geopoliticalCtx │
│ headlines[]     │     │ ├─ iso2         │     │ price           │
│ createdAt (TTL) │     │ └─ timestamp    │     │ createdAt       │
│ expiresAt       │     │ fetchedAt (TTL) │     │ expiresAt       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
    15-min TTL               5-min TTL            Per-ticker history
```

---

## 🔌 API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/events` | Aggregated GDELT + ACLED + USGS events with coordinates |
| `GET` | `/api/news` | Multi-source news feed — severity-tagged |
| `GET` | `/api/finance/:ticker` | Live price data via yahoo-finance2 |
| `GET` | `/api/flights` | OpenSky Network military aircraft positions |
| `GET` | `/api/cyber` | Cyber threat data — abuse.ch + URLhaus + Cloudflare Radar |
| `POST` | `/api/ai/brief` | AI country intelligence brief (Groq × 4 + Gemini fallback) |
| `POST` | `/api/ai/signal` | AI `BUY`/`HOLD`/`SELL` trading signal with reasoning |

---

## 🏆 The Pitch in One Line

> **"Every tool shows you WHAT is happening. VERIDIAN tells you WHAT TO DO about it."**

`Built in 24 hours` · `MERN Stack` · `$0 to run` · `Zero mock data` · `30+ free APIs`
