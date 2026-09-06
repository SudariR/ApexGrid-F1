# ApexGrid F1 — Telemetry & Championship Prediction API

A high-performance Formula 1 data API that powers an interactive F1 dashboard.
It pulls live race telemetry and results via **FastF1**, computes analytics
(pace consistency, tire degradation) and statistical championship predictions
(Monte Carlo simulation), and serves it all through a clean, versioned,
self-documenting REST API.

Built for the **backend** of a two-part project (`frontend/` is developed in
parallel against this API contract).

---

## Features

| Feature | Endpoint | Description |
|---|---|---|
| 🏁 Podium spotlight | `GET /api/v1/hero/latest` | Winner + podium of the most recent completed GP |
| 🏆 Standings | `GET /api/v1/standings` | Drivers' + Constructors' championship standings |
| 🏎️ Telemetry map | `GET /api/v1/telemetry/compare` | Two drivers' laps aligned by distance (x, y, speed, throttle, brake, gear, DRS) |
| 📊 Pace consistency | `GET /api/v1/analytics/pace` | Clean-lap statistics + KDE distribution for one driver |
| 🔧 Tire degradation | `GET /api/v1/analytics/tire-degradation` | s/lap degradation per stint via linear regression |
| 🔮 Predictor | `POST /api/v1/predictor/simulate` | Monte Carlo championship win probabilities + What-If |
| ⚔️ Head-to-head | `GET /api/v1/headtohead/teammates` | Teammate qualifying duels + Elo ratings |

Interactive auto-generated docs: **`http://localhost:8000/docs`**

---

## Tech stack

- **Python 3.11+**, **FastAPI**, **Uvicorn**
- **FastF1** (live F1 data, with on-disk cache)
- **pandas / numpy / scipy** (data processing, KDE, linear regression)
- **Pydantic** / **pydantic-settings** (typed config + response schemas)
- **pytest** + FastAPI TestClient (testing)

---

## Architecture

The backend is **strictly layered** so it never couples to the frontend and
stays easy to change. The frontend only ever sees the **JSON contract**
(shapes declared in `app/models/schemas.py` and documented in `/docs`).

```
HTTP request
   │
   ▼
┌──────────────────────────────┐   app/api/v1/endpoints/*.py
│  ROUTES (thin)              │   parse params, validate, return schema
│  - no business logic        │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐   app/services/*.py
│  SERVICES (logic)           │   orchestrate data + analytics
│  - pure engines (testable)  │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐   app/services/fastf1_service.py
│  DATA LAYER (single access) │   ALL fastf1/ergast/pandas access here
│  - FastF1 disk cache        │
└──────────────────────────────┘
```

**Key design principles**
- **Contract-first:** response shapes are Pydantic models (`app/models/schemas.py`) → validated, documented, stable.
- **Versioned API:** everything lives under `/api/v1` so breaking changes can move to `/api/v2`.
- **Layered:** routes call services call the data layer — never mix them.
- **Defensive data access:** fastf1's live provider can be flaky; failures become clean HTTP `503`, never crashes.
- **Pure engines:** the Monte Carlo and Elo engines do no I/O, making them deterministic and unit-testable offline.
- **Response caching:** expensive results are cached in-process (TTL) with `?refresh=1` to bypass.

---

## Getting started

### Prerequisites
- Python 3.11+
- `git`

### 1. Clone & set up
```bash
git clone <your-repo-url>
cd apexgrid-f1/backend
python3 -m venv .venv            # Windows: python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run the server
```bash
uvicorn app.main:app --reload --port 8000
```
Open **http://localhost:8000/docs** for the interactive API.

> On first data request, the API downloads from fastf1's live sources (needs
> internet) and caches to `backend/cache/` (gitignored) for fast repeat calls.

### 3. Run the tests
```bash
pytest -v
```

---

## Example requests

**Latest race hero / podium**
```bash
curl http://localhost:8000/api/v1/hero/latest
```

**Standings (current season)**
```bash
curl http://localhost:8000/api/v1/standings
```

**Telemetry comparison (two drivers, qualifying fastest lap)**
```bash
curl "http://localhost:8000/api/v1/telemetry/compare?driver_a=NOR&driver_b=RUS&round=12&season=2026&session=Q"
```

**Monte Carlo prediction (What-If: Antonelli has a 30% DNF chance per race)**
```bash
curl -X POST http://localhost:8000/api/v1/predictor/simulate \
  -H "Content-Type: application/json" \
  -d '{"season":2026,"n_simulations":10000,"seed":42,"overrides":[{"code":"ANT","dnf_probability":0.30}]}'
```

---

## Project layout

```
apexgrid-f1/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app factory + CORS + router mount
│   │   ├── api/v1/endpoints/       # thin HTTP route handlers
│   │   │   ├── health.py, hero.py, standings.py, telemetry.py,
│   │   │   ├── analytics.py, predictor.py, headtohead.py
│   │   │   └── router.py           # aggregates all v1 routers
│   │   ├── core/                   # config + caching
│   │   │   ├── config.py
│   │   │   ├── ttl_cache.py
│   │   │   └── cache_deps.py
│   │   ├── models/schemas.py       # Pydantic response contract
│   │   └── services/               # business logic + data access
│   │       ├── fastf1_service.py   # ALL fastf1/ergast/pandas access
│   │       ├── race_service.py, standings_service.py, telemetry_service.py,
│   │       ├── analytics_service.py, predictor_service.py, headtohead_service.py
│   │       ├── simulation_engine.py   # pure Monte Carlo
│   │       ├── headtohead_engine.py   # pure Elo
│   │       └── errors.py
│   ├── cache/                      # FastF1 disk cache (gitignored)
│   ├── tests/                      # pytest suite
│   └── requirements.txt
├── frontend/                       # (developed in parallel)
└── README.md
```

---

## Testing

Run the whole suite:
```bash
pytest -v
```

The tests are **layered** to match the code:
- **Schema tests** (`test_schemas.py`) — the JSON contract shapes.
- **Pure-engine tests** (`test_simulation_engine.py`, `test_headtohead_engine.py`,
  `test_analytics_service.py`, `test_telemetry_service.py`) — algorithms verified
  offline with synthetic data.
- **HTTP integration tests** (`test_api_integration.py`) — routing + schema
  serialization + error handling, with the service layer mocked.

---

## Notes & known limitations

- **Live data dependency:** FastF1 scrapes unofficial live sources which are
  occasionally slow or rate-limited. When they are, lap/telemetry endpoints
  return HTTP `503` (degraded gracefully). Standings/hero use a different,
  more reliable source.
- **Ratings are a modelling choice:** the predictor's default driver rating is
  derived from championship points. A richer lap-pace-based rating can replace
  it without changing the engine.
