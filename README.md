
# Agentic Dashboard — README

This README explains the project structure, how the charts and globe visualization work, how the (simple) prediction model is generated, and how to run and troubleshoot the app locally.

---

## Overview

This repository is a small Next.js + React dashboard that visualizes COVID-style data. It includes:

- A globe visualization using three.js and `@react-three/fiber` showing per-country markers sized and colored by active cases.
- Several charts built with `recharts` (global trends, top-10 countries, pie distribution, vaccination progress, small sparklines).
- A tiny data pipeline in `utils/dataProcessor.ts` that produces aggregated `ProcessedData` used by the UI. A `generateMockData()` helper produces demo data for the UI.
- A predictions generator (LSTM-based by default) producing 90-day forecasts.

This README documents how everything fits together and how to extend or replace parts with real data.

---

## Quick start

Requirements
- Node.js 18+ recommended
- npm (or yarn)

Install and run locally

1. From the project root:

```bash
npm install
npm run dev
```

2. Open http://localhost:3000 in your browser.

Notes
- If the dev server reports `EADDRINUSE` (port in use), free the port or pick a different port with `npm run dev -- -p 3001`.
- If the globe texture is missing, the component falls back to a colored sphere (no crash). To get full textured globe, add `public/earthmap.jpg`.

---

## Project layout (important files)

- `app/page.tsx` — top-level page that composes `Navigation`, `DataPanels`, `GlobeVisualization`, and `ChartsSection`.
- `components/ChartsSection.tsx` — main charts: global trend lines, top-10 list, pie chart, vaccination area chart, and small country detail sparkline. Uses `recharts`.
- `components/GlobeVisualization.tsx` — 3D globe and country markers using `@react-three/fiber` + `@react-three/drei`.
- `components/DataPanels.tsx` — small KPI cards (totals, active, recovered, deaths, vaccination rate).
- `utils/dataProcessor.ts` — transforms raw rows into the `ProcessedData` shape used by the UI, produces mock data and predictions.
- `types/index.ts` — TypeScript interfaces used across the app (see `ProcessedData`, `CountryData`, `TimeSeriesData`).

---

## Data contract

`ProcessedData` (high-level):

```ts
interface ProcessedData {
   global: { totalCases: number; activeCases: number; recovered: number; deaths: number; vaccinated: number; vaccinationRate: number }
   countries: CountryData[]
   timeSeries: TimeSeriesData[]
   predictions: PredictionData[]
}
```

Each `CountryData` includes fields for totals, trend flags, and optional `states`.

This shape is what `ChartsSection` and `GlobeVisualization` expect.

---

## How the mock data and predictions work (utils/dataProcessor.ts)

The repository contains helpers that create a plausible demo dataset so the dashboard can run without real API data.

Key functions:

- `generateTimeSeries()`
   - Generates a 365-day global time series starting from `2023-01-01`.
   - Values are synthetic: a base plus linear drift plus random noise.

- `generateMockData()`
   - Produces a list of mock `CountryData` entries (United States, India, Brazil, etc.).
   - Each country gets randomized totals, active/recovered/deaths derived as fractions of total, and some sample states for US/India.
   - Produces `global` totals by summing country numbers.

- `generatePredictions(timeSeries)`
   - Produces a 90-day forecast using the configured forecasting model. In this project the default implementation is an LSTM-based model (see the "Optional: LSTM-based prediction model" section for details).
   - The function returns an array of forecast points including a central estimate (e.g. `predictedCases`) and optional uncertainty bounds (`lowerBound`, `upperBound`) when available.

- `processCovidData(rawData)`
   - Aggregates raw `CovidData[]` rows into `ProcessedData`: groups rows by country, sums totals, computes vaccination rate, derives `timeSeries` and `predictions`.

Notes on accuracy
- Predictions in this repository are produced by the LSTM-based model described below. While LSTM models can capture temporal patterns better than naive heuristics, careful preprocessing, regular retraining, and robust backtesting are required before trusting forecasts for operational use. If you prefer a simple baseline for comparison, consider implementing ARIMA or exponential baselines separately and comparing using the evaluation workflow described in the Evaluation and backtesting section.

### Optional: LSTM-based prediction model

If you replaced the demo exponential generator with an LSTM model, here is what the README documents about that change and how the LSTM predicts.

High-level idea
- An LSTM is a recurrent neural network suited to learning temporal patterns. For time-series forecasting we train the LSTM to predict one or more future steps from a fixed-length input window of past values.

Data shape and preprocessing
- Input: a sliding window of recent daily case counts (for example, the last 28 days). Each training example is a window X = [x_{t-27}, ..., x_t] and target Y is either the next single value x_{t+1} (one-step) or a vector of the next H values (multi-step).
- Normalization: inputs are scaled (min-max or log1p + standardization). Store the scaler parameters with the model so you can invert transforms at inference time.
- Optional additional features: day-of-week, mobility indices, policy flags, or per-country covariates may be concatenated to each time step.

Model architecture (example)
- Input layer: shape = [windowSize, 1] (or more features)
- LSTM layer(s): 1–3 stacked LSTM layers, e.g. 64 units then 32 units
- Dropout between layers (0.1–0.3) to reduce overfitting
- Dense output: H units for H-step forecast (or 1 unit for one-step)
- Loss: mean squared error (MSE) or mean absolute error (MAE)
- Optimizer: Adam with a small learning rate (1e-3 → 1e-4)

Training & validation
- Split by time: use walk-forward validation (train on t0..tN, validate on subsequent block) rather than random shuffle, to avoid look-ahead bias.
- Early stopping on validation loss with patience (e.g., 10 epochs).
- For many countries, train a single global model with a country embedding or train per-country models depending on data availability.

Inference strategies
- Recursive (direct) multi-step: predict t+1, append predicted value to the input window, repeat to produce H steps. Simple but can accumulate error.
- Direct multi-output: train the model to output H steps at once. More stable but requires more capacity and data.

Integration with this project
- Server-side recommended: train the LSTM with Python (TensorFlow/Keras or PyTorch) and export weights (SavedModel/ONNX). Run inference in a small API (FastAPI/Flask) and return `predictions` in the `ProcessedData` shape. This keeps heavy computation off the browser.
- Lightweight client option: use `@tensorflow/tfjs` to run the trained model in the browser (convert Keras -> TFJS). Good for demo and small models but slower on CPU and limited by browser memory.
- Where to plug in: replace `generatePredictions(timeSeries)` in `utils/dataProcessor.ts` to call your inference endpoint or a TFJS model loader. The API should accept a recent window and return an array of forecast points and optional confidence bounds.

Uncertainty & bounds
- LSTM point forecasts do not directly provide prediction intervals. Options:
   - Use Monte Carlo dropout (enable dropout at inference and sample multiple forward passes to approximate uncertainty).
   - Use a separate model to predict error variance or quantile regression (train to predict the 5th/95th quantiles).
   - Use ensemble forecasts from several differently-initialized models to estimate spread.

Evaluation and backtesting
- Use walk-forward backtesting to compute RMSE, MAPE and other metrics over rolling windows.
- Use the Diebold–Mariano test (or paired comparisons with Newey–West correction) to compare LSTM forecasts to baseline models (exponential, ARIMA).

Production notes
- Retrain regularly (weekly) with new data and monitor drift. Keep a small validation pipeline that verifies the model on recent held-out windows before swapping into production.
- Persist the scaler and model artifacts with versioning (S3, GCS, or local model directory). Store metadata: window size, features used, training date, and evaluation metrics.

Code pointers
- If you add a server-side model, create an API route (e.g., `pages/api/predict` or `/api/predict`) that accepts a JSON payload: `{ country, recentWindow: number[], horizon: number }` and returns `{ predictions: number[], lower?: number[], upper?: number[] }`.
- Update `utils/dataProcessor.ts` to call that API during `generatePredictions` (or add a new `generatePredictionsLSTM` that is used when model artifacts or an API URL are configured).

Security and performance
- Rate-limit inference endpoints and batch requests when producing predictions for many countries. Cache recent predictions for fast UI rendering.

Summary
- An LSTM model can greatly improve forecast quality over a naive exponential rule, especially when trained with sufficient history and covariates. For production, prefer training in a robust Python stack and serving predictions via a small API; convert to TFJS only for lightweight browser-side demos.

---

## Charts & UI details (`components/ChartsSection.tsx`)

High-level behavior:
- Uses `recharts` and `ResponsiveContainer` for responsive charts.
- Global trend chart (lines) plots Cases, Recovered, Deaths using the `timeSeries` slice.
- Top-10 countries is displayed as a floating panel (custom UI) showing rank and totals. Clicking a country shows a detail panel to the right with a sparkline.
   - If per-country time series is not available, the sparkline uses a scaled version of global `timeSeries` and adds a deterministic jitter so different countries visually differ.
- Pie chart shows Active / Recovered / Deaths using `data.global` totals. A custom `PieTooltip` computes percentage consistently (instead of relying on Recharts' internal percent field which can vary by version).

Tooltips and UX:
- Custom tooltips (`CountryTooltip`, `PieTooltip`) are used to ensure consistent, readable tooltips with a dark theme.
- Hovering and selection in the Top-10 panel uses React state (`hoveredCountry`, `selectedCountry`) to highlight and show details.

Extending charts:
- To switch to real per-country series, update `ProcessedData.countries[].timeSeries` to include a `TimeSeriesData[]` per country and in ChartsSection use that series when `selectedCountry` is set.
- To change colors/spacing, edit the inline style objects or move them to Tailwind classes.

---

## Globe visualization details (`components/GlobeVisualization.tsx`)

What it does:
- Renders a sphere (globe) using `@react-three/fiber` with a texture map (if `public/earthmap.jpg` exists).
- Adds small spherical markers positioned by latitude/longitude.
   - Lat/lon → 3D conversion uses spherical coordinates: phi = (90 - lat) * deg2rad, theta = (lon + 180) * deg2rad, then convert to x,y,z on radius.
- Marker size scales with active case counts, and color is derived from active case intensity.
- Hovering a marker shows an HTML tooltip via `<Html>` from `@react-three/drei`.
- Clicking a marker calls the `onCountrySelect` callback (the main page reacts by showing country view).

Robustness improvements (already applied):
- Texture is loaded with `TextureLoader` in `useEffect` and the component falls back to a plain shaded sphere if the texture load fails. The Canvas is created with `alpha:true` so it doesn't leave a white background if something goes wrong.

To get a textured globe locally
- Add an image file at `public/earthmap.jpg`. Any low-res 2:1 equirectangular map will work.

---

## Running, testing and common troubleshooting

Commands

```bash
# install
npm install

# run typecheck
npx tsc --noEmit

# dev server
npm run dev
```

Common issues and fixes
- Missing packages: if you get "Module not found" for `three`, `@react-three/fiber`, `recharts`, install them with `npm i three @react-three/fiber @react-three/drei recharts`.
- Tailwind / PostCSS / LightningCSS errors (Windows): If the dev server errors about `lightningcss` native bindings, try switching to the JS PostCSS adapter or install the matching native build; for debugging you can temporarily comment out the `import './globals.css'` line in `app/layout.tsx` to keep the app running while you fix CSS toolchain problems.
- Port in use: `npx kill-port 3000` or pick a different port with `npm run dev -- -p 3001`.

---

## How to replace mock data with real data

1. Collect your raw rows as `CovidData[]` (see `types/index.ts` for the shape).
2. Call `processCovidData(rawRows)` (exports from `utils/dataProcessor.ts`) to obtain the `ProcessedData` shape.
3. Pass the result to the page state (`setCovidData(processed)`) in `app/page.tsx`.

If you have per-country time series, attach it to each country object as `country.timeSeries = TimeSeriesData[]` so the Top-10 detail panel can show the real sparkline.

---

## Where to customize / next steps

- Replace the predictions model: `utils/generatePredictions` is the place to plug in an ML model (server-side or client-side). For server-side models, produce `predictions` as an API response.
- Improve globe marker sizing/color: `GlobeVisualization.tsx#getColorForActiveCases` and sizing constants control marker visuals.
- Improve accessibility: ensure keyboard navigation, add `aria-label`s to interactive elements, and provide alternatives for 3D content.
- Add unit tests around `processCovidData` and `calculateTrend`.

---

If anything in this README is unclear or you want me to generate additional artifacts (a small low-res `earthmap.jpg` in `public/`, CI test scripts, or an example of wiring a real CSV through an API endpoint), tell me which item and I will add it.
