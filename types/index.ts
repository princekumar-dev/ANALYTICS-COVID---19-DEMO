export interface CovidData {
  country: string
  state?: string
  date: string
  totalCases: number
  activeCases: number
  recovered: number
  deaths: number
  vaccinated?: number
  population?: number
  latitude?: number
  longitude?: number
}

export interface CountryData {
  country: string
  totalCases: number
  activeCases: number
  recovered: number
  deaths: number
  vaccinated: number
  vaccinationRate: number
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  latitude: number
  longitude: number
  states?: StateData[]
}

export interface StateData {
  state: string
  totalCases: number
  activeCases: number
  recovered: number
  deaths: number
  vaccinated: number
  population: number
}

export interface TimeSeriesData {
  date: string
  cases: number
  deaths: number
  recovered: number
  vaccinated: number
}

export interface PredictionData {
  date: string
  predictedCases: number
  predictedDeaths: number
  predictedVaccinated: number
  lowerBound: number
  upperBound: number
}

export interface ProcessedData {
  global: {
    totalCases: number
    activeCases: number
    recovered: number
    deaths: number
    vaccinated: number
    vaccinationRate: number
  }
  countries: CountryData[]
  timeSeries: TimeSeriesData[]
  predictions: PredictionData[]
  countryPredictions?: { [country: string]: PredictionData[] }
  statePredictions?: { [countryState: string]: PredictionData[] }
}
