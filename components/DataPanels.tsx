'use client'

import { Activity, Users, Heart, TrendingUp, TrendingDown, Minus, Syringe } from 'lucide-react'
import { ProcessedData } from '@/types'

interface DataPanelsProps {
  data: ProcessedData
  selectedCountry?: string | null
  selectedState?: string | null
}

export default function DataPanels({ data, selectedCountry, selectedState }: DataPanelsProps) {
  const displayData = selectedCountry
    ? data.countries.find(c => c.country === selectedCountry) || data.global
    : data.global

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num)
  }

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-red-400" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-green-400" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const panels = [
    {
      title: 'Total Cases',
      value: 'totalCases' in displayData ? displayData.totalCases : 0,
      icon: Activity,
      color: 'from-blue-500 to-cyan-500',
      trend: ('trend' in displayData ? displayData.trend : undefined) as 'up' | 'down' | 'stable' | undefined,
      trendValue: 'trendValue' in displayData ? displayData.trendValue : 0,
    },
    {
      title: 'Active Cases',
      value: 'activeCases' in displayData ? displayData.activeCases : 0,
      icon: Users,
      color: 'from-orange-500 to-red-500',
      trend: ('trend' in displayData ? displayData.trend : undefined) as 'up' | 'down' | 'stable' | undefined,
      trendValue: 'trendValue' in displayData ? displayData.trendValue : 0,
    },
    {
      title: 'Recovered',
      value: 'recovered' in displayData ? displayData.recovered : 0,
      icon: Heart,
      color: 'from-green-500 to-emerald-500',
      trend: 'down' as const,
      trendValue: 0,
    },
    {
      title: 'Deaths',
      value: 'deaths' in displayData ? displayData.deaths : 0,
      icon: TrendingDown,
      color: 'from-gray-500 to-slate-600',
      trend: 'stable' as const,
      trendValue: 0,
    },
    {
      title: 'Vaccination Rate',
      value: displayData.vaccinationRate,
      icon: Syringe,
      color: 'from-purple-500 to-pink-500',
      isPercentage: true,
      trend: 'up' as const,
      trendValue: 0,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 animate-fade-in">
      {panels.map((panel, index) => (
        <div
          key={index}
          className="glass-card p-4 relative overflow-hidden"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${panel.color} opacity-10 rounded-full -mr-6 -mt-6`}></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 bg-gradient-to-br ${panel.color} rounded-lg`}>
                <panel.icon className="w-5 h-5 text-white" />
              </div>
              {panel.trend ? (
                <div className="flex items-center space-x-1">
                  {getTrendIcon(panel.trend)}
                  {typeof panel.trendValue === 'number' && panel.trendValue > 0 && (
                    <span className="text-xs text-gray-400">
                      {panel.trendValue.toFixed(1)}%
                    </span>
                  )}
                </div>
              ) : null}
            </div>

            <h3 className="text-sm text-gray-400 mb-1">{panel.title}</h3>
            <p className="text-xl font-bold text-white">
              {panel.isPercentage
                ? `${panel.value.toFixed(1)}%`
                : formatNumber(panel.value)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
