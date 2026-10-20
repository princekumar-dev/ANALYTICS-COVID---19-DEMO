<div align="center">

# Agentic Dashboard — COVID-19 Analytics Demo

### Global health data with interactive charts, a 3D globe, and 90-day LSTM forecasts

[![Next.js](https://img.shields.io/badge/Next.js-App_Router-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Three.js](https://img.shields.io/badge/Three.js-r180-000000?style=flat-square&logo=threedotjs&logoColor=white)](https://threejs.org)
[![Recharts](https://img.shields.io/badge/Recharts-3-38bdf8?style=flat-square)](https://recharts.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.2-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

## 🎯 Overview

A lightweight **Next.js + React** dashboard for exploring COVID-style global health data. It renders interactive charts, a **3D globe** with per-country case markers, and **model-driven 90-day forecasts** — and it all runs on generated demo data, so you can prototype and share insights with zero backend.

Built to import real CSVs when you have them, inspect trends, compare predictions, and export results.

## ✨ Features

- 🌍 **3D globe** (three.js + `@react-three/fiber` + `drei`) — per-country markers sized and colored by active cases, with hover tooltips and click-to-select
- 📈 **Interactive charts** (Recharts) — global trends, top-10 countries, pie distribution, vaccination progress, and per-country sparklines
- 📊 **KPI panels** — totals, active, recovered, deaths, and vaccination rate at a glance
- 📂 **CSV import** (PapaParse) — upload your own dataset to drive the whole dashboard
- 🔮 **LSTM-style forecasting** — a hand-written recurrent model in TypeScript produces 90-day forecasts with confidence intervals
- 🧪 **Mock data generator** — plausible demo dataset so the app runs instantly, no API needed
- 📤 **CSV export** and API stubs for sharing results with a team

## 🗺️ Pages & Components

| File | Role |
|------|------|
| `app/page.tsx` | Top-level page composing `Navigation`, `DataPanels`, `GlobeVisualization`, `ChartsSection` |
| `app/layout.tsx` | Root layout + global styles |
| `components/ChartsSection.tsx` | Global trend lines, top-10 list, pie chart, vaccination area chart, sparkline |
| `components/GlobeVisualization.tsx` | 3D globe and country markers |
| `components/DataPanels.tsx` | KPI cards (totals, active, recovered, deaths, vaccination rate) |
| `components/UploadSection.tsx` | CSV upload via PapaParse |
| `components/Navigation.tsx` | App navigation bar |
| `utils/dataProcessor.ts` | Data pipeline: mock generation, CSV aggregation, LSTM predictions |
| `types/index.ts` | Shared TypeScript interfaces |

## 🧱 Data Contract

Everything flows through one `ProcessedData` shape, which `ChartsSection` and `GlobeVisualization` expect:

```ts
interface ProcessedData {
  global: {
    totalCases: number; activeCases: number; recovered: number
    deaths: number; vaccinated: number; vaccinationRate: number
  }
  countries: CountryData[]
  timeSeries: TimeSeriesData[]
  predictions: PredictionData[]
}
```

Each `CountryData` carries totals, trend flags, and optional per-state `states`.

## 🚀 Quick Start

**Requirements:** Node.js 18+ and npm

```bash
git clone https://github.com/princekumar-dev/ANALYTICS-COVID---19-DEMO.git
cd ANALYTICS-COVID---19-DEMO
npm install
npm run dev
```

Open **http://localhost:3000**.

### Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npx tsc --noEmit` | Type-check |

## 📡 Data Pipeline (`utils/dataProcessor.ts`)

Key functions:

| Function | What it does |
|----------|--------------|
| `generateTimeSeries()` | Builds a 365-day global series from 2023-01-01 (base + drift + noise) |
| `generateMockData()` | Mock `CountryData[]` (US, India, Brazil, …) with randomized totals and global sums |
| `generatePredictions(ts)` | 90-day forecast via the LSTM model, with central estimate + bounds |
| `processCovidData(raw)` | Aggregates raw `CovidData[]` into `ProcessedData` |

### 🔮 The LSTM Forecast Model

The forecasting core is **implemented in TypeScript** (no Python, no server) in `utils/dataProcessor.ts`:

- **`lstmPredict(sequence, predictionLength)`** — the recurrent forecast function
- **`preprocessData()` / `normalizeData()`** — clean and min-max scale the sequence (scaler params are kept so outputs can be inverted)
- **`calculateSeasonalFactors()` / `calculateGrowthRate()`** — capture weekly/yearly seasonality and trend

**How it predicts:** it learns temporal patterns from a sliding window of recent daily counts and unrolls them forward for the requested horizon. Confidence intervals are derived from the model's uncertainty estimate, returned as `lowerBound` / `upperBound` on each forecast point.

> ⚠️ **Accuracy note:** these forecasts are for demonstration. LSTM models can capture temporal patterns far better than a naive rule, but production-grade forecasting still needs careful preprocessing, regular retraining, and robust backtesting. Compare against ARIMA/exponential baselines (see below) before trusting them operationally.

## 📈 Charts & UI (`components/ChartsSection.tsx`)

- Uses `recharts` + `ResponsiveContainer` for responsive charts
- Global trend chart plots Cases / Recovered / Deaths from `timeSeries`
- Top-10 panel shows rank + totals; clicking a country opens a detail panel with a sparkline (falls back to a jittered global series when a real per-country series isn't available)
- Pie chart shows Active / Recovered / Deaths; a custom `PieTooltip` computes percentages consistently across Recharts versions
- Custom dark-themed tooltips (`CountryTooltip`, `PieTooltip`)

## 🌍 Globe Visualization (`components/GlobeVisualization.tsx`)

- Renders a textured sphere (or a plain fallback if the texture is missing)
- Country markers are positioned by lat/lon → spherical coords: `phi = (90 − lat)`, `theta = (lon + 180)`
- Marker size scales with active cases; color reflects intensity
- Hover shows an HTML tooltip (`<Html>` from `drei`); click fires `onCountrySelect`

**To get the textured globe:** add any low-res 2:1 equirectangular map at `public/earthmap.jpg`. Without it, the component falls back to a shaded sphere (no crash).

## 🔌 Using Real Data

1. Collect rows as `CovidData[]` (see `types/index.ts`)
2. Call `processCovidData(rawRows)` from `utils/dataProcessor.ts`
3. Feed the result into page state (`setCovidData(processed)`) in `app/page.tsx`
4. For real per-country sparklines, attach `country.timeSeries = TimeSeriesData[]` to each country

Sample datasets are included: [`demo-data.csv`](demo-data.csv) and [`test_complex_covid_data.csv`](test_complex_covid_data.csv).

## 🧪 Evaluation & Backtesting

For anyone extending the model:

- Use **walk-forward backtesting** (train on `t0..tN`, validate on the next block) to avoid look-ahead bias and compute RMSE / MAPE over rolling windows
- Compare forecasts to baselines (exponential, ARIMA) with the **Diebold–Mariano** test or paired comparisons with Newey–West correction
- For uncertainty, try Monte-Carlo dropout, quantile regression, or ensembles of differently-initialized models
- In production: retrain weekly, monitor drift, and version model artifacts + scaler params with their metadata

## 🛠️ Troubleshooting

- **`EADDRINUSE` (port in use):** `npx kill-port 3000`, or run `npm run dev -- -p 3001`
- **Missing `three` / `recharts` modules:** `npm i three @react-three/fiber @react-three/drei recharts`
- **`lightningcss` native-binding errors (Windows):** switch to the JS PostCSS adapter or install the matching native build; as a temporary workaround you can comment out `import './globals.css'` in `app/layout.tsx`

## 📄 License

All rights reserved.
