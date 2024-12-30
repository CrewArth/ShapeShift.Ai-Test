'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Model } from '@/types/model'
import './model-view.css'

export default function ModelView() {
  const params = useParams()
  const [model, setModel] = useState<Model | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchModel()
  }, [params.id])

  const fetchModel = async () => {
    try {
      const response = await fetch(`/api/models/${params.id}`)
      const data = await response.json()
      setModel(data.model)
    } catch (error) {
      console.error('Error fetching model:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      
      <div className="min-h-screen bg-[var(--background)]">
        <Navbar />
        
        <main className="container mx-auto px-4 pt-24 pb-12">
          {loading ? (
            <div className="loading-state">Loading model...</div>
          ) : model ? (
            <div className="model-view-container">
              <motion.div 
                className="model-details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="model-title">{model.title}</h1>
                <p className="model-creator">
                  Created by <span className="creator-name">{model.userName}</span>
                </p>
                <div className="prompt-container">
                  <h2 className="prompt-title">Prompt Used</h2>
                  <p className="prompt-text">{model.prompt}</p>
                </div>
              </motion.div>

              <motion.div 
                className="model-viewer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Canvas
                  camera={{ position: [0, 0, 5], fov: 50 }}
                  style={{ height: '500px' }}
                >
                  <ambientLight intensity={0.5} />
                  <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                  <pointLight position={[-10, -10, -10]} />
                  
                  {/* Add your 3D model component here */}
                  {/* This will depend on how you're loading and displaying your 3D models */}
                  
                  <OrbitControls />
                </Canvas>
              </motion.div>
            </div>
          ) : (
            <div className="error-state">
              Model not found or an error occurred.
            </div>
          )}
        </main>
      </div>
    </>
  )
} 