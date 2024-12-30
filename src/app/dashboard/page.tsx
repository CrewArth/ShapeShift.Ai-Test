'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import AuthCheck from '@/components/auth-check'
import TextTo3DImage from '@/assets/text-to-3d.png'
import ImageTo3DImage from '@/assets/image-to-3d.png'
import ForumImage from '@/assets/forum.png'
import { Wand2, ImageIcon, Users } from 'lucide-react'
import './dashboard.css'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
}

export default function Dashboard() {
  return (
    <div className="dashboard-wrapper">
      <AuthCheck />
      <Navbar />
      
      <main className="dashboard-main">
        <motion.div
          className="dashboard-container"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="dashboard-header"
            variants={itemVariants}
          >
            <h1 className="dashboard-title">Welcome to your Creative Space</h1>
            <p className="dashboard-subtitle">Transform your ideas into stunning 3D models</p>
          </motion.div>

          <div className="dashboard-grid">
            <motion.div variants={itemVariants}>
              <Link href="/workspace/text-to-3d" className="feature-card text-to-3d">
                <div className="feature-card-content">
                  <div className="feature-icon-wrapper">
                    <Wand2 className="feature-icon" />
                  </div>
                  <h2 className="feature-title">Text to 3D</h2>
                  <p className="feature-description">
                    Transform your text descriptions into stunning 3D models using AI
                  </p>
                </div>
                <div className="feature-image-container">
                  <Image
                    src={TextTo3DImage}
                    alt="Text to 3D"
                    className="feature-image"
                    priority
                  />
                </div>
                <div className="feature-overlay">
                  <span className="feature-cta">Get Started →</span>
                </div>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Link href="/workspace/image-to-3d" className="feature-card image-to-3d">
                <div className="feature-card-content">
                  <div className="feature-icon-wrapper">
                    <ImageIcon className="feature-icon" />
                  </div>
                  <h2 className="feature-title">Image to 3D</h2>
                  <p className="feature-description">
                    Convert your images into detailed 3D models with a single click
                  </p>
                </div>
                <div className="feature-image-container">
                  <Image
                    src={ImageTo3DImage}
                    alt="Image to 3D"
                    className="feature-image"
                    priority
                  />
                </div>
                <div className="feature-overlay">
                  <span className="feature-cta">Get Started →</span>
                </div>
              </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Link href="/forum" className="feature-card forum">
                <div className="feature-card-content">
                  <div className="feature-icon-wrapper">
                    <Users className="feature-icon" />
                  </div>
                  <h2 className="feature-title">
                    Forum
                    <span className="new-badge">New</span>
                  </h2>
                  <p className="feature-description">
                    Join our community to share and explore amazing 3D creations
                  </p>
                </div>
                <div className="feature-image-container">
                  <Image
                    src={ForumImage}
                    alt="Community Forum"
                    className="feature-image"
                    priority
                  />
                </div>
                <div className="feature-overlay">
                  <span className="feature-cta">Look out→</span>
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  )
} 