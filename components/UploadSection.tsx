'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'
import { CovidData } from '@/types'

interface UploadSectionProps {
  onDataUpload: (data: CovidData[]) => void
}

export default function UploadSection({ onDataUpload }: UploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setUploadStatus('error')
      setErrorMessage('Please upload a CSV file')
      return
    }

    setFileName(file.name)
    setUploadStatus('processing')
    setErrorMessage('')

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as any[]
          
          // Transform to CovidData format
          const covidData: CovidData[] = data.map(row => ({
            country: row.country || row.Country || row.location || '',
            state: row.state || row.State || row.region || undefined,
            date: row.date || row.Date || new Date().toISOString().split('T')[0],
            totalCases: Number(row.totalCases || row.total_cases || row.cases || 0),
            activeCases: Number(row.activeCases || row.active_cases || row.active || 0),
            recovered: Number(row.recovered || row.Recovered || 0),
            deaths: Number(row.deaths || row.Deaths || 0),
            vaccinated: Number(row.vaccinated || row.Vaccinated || row.people_vaccinated || 0),
            population: Number(row.population || row.Population || 0),
            latitude: Number(row.latitude || row.lat || 0),
            longitude: Number(row.longitude || row.lng || row.lon || 0),
          })).filter(item => item.country)

          if (covidData.length === 0) {
            throw new Error('No valid data found in CSV')
          }

          setUploadStatus('success')
          setTimeout(() => {
            onDataUpload(covidData)
          }, 1000)
        } catch (error) {
          setUploadStatus('error')
          setErrorMessage('Error parsing CSV file. Please check the format.')
        }
      },
      error: () => {
        setUploadStatus('error')
        setErrorMessage('Error reading CSV file')
      },
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-6">
        <h2 className="text-3xl font-bold mb-2 text-white">Upload COVID-19 Data</h2>
        <p className="text-gray-300">
          Upload your CSV file containing COVID-19 data to visualize and analyze
        </p>
      </div>

      <div className="glass-card p-8">
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploadStatus === 'idle' && (
            <>
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Drop your CSV file here
              </h3>
              <p className="text-gray-400 mb-6">
                or click to browse from your computer
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-lg font-semibold transition-all"
              >
                Select File
              </button>
            </>
          )}

          {uploadStatus === 'processing' && (
            <>
              <div className="spinner mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-white mb-2">Processing...</h3>
              <p className="text-gray-400">{fileName}</p>
            </>
          )}

          {uploadStatus === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <h3 className="text-xl font-semibold text-white mb-2">Upload Successful!</h3>
              <p className="text-gray-400 mb-6">{fileName}</p>
              <button
                onClick={() => {
                  setUploadStatus('idle')
                  setFileName('')
                }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all"
              >
                Upload Another File
              </button>
            </>
          )}

          {uploadStatus === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <h3 className="text-xl font-semibold text-white mb-2">Upload Failed</h3>
              <p className="text-red-400 mb-6">{errorMessage}</p>
              <button
                onClick={() => {
                  setUploadStatus('idle')
                  setErrorMessage('')
                  setFileName('')
                }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <FileText className="w-8 h-8 text-primary mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">CSV Format Requirements</h3>
          <p className="text-sm text-gray-300 mb-3">
            Your CSV file should include the following columns:
          </p>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• <span className="text-white">country</span> - Country name</li>
            <li>• <span className="text-white">state</span> - State/region (optional)</li>
            <li>• <span className="text-white">date</span> - Date in YYYY-MM-DD format</li>
            <li>• <span className="text-white">totalCases</span> - Total confirmed cases</li>
            <li>• <span className="text-white">activeCases</span> - Active cases</li>
            <li>• <span className="text-white">recovered</span> - Recovered cases</li>
            <li>• <span className="text-white">deaths</span> - Total deaths</li>
            <li>• <span className="text-white">vaccinated</span> - Vaccination count (optional)</li>
          </ul>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-3">Example CSV Format</h3>
          <div className="bg-black/30 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto">
            <pre>
{`country,state,date,totalCases,activeCases,recovered,deaths,vaccinated
USA,California,2023-01-15,5000000,100000,4800000,100000,30000000
USA,Texas,2023-01-15,3000000,80000,2850000,70000,20000000
India,Maharashtra,2023-01-15,7000000,150000,6700000,150000,50000000`}
            </pre>
          </div>
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-white mb-3">Data Sources</h3>
        <p className="text-sm text-gray-300 mb-3">
          You can download COVID-19 datasets from these reliable sources:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://github.com/CSSEGISandData/COVID-19"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-all"
          >
            <h4 className="font-semibold text-white mb-1">Johns Hopkins</h4>
            <p className="text-xs text-gray-400">CSSE COVID-19 Dataset</p>
          </a>
          <a
            href="https://ourworldindata.org/coronavirus"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-all"
          >
            <h4 className="font-semibold text-white mb-1">Our World in Data</h4>
            <p className="text-xs text-gray-400">Global COVID-19 Data</p>
          </a>
          <a
            href="https://covid19.who.int/data"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-all"
          >
            <h4 className="font-semibold text-white mb-1">WHO</h4>
            <p className="text-xs text-gray-400">Official WHO Data</p>
          </a>
        </div>
      </div>
    </div>
  )
}
