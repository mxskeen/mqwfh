# UK Wind Power Day-Ahead Trading Desk

Full-stack quantitative analytics and day-ahead procurement decision support system for UK wholesale electricity market trading, powered by live Elexon BMRS market data (January 2026).

## Live Deployments

- Frontend (Vercel): [https://mqwfh.vercel.app](https://mqwfh.vercel.app)
- Backend API (Render): [https://mqwfh-api.onrender.com](https://mqwfh-api.onrender.com)
- Interactive API Docs (Swagger): [https://mqwfh-api.onrender.com/docs](https://mqwfh-api.onrender.com/docs)

## Key Capabilities

- Point-in-time Day-Ahead forecast slicing with configurable gate closure cutoffs (default: 11:00 UTC D-1).
- Quantitative error evaluation across all 48 settlement periods: MAE, RMSE, Directional Bias, and WAPE.
- Hourly to half-hourly settlement period mapping aligning WINDFOR forecasts with FUELHH actuals.
- Procurement simulator calculating required thermal dispatch and dynamic safety reserve buffers (P75, P90, P95).
- Baseten Mammoth-1 decision model integration for tail-risk triage and hedge recommendations.
- Macro monthly analysis across 1,488 settlement periods in January 2026.

## Quickstart

### Method 1: Docker Compose (Recommended)

Run the entire stack in isolated production containers:

```bash
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Method 2: Manual Local Setup

#### Prerequisites
- Python 3.12+ (or `uv`)
- Node.js 20+ and npm

#### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   uv sync
   ```

3. (Optional) Set OpenRouter API key for live Mammoth-1 model inference in `.env`:
   ```bash
   OPENROUTER_API_KEY=your_key_here
   ```

4. Start the backend server:
   ```bash
   uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

The database comes pre-seeded with all 21,393 records for January 2026. If the database file is absent, the backend automatically triggers an ingestion run on startup against Elexon BMRS.

#### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

Open http://localhost:5173 to access the trading desk.

## Running Tests

Execute the backend automated test suite:

```bash
cd backend
uv run pytest
```

The test suite covers:
- Metric calculations (MAE, RMSE, Directional Bias, WAPE).
- Settlement period time-window slicing and evening peak identification.
- Point-in-time D-1 cutoff logic ensuring zero forward-looking data leakage.
- Half-hour resolution mapping between hourly forecasts and half-hourly actuals.
- FastAPI endpoint responses and error handling.

## Data Methodology

### 1. Ingestion Layer
Data is ingested directly from the official Elexon BMRS REST API:
- `FUELHH` (Fuel Inst Half-Hourly): Actual wind generation by fuel type.
- `WINDFOR` (Wind Generation Forecast): Generation forecasts published ahead of time.

### 2. Settlement Period Alignment
UK electricity trading operates on 48 half-hour settlement periods per day. Elexon `FUELHH` reports in half-hour intervals (`00:00`, `00:30`), while `WINDFOR` reports on the hour (`00:00`, `01:00`). Each hourly forecast period is mapped to both corresponding settlement periods (for example, `14:00` forecast covers SP 29 at 14:00 and SP 30 at 14:30).

### 3. Point-in-Time Day-Ahead Evaluation
To prevent look-ahead bias, metrics are computed strictly using forecasts published before the delivery day cutoff. At the standard EPEX day-ahead auction cutoff (11:00 UTC at D-1), any forecast revisions published after 11:00 UTC are excluded from the day-ahead benchmark.

## Repository Structure

```
.
|-- backend/
|   |-- app/
|   |   |-- routes/
|   |   |   |-- analytics.py      # Daily and monthly quantitative metrics endpoints
|   |   |   |-- decision.py       # Dispatch simulation and AI risk triage endpoints
|   |   |   `-- health.py         # System health and database record counter
|   |   |-- analytics.py          # Point-in-time forecast slicing and statistical engine
|   |   |-- config.py             # Pydantic environment settings
|   |   |-- db.py                 # SQLite connection management and schema setup
|   |   |-- decision_engine.py    # Procurement calculator and Mammoth-1 integration
|   |   |-- elexon_client.py      # Elexon BMRS API client (FUELHH & WINDFOR streams)
|   |   |-- ingest.py             # Backfill and stream ingestion pipeline
|   |   |-- main.py               # FastAPI application entrypoint and lifespan handler
|   |   `-- schemas.py            # Pydantic request and response schemas
|   |-- data/
|   |   `-- elexon_wind.db        # Pre-seeded SQLite database (January 2026 dataset)
|   |-- tests/
|   |   |-- test_analytics.py     # Unit tests for statistical calculations and SP mapping
|   |   `-- test_api.py           # Integration tests for FastAPI endpoints
|   |-- Dockerfile                # Production backend container definition
|   |-- Procfile                  # Process file for Render/Heroku deployment
|   `-- pyproject.toml            # Python package dependencies and metadata
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |   |-- AiRiskGuard.tsx           # Mammoth-1 model telemetry and hedge signals
|   |   |   |-- Header.tsx                # Navigation, delivery date, and gate selector
|   |   |   |-- KpiCards.tsx              # MAE, RMSE, Bias, and WAPE indicator cards
|   |   |   |-- MonthlyAnalysis.tsx       # 31-day macro trend chart and daily ledger
|   |   |   |-- ProcurementSimulator.tsx  # Interactive order book and trade generator
|   |   |   |-- SettlementMatrixStrip.tsx # 48 settlement periods status strip
|   |   |   |-- TimeseriesChart.tsx       # 48 SP dispatch curve with error spread
|   |   |   `-- TradingPanel.tsx          # Real-time bid execution panel
|   |   |-- api.ts                # Strongly typed API client
|   |   |-- App.tsx               # Main layout and tab state orchestration
|   |   |-- index.css             # Tailwind v4 theme configuration
|   |   |-- main.tsx              # React DOM mounting entrypoint
|   |   `-- types/index.ts        # TypeScript data interfaces
|   |-- Dockerfile                # Multi-stage production build (Node + Nginx)
|   |-- nginx.conf                # Nginx proxy and static SPA routing config
|   |-- package.json              # Frontend dependencies and build scripts
|   `-- vercel.json               # Vercel deployment rewrite rules
|-- docker-compose.yml            # Multi-container orchestration definition
|-- render.yaml                   # Infrastructure-as-code definition for Render
`-- README.md
```

## AI Tools Used

In accordance with submission requirements, development of this solution utilized:
- Gemini 3.8 Flash (via agy CLI): Scaffolding API schemas, component layout styling, and test generation.
- Baseten Mammoth-1 (via OpenRouter Alpha Decisions API): Decision model used in the application for automated shortfall risk evaluation and reserve buffer sizing.
