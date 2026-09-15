# ApexGrid F1 — Full-Stack Telemetry & Championship Prediction Platform

A high-performance Formula 1 data and intelligence platform. It pairs a vectorized **FastAPI** analytical engine powered by **FastF1** with a modern, high-octane **Next.js 14** interactive dashboard.

ApexGrid pulls telemetry and race results, computes deep performance analytics (pace consistency distributions, tire degradation curves, teammate qualifying Elo), runs high-speed statistical championship simulations (vectorized Monte Carlo engine), and serves it all through an interactive web experience and a typed, self-documenting REST API.

---

## Features & Endpoints

| Feature | Endpoint | Description |
|---|---|---|
| 🏁 Podium Spotlight | `GET /api/v1/hero/latest` | Winner + podium of the most recent completed Grand Prix |
| 🏆 Standings | `GET /api/v1/standings` | Drivers' & Constructors' championship standings with delta positions |
| 📅 Race Schedule | `GET /api/v1/schedule` | Complete season race calendar, circuit metadata, and sprint rounds |
| 🏎️ Telemetry Map | `GET /api/v1/telemetry/compare` | Two drivers' laps aligned by distance (speed, throttle, brake, gear, DRS) |
| 📊 Pace Consistency | `GET /api/v1/analytics/pace` | Clean-lap statistics + Gaussian KDE distribution for driver race pace |
| 🔧 Tire Degradation | `GET /api/v1/analytics/tire-degradation` | s/lap degradation per stint via linear regression by compound |
| 🔮 Predictor | `POST /api/v1/predictor/simulate` | Vectorized Monte Carlo championship win probabilities + What-If overrides |
| ⚔️ Head-to-Head | `GET /api/v1/headtohead/teammates` | Teammate qualifying duels + Elo rating matrix |

- Interactive Backend API Docs: **`http://localhost:8000/docs`**
- Frontend Web Dashboard: **`http://localhost:3000`**

---

## Tech Stack

### Frontend
- **Next.js 14** (App Router) & **React 18**
- **TypeScript** for strict type safety across all API responses
- **Tailwind CSS** with a custom high-contrast F1 design system (dark carbon/asphalt surfaces, neon accents `#00FF66` / `#D2FF00`, team livery color tokens)
- **Framer Motion & GSAP** (`@gsap/react`) for fluid telemetry transitions, magnetic interactions, and glitch typography
- **Three.js** for interactive 3D driver helmet and spatial visualizations
- **Recharts** for telemetry speed delta charts, lap pace distributions, and degradation curves
- **Lenis** for smooth inertia scrolling orchestration
- **SWR** for reactive data fetching with automatic caching and graceful mock fallback

### Backend
- **Python 3.11+**, **FastAPI**, **Uvicorn**
- **FastF1** (live telemetry, session data, on-disk parquet cache)
- **NumPy / pandas / SciPy** (vectorized simulations, KDE distributions, linear regression)
- **Pydantic** / **pydantic-settings** (typed API schemas & environment configuration)
- **pytest** + FastAPI TestClient (comprehensive testing suite)

---

## Full-Stack Architecture

ApexGrid is **strictly layered** and **contract-driven**. The frontend communicates with the backend exclusively via the typed `/api/v1` REST contract, with built-in mock fallbacks to guarantee uninterrupted UI exploration even if upstream providers are offline.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 14)                           │
│                                                                        │
│  Main Dashboard (/)              Analytics & Predictor (/analytics)    │
│  ├─ Hero Podium Spotlight        ├─ Clean-Lap Pace KDE Distribution   │
│  ├─ Standings (3D Helmets)       ├─ Stint Tire Degradation Modeling   │
│  └─ Season Timeline Calendar     ├─ Teammate Qualifying Elo Matrix    │
│                                  └─ Monte Carlo What-If Simulator     │
│                                                                        │
│  SWR Client Layer (with automatic mock fallback for live resilience)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (FastAPI)                               │
│                                                                        │
│  app/api/v1/endpoints/  ──▶  app/services/  ──▶  app/services/fastf1  │
│  - Thin route handlers       - Business logic    - FastF1 Disk Cache   │
│  - Schema validation         - Vectorized NumPy  - Ergast API access   │
│  - In-memory TTL/LRU Cache   - Pure Elo engine                         │
└────────────────────────────────────────────────────────────────────────┘
```

**Key Architectural Principles:**
- **Contract-First Design:** Response shapes are defined as Pydantic models in the backend (`app/models/schemas.py`) and mirrored as TypeScript interfaces in the frontend (`src/types/`).
- **Resilient Fallback System:** If upstream FastF1 data is unavailable or slow, the backend fails gracefully with HTTP `503`, and the frontend seamlessly switches to mock data with a live status indicator (`_isLive`).
- **Vectorized High-Speed Compute:** Monte Carlo championship predictions are vectorized with NumPy array operations (~30× speedup over scalar loops), capable of crunching 50,000 season simulations in ~0.4s.
- **Bounded Caching:** FastF1 caches session data on disk, while hot API responses are held in an in-process TTL + LRU cache.

---

## Frontend Overview

The frontend application provides an interactive, TV-broadcast-grade analytics portal organized across two primary routes:

### 1. Main Dashboard (`/`)
- **Hero & Podium Spotlight:** Showcases the latest completed Grand Prix winner and podium finishers with circuit track map visualizations and car annotations.
- **Drivers & Constructors Standings:** Interactive leaderboards with positions, points, wins, podiums, position deltas, team color liveries, 3D helmet viewer, and a detailed flyout drawer (`StandingsDrawer`).
- **Season Timeline & Calendar:** Interactive schedule with circuit layouts, race countdowns, sprint indicators, and historical race results.

### 2. Performance Analytics & Predictor (`/analytics`)
- **Pace Consistency Analysis:** Outlier-filtered clean-lap distributions, Gaussian KDE pace curves, and stint-by-stint comparisons.
- **Tire Degradation Modeling:** Stint degradation linear regressions measuring seconds lost per lap across tire compounds (Soft, Medium, Hard).
- **Teammate Head-to-Head Duels:** Qualifying head-to-head scorecards and Elo rating tracking across driver pairings.
- **Monte Carlo Championship Predictor & What-If Engine:** Interactive controls to adjust simulation volume, random seed, chaos variance, and per-driver custom overrides (e.g., custom DNF probabilities or performance modifiers).
- **Telemetry Comparator:** Distance-aligned lap comparison between any two drivers with speed delta and throttle/brake inputs.

---

## Getting Started

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & `npm`
- `git`

---

### Backend Setup

1. **Navigate to the backend folder:**
   ```bash
   cd apexgrid-f1/backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Linux/macOS
   python3 -m venv .venv
   source .venv/bin/activate

   # Windows
   python -m venv .venv
   .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the API server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The API will be available at **`http://localhost:8000`** (Docs: `http://localhost:8000/docs`).

5. **Run backend tests:**
   ```bash
   pytest -v
   ```

---

### Frontend Setup

1. **Navigate to the frontend folder:**
   ```bash
   cd apexgrid-f1/frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env.local` file (or copy from `.env.example`):
   ```bash
   cp .env.example .env.local
   ```
   Default configuration:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
   NEXT_PUBLIC_SITE_NAME=ApexGrid F1
   NEXT_PUBLIC_ACCENT_COLOR=#D2FF00
   NEXT_PUBLIC_USE_MOCK_FALLBACK=true
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open **`http://localhost:3000`** in your browser.

5. **Build for production:**
   ```bash
   npm run build
   npm run start
   ```

6. **Run linter:**
   ```bash
   npm run lint
   ```

---

## Project Layout

```
apexgrid-f1/
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI app factory + CORS + router mount
│   │   ├── api/v1/endpoints/           # HTTP route handlers
│   │   │   ├── health.py               # Health checks
│   │   │   ├── hero.py                 # Latest race podium & winner
│   │   │   ├── standings.py            # Driver and constructor standings
│   │   │   ├── schedule.py             # Season race calendar
│   │   │   ├── telemetry.py            # Distance-aligned lap telemetry
│   │   │   ├── analytics.py            # Pace consistency & tire degradation
│   │   │   ├── predictor.py            # Monte Carlo simulation engine
│   │   │   ├── headtohead.py           # Teammate duels & Elo ratings
│   │   │   └── router.py               # Aggregated v1 API router
│   │   ├── core/                       # Config, TTL cache, cache dependencies
│   │   ├── models/schemas.py           # Pydantic response contract
│   │   └── services/                   # Business logic, engines, FastF1 wrapper
│   ├── cache/                          # FastF1 disk cache (gitignored)
│   ├── tests/                          # 90+ unit and integration tests
│   ├── benchmarks/                     # Engine performance benchmarks
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/                        # Next.js App Router pages & layouts
│   │   │   ├── layout.tsx              # Root layout & font configurations
│   │   │   ├── page.tsx                # Main Dashboard route
│   │   │   ├── analytics/page.tsx      # Deep Analytics & Predictor route
│   │   │   └── globals.css             # Tailwind layers, tokens & custom animations
│   │   ├── components/                 # Modular React components
│   │   │   ├── hero/                   # HeroSection, CarAnnotation, TrackMap
│   │   │   ├── standings/              # Drivers/Constructors tables, Helmet3DViewer
│   │   │   ├── timeline/               # SeasonTimeline, Circuit previews
│   │   │   ├── analytics/              # PaceConsistency, TireDegradation, EloGrid
│   │   │   ├── predictor/              # Monte Carlo dashboard & What-If controls
│   │   │   ├── telemetry/              # Speed delta charts, lap comparison
│   │   │   ├── ui/                     # Navbar, Footer, Drawers, GlitchText, Buttons
│   │   │   └── providers/              # Smooth scroll (Lenis) provider
│   │   ├── lib/                        # API clients, mock data, color tokens, utils
│   │   └── types/                      # TypeScript schemas matching API contracts
│   ├── public/                         # Static assets (track SVGs, team badges)
│   ├── tailwind.config.js              # Theme extensions, F1 typography & colors
│   ├── tsconfig.json
│   └── package.json
│
└── README.md
```

---

## Example API Requests

**Latest race podium:**
```bash
curl http://localhost:8000/api/v1/hero/latest
```

**Standings (current season):**
```bash
curl http://localhost:8000/api/v1/standings
```

**Season Race Schedule:**
```bash
curl http://localhost:8000/api/v1/schedule?season=2026
```

**Telemetry comparison (fastest lap in qualifying):**
```bash
curl "http://localhost:8000/api/v1/telemetry/compare?driver_a=NOR&driver_b=RUS&round=12&season=2026&session=Q"
```

**Monte Carlo simulation with What-If scenario:**
```bash
curl -X POST http://localhost:8000/api/v1/predictor/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "season": 2026,
    "n_simulations": 10000,
    "seed": 42,
    "chaos_spread": 0.15,
    "overrides": [{"code": "ANT", "dnf_probability": 0.30}]
  }'
```

---

## Performance & Optimization

The Monte Carlo simulation engine was rewritten from scalar Python loops to **vectorized NumPy array operations**:
- Finishing order is calculated using **double-argsort**.
- Constructor point aggregations use **one-hot matrix multiplication**.
- Batch chunking maintains a constant, bounded memory footprint independent of simulation count.

| Simulations | Before (Scalar) | After (Vectorized) | Speedup |
|---|---|---|---|
| 1,000 | 0.324s | 0.024s | **13×** |
| 10,000 | 3.020s | 0.099s | **30×** |
| 50,000 | 14.773s | 0.441s | **33×** |

Reproduce benchmarks:
```bash
python benchmarks/bench_simulation.py
```

---

## Notes & Limitations

- **Live Upstream Dependencies:** FastF1 pulls live timing and session data from external sources. If upstream data is rate-limited or unavailable, the backend returns clean `503` responses, and the frontend automatically serves fallback data while informing the user.
- **Statistical Modeling Context:** The default Monte Carlo ratings derive from accumulated championship points (a lagging indicator) combined with calibrated variance. For production betting or strategic race engineer modeling, ratings should be augmented with rolling qualifying pace deltas, tire stint wear profiles, and track-specific safety car probability weights.
