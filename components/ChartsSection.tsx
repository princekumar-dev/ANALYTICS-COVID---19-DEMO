'use client'

import React, { useState } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { ProcessedData } from '@/types'

interface ChartsSectionProps {
  data: ProcessedData
  view: 'global' | 'country' | 'predictions'
  country?: string
  state?: string
  onStateSelect?: (state: string) => void
}

export default function ChartsSection({ data, view, country, onStateSelect }: ChartsSectionProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num)
  }

  // Custom tooltip for horizontal bar chart (shows country and formatted value)
  function CountryTooltip({ active, payload }: any) {
    if (!active || !payload || !payload.length) return null
    const row = payload[0].payload
    const value = payload[0].value
    return (
      <div style={{ background: 'rgba(0,0,0,0.9)', color: '#fff', padding: 8, borderRadius: 8, minWidth: 120 }}>
        <div style={{ fontSize: 12, opacity: 0.9 }}>{row.country}</div>
        <div style={{ fontWeight: 700, color: '#0ea5e9', marginTop: 6 }}>{formatNumber(Number(value))}</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>Cases</div>
      </div>
    )
  }

  // Tooltip for Pie chart entries
  function PieTooltip({ active, payload }: any) {
    if (!active || !payload || !payload.length) return null
    const entry = payload[0]
    const name = entry.name ?? entry.payload?.name ?? ''
    const value = Number(entry.value ?? entry.payload?.value ?? 0)
    // Compute percent using the global totals to avoid relying on Recharts' percent
    const total = Number(data.global.activeCases || 0) + Number(data.global.recovered || 0) + Number(data.global.deaths || 0) || 1
    const pct = (value / total) * 100
    return (
      <div style={{ background: 'rgba(0,0,0,0.9)', color: '#fff', padding: 8, borderRadius: 8, minWidth: 140 }}>
        <div style={{ fontSize: 12, opacity: 0.95 }}>{name}</div>
        <div style={{ fontWeight: 700, color: '#0ea5e9', marginTop: 6 }}>{formatNumber(Number(value))}</div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>{`${pct.toFixed(0)}%`}</div>
      </div>
    )
  }

  // We will not use Recharts' `activeShape` (not available on Bar props
  // typings in this setup). Instead we will disable the cursor overlay and
  // rely on a controlled overlay list + a small sparkline to show the
  // hovered country's time-series. Keep a small render helper for custom
  // bars if needed in future.
  function renderBarRect(props: any) {
    const { x, y, width, height, fill } = props
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={fill} rx={6} />
      </g>
    )
  }

  const COLORS = ['#0ea5e9', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#e0f2fe', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  if (view === 'predictions') {
    // Get appropriate predictions based on current selection
    let predictions = data.predictions
    let predictionTitle = 'Global'
    let predictionSubtitle = 'AI-powered forecasts for the next 90 days based on global historical trends and patterns'

    if (country && data.countryPredictions?.[country]) {
      predictions = data.countryPredictions[country]
      predictionTitle = `${country}`
      predictionSubtitle = `AI-powered forecasts for ${country} based on country-specific historical trends and patterns`
    }

    return (
      <div className="space-y-6">
        <div className="glass-card p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">Machine Learning Predictions - {predictionTitle}</h2>
          <p className="text-gray-300 mb-6">
            {predictionSubtitle}
          </p>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-4 text-white">Predicted Case Trends</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={predictions}>
              <defs>
                <linearGradient id="casesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fontSize: 12 }}
                tickFormatter={formatNumber}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any) => [formatNumber(value), '']}
              />
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="none"
                fill="url(#casesGradient)"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="predictedCases"
                stroke="#0ea5e9"
                strokeWidth={3}
                fill="url(#casesGradient)"
                strokeDasharray="5 5"
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stroke="none"
                fill="url(#casesGradient)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 text-white">Predicted Deaths</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatNumber}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any) => [formatNumber(value), 'Deaths']}
                />
                <Line
                  type="monotone"
                  dataKey="predictedDeaths"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 text-white">Predicted Vaccination Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatNumber}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any) => [formatNumber(value), 'Vaccinated']}
                />
                <Line
                  type="monotone"
                  dataKey="predictedVaccinated"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-4 text-white">Key Predictions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-2">30-Day Case Projection</h4>
              <p className="text-2xl font-bold text-blue-400">
                {formatNumber(predictions[29]?.predictedCases || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {predictions[29] ? `${Math.round(((predictions[29].upperBound - predictions[29].lowerBound) / predictions[29].predictedCases) * 100)}%` : '0%'} confidence interval
              </p>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-2">Vaccination Growth</h4>
              <p className="text-2xl font-bold text-green-400">
                {predictions.length > 30 ? `+${Math.round(((predictions[29].predictedVaccinated - predictions[0].predictedVaccinated) / predictions[0].predictedVaccinated) * 100)}%` : '+0%'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Expected monthly increase</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <h4 className="text-sm text-gray-400 mb-2">Mortality Trend</h4>
              <p className="text-2xl font-bold text-orange-400">
                {predictions.length > 30 && predictions[29].predictedDeaths > predictions[0].predictedDeaths ? 'Increasing' : 'Declining'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {predictions.length > 30 ? `${Math.round(Math.abs((predictions[29].predictedDeaths - predictions[0].predictedDeaths) / predictions[0].predictedDeaths) * 100)}%` : '0%'} change projected
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'country' && country) {
    const countryData = data.countries.find(c => c.country === country)
    
    if (!countryData || !countryData.states) {
      return (
        <div className="glass-card p-6">
          <p className="text-gray-300">No state-level data available for {country}</p>
        </div>
      )
    }

    const stateChartData = countryData.states.map(state => ({
      name: state.state,
      cases: state.totalCases,
      deaths: state.deaths,
      recovered: state.recovered,
      vaccinated: state.vaccinated,
    }))

    return (
      <div className="space-y-6">
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-4 text-white">State-wise Case Distribution</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={stateChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fontSize: 12 }}
                tickFormatter={formatNumber}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => [formatNumber(value), '']}
              />
              <Legend />
              <Bar dataKey="cases" fill="#0ea5e9" name="Total Cases" />
              <Bar dataKey="recovered" fill="#10b981" name="Recovered" />
              <Bar dataKey="deaths" fill="#ef4444" name="Deaths" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 text-white">Vaccination Coverage by State</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stateChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis 
                  type="number"
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatNumber}
                />
                <YAxis 
                  type="category"
                  dataKey="name" 
                  stroke="#94a3b8"
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => [formatNumber(value), 'Vaccinated']}
                />
                <Bar dataKey="vaccinated" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 text-white">State Comparison</h3>
            <div className="space-y-3">
              {countryData.states.slice(0, 5).map((state, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                  onClick={() => onStateSelect?.(state.state)}
                >
                  <div>
                    <p className="font-semibold text-white">{state.state}</p>
                    <p className="text-xs text-gray-400">
                      {formatNumber(state.totalCases)} cases
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-400">
                      {state.population > 0 ? ((state.vaccinated / state.population) * 100).toFixed(1) : 'N/A'}%
                    </p>
                    <p className="text-xs text-gray-500">vaccinated</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Global view
  const recentTimeSeries = data.timeSeries.slice(-60)
  const topCountries = data.countries
    .filter(c => c.totalCases > 0)
    .map(c => ({ ...c, activeCases: c.totalCases - c.recovered - c.deaths }))
    .sort((a, b) => b.activeCases - a.activeCases)
    .slice(0, 10)

  // Color function for active cases - more diverse colors
  const getActiveCaseColor = (activeCases: number, isTop: boolean) => {
    if (isTop) return '#ef4444' // Red for top country
    const maxActive = topCountries[0]?.activeCases || 1
    const ratio = activeCases / maxActive
    if (ratio > 0.8) return '#dc2626' // Dark red
    if (ratio > 0.6) return '#f59e0b' // Orange
    if (ratio > 0.5) return '#d97706' // Dark orange
    if (ratio > 0.4) return '#eab308' // Yellow
    if (ratio > 0.3) return '#ca8a04' // Dark yellow
    if (ratio > 0.2) return '#84cc16' // Lime
    if (ratio > 0.1) return '#65a30d' // Dark lime
    return '#22c55e' // Green
  }

  const pieData = [
    { name: 'Active', value: data.global.activeCases, color: '#f59e0b' },
    { name: 'Recovered', value: data.global.recovered, color: '#10b981' },
    { name: 'Deaths', value: data.global.deaths, color: '#ef4444' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <h3 className="text-lg font-bold mb-3 text-white">Global Case Trends (Last 60 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={recentTimeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                tickFormatter={formatNumber}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any, name: string) => [
                  formatNumber(value),
                  name.charAt(0).toUpperCase() + name.slice(1)
                ]}
              />
              <Legend />
              <Line type="monotone" dataKey="cases" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Cases" />
              <Line type="monotone" dataKey="recovered" stroke="#10b981" strokeWidth={2} dot={false} name="Recovered" />
              <Line type="monotone" dataKey="deaths" stroke="#ef4444" strokeWidth={2} dot={false} name="Deaths" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-lg font-bold mb-3 text-white">Global Case Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                // Compute percent using global totals (more reliable across Recharts versions)
                label={(props: any) => {
                  const name = props.name ?? props.payload?.name ?? ''
                  const value = Number(props.value ?? props.payload?.value ?? 0)
                  const total = Number(data.global.activeCases || 0) + Number(data.global.recovered || 0) + Number(data.global.deaths || 0) || 1
                  const pct = (value / total) * 100
                  return `${name}: ${pct.toFixed(0)}%`
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              {/* Custom tooltip to avoid tiny empty/default tooltip box and show readable values */}
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 glass-card p-4">
          <h3 className="text-lg font-bold mb-3 text-white">Top 10 Countries by Active Cases</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {topCountries.map((c, i) => {
              const activeCases = c.activeCases
              const color = getActiveCaseColor(activeCases, i === 0)
              const percentage = ((activeCases / (topCountries[0]?.activeCases || 1)) * 100).toFixed(1)
              return (
                <div
                  key={c.country}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer border-l-4"
                  style={{ borderLeftColor: color }}
                  onClick={() => setSelectedCountry(prev => prev === c.country ? null : c.country)}
                >
                  <div className="flex items-center gap-2">
                    <div className="text-base font-bold text-gray-400 w-5">{i + 1}</div>
                    <div>
                      <div className="font-semibold text-white text-sm">{c.country}</div>
                      <div className="text-xs text-gray-400">
                        {formatNumber(activeCases)} active cases
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color }}>
                      {percentage}%
                    </div>
                    <div className="text-xs text-gray-500">of top country</div>
                  </div>
                </div>
              )
            })}
          </div>
          {selectedCountry && (
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="font-semibold text-white mb-2 text-sm">{selectedCountry} Details</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400">Total Cases:</span>
                  <span className="text-white ml-1">
                    {formatNumber(data.countries.find(c => c.country === selectedCountry)?.totalCases || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Recovered:</span>
                  <span className="text-green-400 ml-1">
                    {formatNumber(data.countries.find(c => c.country === selectedCountry)?.recovered || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Deaths:</span>
                  <span className="text-red-400 ml-1">
                    {formatNumber(data.countries.find(c => c.country === selectedCountry)?.deaths || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Vaccinated:</span>
                  <span className="text-purple-400 ml-1">
                    {formatNumber(data.countries.find(c => c.country === selectedCountry)?.vaccinated || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card p-4">
          <h3 className="text-lg font-bold mb-3 text-white">Vaccination Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={recentTimeSeries}>
              <defs>
                <linearGradient id="vaccineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                tickFormatter={formatNumber}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any) => [formatNumber(value), 'Vaccinated']}
              />
              <Area
                type="monotone"
                dataKey="vaccinated"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#vaccineGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
