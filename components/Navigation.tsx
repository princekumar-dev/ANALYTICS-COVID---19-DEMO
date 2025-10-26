'use client'

import { Globe, Map, TrendingUp, Upload, Play } from 'lucide-react'

interface NavigationProps {
  currentView: 'globe' | 'country' | 'predictions' | 'upload'
  onViewChange: (view: 'globe' | 'country' | 'predictions' | 'upload') => void
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  return (
    <nav className="glass sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">COVID-19 Dashboard</h1>
              <p className="text-xs text-gray-400">Global Health Analytics</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onViewChange('globe')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentView === 'globe'
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Global</span>
            </button>

            <button
              onClick={() => onViewChange('country')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentView === 'country'
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Countries</span>
            </button>

            <button
              onClick={() => onViewChange('predictions')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentView === 'predictions'
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Predictions</span>
            </button>



            <button
              onClick={() => onViewChange('upload')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                currentView === 'upload'
                  ? 'bg-secondary text-white'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Data</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
