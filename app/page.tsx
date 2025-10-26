'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Navigation from '@/components/Navigation'
import DataPanels from '@/components/DataPanels'
import ChartsSection from '@/components/ChartsSection'
import UploadSection from '@/components/UploadSection'
import { CovidData, ProcessedData, PredictionData } from '@/types'
import { processCovidData, generateMockData } from '@/utils/dataProcessor'

const GlobeVisualization = dynamic(() => import('@/components/GlobeVisualization'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="spinner"></div>
    </div>
  ),
})

export default function Home() {
  const [currentView, setCurrentView] = useState<'globe' | 'country' | 'predictions' | 'upload'>('globe')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [covidData, setCovidData] = useState<ProcessedData | null>(null)
  const [loading, setLoading] = useState(true)


  useEffect(() => {
    // Initialize with mock data
    const mockData = generateMockData()
    setCovidData(mockData)
    setLoading(false)
  }, [])



  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country)
    setCurrentView('country')
  }

  const handleStateSelect = (state: string) => {
    setSelectedState(state)
  }

  const handleDataUpload = (data: CovidData[]) => {
    setLoading(true)
    setTimeout(() => {
      const processed = processCovidData(data)
      setCovidData(processed)
      setLoading(false)
      setCurrentView('globe')
    }, 500)
  }

  // Get appropriate predictions based on current view and selection
  const getCurrentPredictions = (): PredictionData[] => {
    if (!covidData) return []

    if (selectedState && selectedCountry) {
      // State-level predictions
      const stateKey = `${selectedCountry}-${selectedState}`
      return covidData.statePredictions?.[stateKey] || covidData.predictions
    } else if (selectedCountry && currentView === 'predictions') {
      // Country-level predictions
      return covidData.countryPredictions?.[selectedCountry] || covidData.predictions
    } else {
      // Global predictions
      return covidData.predictions
    }
  }

  const handleViewChange = (view: 'globe' | 'country' | 'predictions' | 'upload') => {
    setCurrentView(view)
    if (view === 'globe') {
      setSelectedCountry(null)
      setSelectedState(null)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num)
  }



  if (loading || !covidData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-300">Loading COVID-19 Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation currentView={currentView} onViewChange={handleViewChange} />

      <div className="flex-1 container mx-auto px-4 py-4 max-w-7xl">
        {currentView === 'upload' ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <UploadSection onDataUpload={handleDataUpload} />
          </div>
        ) : (
          <div className="space-y-4">
            <DataPanels
              data={covidData}
              selectedCountry={selectedCountry}
              selectedState={selectedState}
            />

            {currentView === 'globe' && (
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                <div className="xl:col-span-3">
                  <div className="glass-card p-4 h-[500px]">
                    <h2 className="text-xl font-bold mb-3 text-white">Global COVID-19 Map</h2>
                    <GlobeVisualization
                      data={covidData}
                      onCountrySelect={handleCountrySelect}
                    />
                  </div>
                </div>
                <div className="xl:col-span-2">
                  <ChartsSection data={covidData} view="global" />
                </div>
              </div>
            )}

            {currentView === 'country' && selectedCountry && (
              <div className="space-y-4">
                <div className="glass-card p-4">
                  <h2 className="text-2xl font-bold mb-2 text-white">{selectedCountry}</h2>
                  <p className="text-gray-300 text-sm">State-level breakdown and detailed analysis</p>
                </div>
                <ChartsSection
                  data={covidData}
                  view="country"
                  country={selectedCountry}
                  state={selectedState}
                  onStateSelect={handleStateSelect}
                />
              </div>
            )}

            {currentView === 'predictions' && (
              <div className="space-y-4">
                <ChartsSection
                  data={covidData}
                  view="predictions"
                  country={selectedCountry}
                  state={selectedState}
                />
              </div>
            )}


          </div>
        )}
      </div>
    </main>
  )
}
