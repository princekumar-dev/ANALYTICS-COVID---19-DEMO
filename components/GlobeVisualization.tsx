'use client'

import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Html } from '@react-three/drei'
import * as THREE from 'three'
import { ProcessedData } from '@/types'

interface GlobeVisualizationProps {
  data: ProcessedData
  onCountrySelect: (country: string) => void
}

function Globe({ data, onCountrySelect }: GlobeVisualizationProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)

  // Load world map texture safely (avoid hook errors if asset missing)
  const [worldMapTexture, setWorldMapTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load(
      '/earthmap.jpg',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping
        tex.wrapT = THREE.ClampToEdgeWrapping
        tex.needsUpdate = true
        setWorldMapTexture(tex)
      },
      undefined,
      (err) => {
        // Texture missing or failed to load — fall back to simple colored material
        // Log the error for debugging but don't throw
        // console.warn('Globe texture failed to load:', err)
        setWorldMapTexture(null)
      }
    )
  }, [])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001
    }
  })

  const countriesWithActive = data.countries.map(c => ({
    ...c,
    activeCases: c.totalCases - c.recovered - c.deaths
  }))

  const maxActiveCases = Math.max(...countriesWithActive.map(c => c.activeCases))

  const getColorForActiveCases = (activeCases: number) => {
    if (activeCases === maxActiveCases) return new THREE.Color('#ef4444') // Red for highest
    const ratio = activeCases / maxActiveCases
    if (ratio > 0.7) return new THREE.Color('#f59e0b') // Orange
    if (ratio > 0.4) return new THREE.Color('#eab308') // Yellow
    if (ratio > 0.2) return new THREE.Color('#84cc16') // Lime
    return new THREE.Color('#22c55e') // Green
  }

  return (
    <group>
      <Sphere ref={meshRef} args={[2, 64, 64]}>
        <meshStandardMaterial
          map={worldMapTexture ?? undefined}
          color={worldMapTexture ? undefined : '#223244'}
          metalness={0.2}
          roughness={0.8}
        />
      </Sphere>

      <Sphere args={[2.01, 64, 64]}>
        <meshBasicMaterial
          color="#0ea5e9"
          transparent
          opacity={0.1}
          wireframe
        />
      </Sphere>

      {countriesWithActive.map((country, index) => {
        const phi = (90 - country.latitude) * (Math.PI / 180)
        const theta = (country.longitude + 180) * (Math.PI / 180)
        const radius = 2.05

        const x = -(radius * Math.sin(phi) * Math.cos(theta))
        const y = radius * Math.cos(phi)
        const z = radius * Math.sin(phi) * Math.sin(theta)

        const intensity = country.activeCases / maxActiveCases
        const size = 0.05 + intensity * 0.15
        const color = getColorForActiveCases(country.activeCases)

        return (
          <group key={index} position={[x, y, z]}>
            <Sphere
              args={[size, 16, 16]}
              onClick={() => onCountrySelect(country.country)}
              onPointerOver={() => setHoveredCountry(country.country)}
              onPointerOut={() => setHoveredCountry(null)}
            >
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={hoveredCountry === country.country ? 1 : 0.5}
              />
            </Sphere>

            {hoveredCountry === country.country && (
              <Html distanceFactor={10}>
                <div className="bg-black/90 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap pointer-events-none">
                  <div className="font-bold">{country.country}</div>
                  <div className="text-gray-300">
                    Active Cases: {new Intl.NumberFormat().format(country.activeCases)}
                  </div>
                  <div className="text-gray-400">
                    Total Cases: {new Intl.NumberFormat().format(country.totalCases)}
                  </div>
                </div>
              </Html>
            )}
          </group>
        )
      })}

      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
    </group>
  )
}

export default function GlobeVisualization({ data, onCountrySelect }: GlobeVisualizationProps) {
  return (
    <div className="w-full h-full">
      <Canvas gl={{ antialias: true, alpha: true }} camera={{ position: [0, 0, 6], fov: 50 }} style={{ background: 'transparent' }}>
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={4}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={0.5}
        />
        <Globe data={data} onCountrySelect={onCountrySelect} />
      </Canvas>
    </div>
  )
}
