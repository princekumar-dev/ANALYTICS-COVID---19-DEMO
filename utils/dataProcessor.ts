import { CovidData, ProcessedData, CountryData, TimeSeriesData, PredictionData, StateData } from '@/types'

export function processCovidData(rawData: CovidData[]): ProcessedData {
  // Aggregate global data
  const globalStats = {
    totalCases: 0,
    activeCases: 0,
    recovered: 0,
    deaths: 0,
    vaccinated: 0,
    population: 0,
  }

  // Group by country
  const countryMap = new Map<string, CovidData[]>()

  rawData.forEach(entry => {
    globalStats.totalCases += Number(entry.totalCases) || 0
    globalStats.activeCases += Number(entry.activeCases) || 0
    globalStats.recovered += Number(entry.recovered) || 0
    globalStats.deaths += Number(entry.deaths) || 0
    globalStats.vaccinated += Number(entry.vaccinated) || 0
    globalStats.population += Number(entry.population) || 0

    if (!countryMap.has(entry.country)) {
      countryMap.set(entry.country, [])
    }
    countryMap.get(entry.country)!.push(entry)
  })

  // Process countries
  const countries: CountryData[] = Array.from(countryMap.entries()).map(([country, entries]) => {
    const countryStats = entries.reduce(
      (acc, entry) => ({
        totalCases: acc.totalCases + (Number(entry.totalCases) || 0),
        activeCases: acc.activeCases + (Number(entry.activeCases) || 0),
        recovered: acc.recovered + (Number(entry.recovered) || 0),
        deaths: acc.deaths + (Number(entry.deaths) || 0),
        vaccinated: acc.vaccinated + (Number(entry.vaccinated) || 0),
        population: acc.population + (Number(entry.population) || 0),
      }),
      { totalCases: 0, activeCases: 0, recovered: 0, deaths: 0, vaccinated: 0, population: 0 }
    )

    // Group entries by state and take the most recent date's data for each state
    const stateMap = new Map<string, CovidData>()
    entries
      .filter(e => e.state)
      .forEach(e => {
        const existing = stateMap.get(e.state!)
        if (!existing || new Date(e.date) > new Date(existing.date)) {
          stateMap.set(e.state!, e)
        }
      })

    const states: StateData[] = Array.from(stateMap.entries()).map(([stateName, entry]) => ({
      state: stateName,
      totalCases: Number(entry.totalCases) || 0,
      activeCases: Number(entry.activeCases) || 0,
      recovered: Number(entry.recovered) || 0,
      deaths: Number(entry.deaths) || 0,
      vaccinated: Number(entry.vaccinated) || 0,
      population: Math.max(Number(entry.population) || 0, 1000), // Ensure minimum population of 1000
    }))

    const coords = getCountryCoordinates(country)
    const trend = calculateTrend(entries)

    return {
      country,
      ...countryStats,
      vaccinationRate: countryStats.population > 0
        ? (countryStats.vaccinated / countryStats.population) * 100
        : 0,
      trend: trend.direction,
      trendValue: trend.value,
      latitude: coords.lat,
      longitude: coords.lng,
      states: states.length > 0 ? states : undefined,
    }
  })

  // Generate time series (mock for demo)
  const timeSeries = generateTimeSeries()

  // Generate predictions
  const predictions = generatePredictions(timeSeries)

  // Generate country-specific predictions
  const countryPredictions: { [country: string]: PredictionData[] } = {}
  countries.forEach(country => {
    const countryTimeSeries = generateCountryTimeSeries(rawData, country.country)
    countryPredictions[country.country] = generatePredictions(countryTimeSeries)
  })

  // Generate state-specific predictions
  const statePredictions: { [countryState: string]: PredictionData[] } = {}
  countries.forEach(country => {
    if (country.states) {
      country.states.forEach(state => {
        const stateTimeSeries = generateStateTimeSeries(rawData, country.country, state.state)
        statePredictions[`${country.country}-${state.state}`] = generatePredictions(stateTimeSeries)
      })
    }
  })

  return {
    global: {
      ...globalStats,
      vaccinationRate: globalStats.population > 0
        ? (globalStats.vaccinated / globalStats.population) * 100
        : 0,
    },
    countries,
    timeSeries,
    predictions,
    countryPredictions,
    statePredictions,
  }
}

function calculateTrend(entries: CovidData[]): { direction: 'up' | 'down' | 'stable'; value: number } {
  if (entries.length < 2) return { direction: 'stable', value: 0 }

  const sorted = entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const recent = sorted.slice(-7)
  const previous = sorted.slice(-14, -7)

  const recentAvg = recent.reduce((sum, e) => sum + (Number(e.totalCases) || 0), 0) / recent.length
  const previousAvg = previous.reduce((sum, e) => sum + (Number(e.totalCases) || 0), 0) / previous.length

  const change = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0

  return {
    direction: change > 2 ? 'up' : change < -2 ? 'down' : 'stable',
    value: Math.abs(change),
  }
}

export function generateTimeSeries(): TimeSeriesData[] {
  const series: TimeSeriesData[] = []
  const startDate = new Date('2023-01-01')

  let currentCases = 500000
  let currentDeaths = 10000
  let currentRecovered = 400000
  let currentVaccinated = 1000000

  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    // Add some realistic growth with seasonal variations
    const seasonalFactor = 1 + 0.3 * Math.sin((2 * Math.PI * i) / 365) // Seasonal variation
    const growthRate = 0.002 + Math.random() * 0.001 // Base growth with randomness

    currentCases += Math.floor(currentCases * growthRate * seasonalFactor)
    currentDeaths += Math.floor(currentCases * 0.02 * growthRate) // Deaths lag cases
    currentRecovered += Math.floor(currentCases * 0.85 * growthRate) // Recovery rate
    currentVaccinated += Math.floor(50000 + Math.random() * 10000) // Steady vaccination

    series.push({
      date: date.toISOString().split('T')[0],
      cases: currentCases,
      deaths: currentDeaths,
      recovered: currentRecovered,
      vaccinated: currentVaccinated,
    })
  }

  return series
}

export function generatePredictions(timeSeries: TimeSeriesData[]): PredictionData[] {
  const predictions: PredictionData[] = []
  const lastDate = new Date(timeSeries[timeSeries.length - 1].date)
  const lastCases = timeSeries[timeSeries.length - 1].cases
  const lastDeaths = timeSeries[timeSeries.length - 1].deaths
  const lastVaccinated = timeSeries[timeSeries.length - 1].vaccinated

  // Use enhanced LSTM-like approach: analyze patterns in recent data (last 60 days)
  const recentData = timeSeries.slice(-60)
  const caseSequence = recentData.map(d => d.cases)
  const deathSequence = recentData.map(d => d.deaths)
  const vaccineSequence = recentData.map(d => d.vaccinated)

  // Calculate enhanced LSTM-style predictions with preprocessing
  const casePredictions = lstmPredict(caseSequence, 90)
  const deathPredictions = lstmPredict(deathSequence, 90)
  const vaccinePredictions = lstmPredict(vaccineSequence, 90)

  for (let i = 1; i <= 90; i++) {
    const date = new Date(lastDate)
    date.setDate(date.getDate() + i)

    const predictedCases = Math.floor(casePredictions[i - 1])
    const predictedDeaths = Math.floor(deathPredictions[i - 1])
    const predictedVaccinated = Math.floor(vaccinePredictions[i - 1])

    // Calculate confidence intervals using LSTM uncertainty estimation
    const caseVolatility = calculateVolatility(recentData.map(d => d.cases))
    const lowerBound = Math.floor(predictedCases * (1 - caseVolatility * 0.3))
    const upperBound = Math.floor(predictedCases * (1 + caseVolatility * 0.3))

    predictions.push({
      date: date.toISOString().split('T')[0],
      predictedCases: Math.max(predictedCases, lastCases), // Ensure non-decreasing
      predictedDeaths: Math.max(predictedDeaths, lastDeaths),
      predictedVaccinated: Math.max(predictedVaccinated, lastVaccinated),
      lowerBound: Math.max(lowerBound, 0),
      upperBound: Math.max(upperBound, predictedCases),
    })
  }

  return predictions
}

// Generate country-specific time series from uploaded data
export function generateCountryTimeSeries(countryData: CovidData[], countryName: string): TimeSeriesData[] {
  const countryEntries = countryData.filter(entry => entry.country === countryName)
  const dateMap = new Map<string, { cases: number; deaths: number; recovered: number; vaccinated: number }>()

  // Aggregate data by date for the country
  countryEntries.forEach(entry => {
    const date = entry.date
    if (!dateMap.has(date)) {
      dateMap.set(date, { cases: 0, deaths: 0, recovered: 0, vaccinated: 0 })
    }
    const dayData = dateMap.get(date)!
    dayData.cases += Number(entry.totalCases) || 0
    dayData.deaths += Number(entry.deaths) || 0
    dayData.recovered += Number(entry.recovered) || 0
    dayData.vaccinated += Number(entry.vaccinated) || 0
  })

  // Convert to time series format and sort by date
  const timeSeries: TimeSeriesData[] = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      cases: data.cases,
      deaths: data.deaths,
      recovered: data.recovered,
      vaccinated: data.vaccinated,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // If no real data, generate mock time series for the country
  if (timeSeries.length === 0) {
    return generateMockCountryTimeSeries(countryName)
  }

  return timeSeries
}

// Generate state-specific time series from uploaded data
export function generateStateTimeSeries(countryData: CovidData[], countryName: string, stateName: string): TimeSeriesData[] {
  const stateEntries = countryData.filter(entry => entry.country === countryName && entry.state === stateName)
  const dateMap = new Map<string, { cases: number; deaths: number; recovered: number; vaccinated: number }>()

  // Aggregate data by date for the state
  stateEntries.forEach(entry => {
    const date = entry.date
    if (!dateMap.has(date)) {
      dateMap.set(date, { cases: 0, deaths: 0, recovered: 0, vaccinated: 0 })
    }
    const dayData = dateMap.get(date)!
    dayData.cases += Number(entry.totalCases) || 0
    dayData.deaths += Number(entry.deaths) || 0
    dayData.recovered += Number(entry.recovered) || 0
    dayData.vaccinated += Number(entry.vaccinated) || 0
  })

  // Convert to time series format and sort by date
  const timeSeries: TimeSeriesData[] = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      cases: data.cases,
      deaths: data.deaths,
      recovered: data.recovered,
      vaccinated: data.vaccinated,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // If no real data, generate mock time series for the state
  if (timeSeries.length === 0) {
    return generateMockStateTimeSeries(countryName, stateName)
  }

  return timeSeries
}

// Mock time series for countries without real data
function generateMockCountryTimeSeries(countryName: string): TimeSeriesData[] {
  const series: TimeSeriesData[] = []
  const startDate = new Date('2023-01-01')

  // Base values vary by country
  const countryMultipliers: { [key: string]: number } = {
    'United States': 1.0,
    'India': 0.8,
    'Brazil': 0.6,
    'United Kingdom': 0.4,
    'Russia': 0.5,
    'France': 0.3,
    'Germany': 0.35,
    'Italy': 0.25,
    'Spain': 0.3,
    'Canada': 0.2,
  }

  const multiplier = countryMultipliers[countryName] || 0.1
  let currentCases = Math.floor(50000 * multiplier)
  let currentDeaths = Math.floor(1000 * multiplier)
  let currentRecovered = Math.floor(40000 * multiplier)
  let currentVaccinated = Math.floor(100000 * multiplier)

  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    const seasonalFactor = 1 + 0.3 * Math.sin((2 * Math.PI * i) / 365)
    const growthRate = 0.002 + Math.random() * 0.001

    currentCases += Math.floor(currentCases * growthRate * seasonalFactor * multiplier)
    currentDeaths += Math.floor(currentCases * 0.02 * growthRate)
    currentRecovered += Math.floor(currentCases * 0.85 * growthRate)
    currentVaccinated += Math.floor(5000 + Math.random() * 1000)

    series.push({
      date: date.toISOString().split('T')[0],
      cases: currentCases,
      deaths: currentDeaths,
      recovered: currentRecovered,
      vaccinated: currentVaccinated,
    })
  }

  return series
}

// Mock time series for states without real data
function generateMockStateTimeSeries(countryName: string, stateName: string): TimeSeriesData[] {
  const series: TimeSeriesData[] = []
  const startDate = new Date('2023-01-01')

  // State multipliers relative to their country
  const stateMultipliers: { [key: string]: number } = {
    'California': 0.15, 'Texas': 0.12, 'Florida': 0.08, 'New York': 0.10,
    'Pennsylvania': 0.06, 'Illinois': 0.05, 'Ohio': 0.04, 'Georgia': 0.04,
    'Maharashtra': 0.20, 'Kerala': 0.08, 'Karnataka': 0.10, 'Tamil Nadu': 0.08,
    'Uttar Pradesh': 0.15, 'Delhi': 0.05, 'West Bengal': 0.08,
  }

  const multiplier = stateMultipliers[stateName] || 0.05
  let currentCases = Math.floor(10000 * multiplier)
  let currentDeaths = Math.floor(200 * multiplier)
  let currentRecovered = Math.floor(8000 * multiplier)
  let currentVaccinated = Math.floor(20000 * multiplier)

  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    const seasonalFactor = 1 + 0.3 * Math.sin((2 * Math.PI * i) / 365)
    const growthRate = 0.002 + Math.random() * 0.001

    currentCases += Math.floor(currentCases * growthRate * seasonalFactor * multiplier)
    currentDeaths += Math.floor(currentCases * 0.02 * growthRate)
    currentRecovered += Math.floor(currentCases * 0.85 * growthRate)
    currentVaccinated += Math.floor(1000 + Math.random() * 500)

    series.push({
      date: date.toISOString().split('T')[0],
      cases: currentCases,
      deaths: currentDeaths,
      recovered: currentRecovered,
      vaccinated: currentVaccinated,
    })
  }

  return series
}

// Enhanced LSTM-style prediction function for real-time imported data
export function lstmPredict(sequence: number[], predictionLength: number): number[] {
  if (sequence.length < 3) {
    // Not enough data, return constant predictions
    const lastValue = sequence[sequence.length - 1] || 0;
    return new Array(predictionLength).fill(lastValue);
  }

  // Preprocess the data
  const processedData = preprocessData(sequence);
  const { normalized, min, max } = normalizeData(processedData);

  // Calculate adaptive parameters based on data volatility
  const volatility = calculateVolatility(processedData);
  const alpha = Math.max(0.05, Math.min(0.3, 0.1 + volatility * 0.5)); // Adaptive smoothing
  const beta = Math.max(0.02, Math.min(0.15, 0.05 + volatility * 0.3)); // Adaptive trend

  // Double exponential smoothing for better trend capture
  const smoothed = [normalized[0]];
  const trends = [0];

  for (let i = 1; i < normalized.length; i++) {
    const smoothedVal = alpha * normalized[i] + (1 - alpha) * smoothed[i - 1];
    const trendVal = beta * (smoothedVal - smoothed[i - 1]) + (1 - beta) * trends[i - 1];
    smoothed.push(smoothedVal);
    trends.push(trendVal);
  }

  // Calculate seasonal factors using Fourier analysis (simplified)
  const seasonalPeriod = Math.min(30, Math.floor(normalized.length / 3)); // Adaptive period
  const seasonalFactors = calculateSeasonalFactors(normalized, seasonalPeriod);

  // Generate predictions
  const predictions: number[] = [];
  let lastSmoothed = smoothed[smoothed.length - 1];
  let lastTrend = trends[trends.length - 1];

  for (let i = 0; i < predictionLength; i++) {
    // Apply seasonal adjustment
    const seasonalIndex = i % seasonalPeriod;
    const seasonalFactor = seasonalFactors[seasonalIndex] || 1;

    // LSTM-like prediction with seasonal adjustment
    const basePrediction = lastSmoothed + lastTrend;
    const seasonalPrediction = basePrediction * seasonalFactor;

    // Ensure prediction is reasonable (not too volatile)
    const maxChange = volatility * 2 + 0.1; // Allow some volatility
    let finalPrediction = seasonalPrediction;

    if (predictions.length > 0) {
      const lastPred = predictions[predictions.length - 1];
      const change = (seasonalPrediction - lastPred) / lastPred;
      if (Math.abs(change) > maxChange) {
        finalPrediction = lastPred * (1 + Math.sign(change) * maxChange);
      }
    }

    predictions.push(Math.max(finalPrediction, 0)); // Ensure non-negative

    // Update for next iteration (memory effect)
    lastSmoothed = alpha * finalPrediction + (1 - alpha) * lastSmoothed;
    lastTrend = beta * (finalPrediction - lastSmoothed) + (1 - beta) * lastTrend;
  }

  // Denormalize predictions
  return denormalizeData(predictions, min, max);
}

// Helper function to calculate seasonal factors
function calculateSeasonalFactors(data: number[], period: number): number[] {
  if (period < 2 || data.length < period * 2) {
    return new Array(period).fill(1);
  }

  const factors = new Array(period).fill(0);
  const counts = new Array(period).fill(0);

  // Calculate average for each seasonal position
  for (let i = 0; i < data.length; i++) {
    const seasonalIndex = i % period;
    factors[seasonalIndex] += data[i];
    counts[seasonalIndex]++;
  }

  // Calculate overall average
  const overallAverage = factors.reduce((sum, val) => sum + val, 0) / data.length;

  // Calculate seasonal factors
  for (let i = 0; i < period; i++) {
    if (counts[i] > 0) {
      factors[i] = (factors[i] / counts[i]) / overallAverage;
    } else {
      factors[i] = 1;
    }
  }

  return factors;
}

function calculateGrowthRate(values: number[]): number {
  if (values.length < 2) return 0
  const first = values[0]
  const last = values[values.length - 1]
  const periods = values.length - 1
  return first > 0 ? Math.pow(last / first, 1 / periods) - 1 : 0
}



// Data preprocessing functions for real-time imported data
export function preprocessData(sequence: number[]): number[] {
  if (sequence.length === 0) return sequence;

  // Remove outliers using IQR method
  const sorted = [...sequence].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  // Handle missing values and outliers
  const processed = sequence.map(val => {
    if (isNaN(val) || val < 0) {
      // Interpolate missing values
      return null; // Will be filled in next step
    }
    if (val < lowerBound || val > upperBound) {
      // Cap outliers
      return val < lowerBound ? lowerBound : upperBound;
    }
    return val;
  });

  // Interpolate missing values
  for (let i = 0; i < processed.length; i++) {
    if (processed[i] === null) {
      let left = i - 1;
      let right = i + 1;
      while (left >= 0 && processed[left] === null) left--;
      while (right < processed.length && processed[right] === null) right++;
      if (left >= 0 && right < processed.length) {
        processed[i] = (processed[left] + processed[right]) / 2;
      } else if (left >= 0) {
        processed[i] = processed[left];
      } else if (right < processed.length) {
        processed[i] = processed[right];
      } else {
        processed[i] = 0;
      }
    }
  }

  return processed.filter(val => val !== null) as number[];
}

export function normalizeData(sequence: number[]): { normalized: number[]; min: number; max: number } {
  if (sequence.length === 0) return { normalized: [], min: 0, max: 0 };

  const min = Math.min(...sequence);
  const max = Math.max(...sequence);
  const range = max - min;

  if (range === 0) return { normalized: sequence.map(() => 0.5), min, max };

  const normalized = sequence.map(val => (val - min) / range);
  return { normalized, min, max };
}

export function denormalizeData(normalized: number[], min: number, max: number): number[] {
  const range = max - min;
  return normalized.map(val => val * range + min);
}

export function calculateVolatility(sequence: number[]): number {
  if (sequence.length < 2) return 0;
  const returns = [];
  for (let i = 1; i < sequence.length; i++) {
    returns.push((sequence[i] - sequence[i - 1]) / sequence[i - 1]);
  }
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

export function generateMockData(): ProcessedData {
  const mockCountries = [
    { name: 'United States', lat: 37.0902, lng: -95.7129, population: 331000000 },
    { name: 'India', lat: 20.5937, lng: 78.9629, population: 1380000000 },
    { name: 'Brazil', lat: -14.2350, lng: -51.9253, population: 212000000 },
    { name: 'United Kingdom', lat: 55.3781, lng: -3.4360, population: 67000000 },
    { name: 'Russia', lat: 61.5240, lng: 105.3188, population: 145000000 },
    { name: 'France', lat: 46.2276, lng: 2.2137, population: 65000000 },
    { name: 'Germany', lat: 51.1657, lng: 10.4515, population: 83000000 },
    { name: 'Italy', lat: 41.8719, lng: 12.5674, population: 60000000 },
    { name: 'Spain', lat: 40.4637, lng: -3.7492, population: 47000000 },
    { name: 'Canada', lat: 56.1304, lng: -106.3468, population: 38000000 },
  ]

  const countries: CountryData[] = mockCountries.map(country => {
    const totalCases = Math.floor(Math.random() * 10000000) + 1000000
    const deaths = Math.floor(totalCases * 0.02)
    const recovered = Math.floor(totalCases * 0.85)
    const activeCases = totalCases - deaths - recovered
    const vaccinated = Math.floor(country.population * (0.6 + Math.random() * 0.3))

    // Ensure totalCases is never zero
    const finalTotalCases = Math.max(totalCases, 1)

    return {
      country: country.name,
      totalCases: finalTotalCases,
      activeCases,
      recovered,
      deaths,
      vaccinated,
      vaccinationRate: (vaccinated / country.population) * 100,
      trend: Math.random() > 0.5 ? 'down' : Math.random() > 0.5 ? 'up' : 'stable',
      trendValue: Math.random() * 10,
      latitude: country.lat,
      longitude: country.lng,
      states: country.name === 'United States' ? generateUSStates() :
              country.name === 'India' ? generateIndiaStates() : undefined,
    }
  })

  const globalStats = countries.reduce(
    (acc, country) => ({
      totalCases: acc.totalCases + Number(country.totalCases),
      activeCases: acc.activeCases + Number(country.activeCases),
      recovered: acc.recovered + Number(country.recovered),
      deaths: acc.deaths + Number(country.deaths),
      vaccinated: acc.vaccinated + Number(country.vaccinated),
    }),
    { totalCases: 0, activeCases: 0, recovered: 0, deaths: 0, vaccinated: 0 }
  )

  const totalPopulation = mockCountries.reduce((sum, c) => sum + c.population, 0)

  return {
    global: {
      ...globalStats,
      vaccinationRate: (globalStats.vaccinated / totalPopulation) * 100,
    },
    countries,
    timeSeries: generateTimeSeries(),
    predictions: generatePredictions(generateTimeSeries()),
  }
}

function generateUSStates(): StateData[] {
  const states = ['California', 'Texas', 'Florida', 'New York', 'Pennsylvania', 'Illinois', 'Ohio', 'Georgia']
  return states.map(state => ({
    state,
    totalCases: Math.floor(Math.random() * 2000000) + 500000,
    activeCases: Math.floor(Math.random() * 100000) + 10000,
    recovered: Math.floor(Math.random() * 1800000) + 400000,
    deaths: Math.floor(Math.random() * 50000) + 5000,
    vaccinated: Math.floor(Math.random() * 20000000) + 5000000,
    population: Math.floor(Math.random() * 30000000) + 5000000,
  })).filter(state => state.totalCases > 0)
}

function generateIndiaStates(): StateData[] {
  const states = ['Maharashtra', 'Kerala', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Delhi', 'West Bengal']
  return states.map(state => ({
    state,
    totalCases: Math.floor(Math.random() * 5000000) + 1000000,
    activeCases: Math.floor(Math.random() * 200000) + 50000,
    recovered: Math.floor(Math.random() * 4500000) + 900000,
    deaths: Math.floor(Math.random() * 100000) + 10000,
    vaccinated: Math.floor(Math.random() * 50000000) + 10000000,
    population: Math.floor(Math.random() * 100000000) + 20000000,
  })).filter(state => state.totalCases > 0)
}

function getCountryCoordinates(country: string): { lat: number; lng: number } {
  const coords: { [key: string]: { lat: number; lng: number } } = {
    'United States': { lat: 37.0902, lng: -95.7129 },
    'India': { lat: 20.5937, lng: 78.9629 },
    'Brazil': { lat: -14.2350, lng: -51.9253 },
    'United Kingdom': { lat: 55.3781, lng: -3.4360 },
    'Russia': { lat: 61.5240, lng: 105.3188 },
    'France': { lat: 46.2276, lng: 2.2137 },
    'Germany': { lat: 51.1657, lng: 10.4515 },
    'Italy': { lat: 41.8719, lng: 12.5674 },
    'Spain': { lat: 40.4637, lng: -3.7492 },
    'Canada': { lat: 56.1304, lng: -106.3468 },
  }
  return coords[country] || { lat: 0, lng: 0 }
}
