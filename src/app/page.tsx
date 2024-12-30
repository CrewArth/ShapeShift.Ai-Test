'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FaLinkedin, FaGithub, FaYoutube, FaInstagram } from 'react-icons/fa'
import { Box, ImageIcon, Package2, Palette, Code, Shapes } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import './home.css'
import AboutUsImage from '../assets/AboutUsImage.png'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

// Animation variants
const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

const gradientTextVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3,
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

export default function Home() {
  const { isSignedIn } = useUser()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, message })
      });

      if (!response.ok) throw new Error('Failed to send message');

      setSubmitStatus('success')
      setEmail('')
      setMessage('')
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>, path: string) => {
    e.preventDefault();
    if (path.startsWith('/workspace')) {
      if (isSignedIn) {
        router.push(path);
      } else {
        // Redirect to sign-in with the correct local dashboard URL
        window.location.href = 'https://humorous-oarfish-98.accounts.dev/sign-in?redirect_url=http://localhost:3000/dashboard';
      }
    } else {
      router.push(path);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-pattern" />
        <div className="floating-shapes">
          <div className="floating-shape" />
          <div className="floating-shape" />
          <div className="floating-shape" />
        </div>
        <div className="hero-content">
          <motion.div 
            className="hero-title-container"
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              variants={textVariants}
              className="hero-title-top"
            >
              Transform Ideas into
            </motion.h1>
            <motion.h1
              variants={gradientTextVariants}
              className="hero-title-gradient"
            >
              3D Reality
            </motion.h1>
          </motion.div>
          <motion.p 
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            Create stunning 3D models from text descriptions or images using advanced AI technology.
            Perfect for designers, developers, and creators.
          </motion.p>
          <motion.div 
            className="button-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <motion.button
              className="button-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => handleButtonClick(e, '/workspace/text-to-3d')}
            >
              Try Text to 3D
            </motion.button>
            <motion.button
              className="button-secondary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => handleButtonClick(e, '/workspace/image-to-3d')}
            >
              Try Image to 3D
            </motion.button>
            <motion.button
              className="button-forum"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/forum')}
            >
              Explore Community
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="section">
        <h2 className="section-title">What We Offer</h2>
        <div className="section-grid">
          <div className="feature-card">
            <Box className="feature-icon w-12 h-12" />
            <h3 className="feature-title">Text to 3D</h3>
            <p className="feature-description">
              Transform your text descriptions into detailed 3D models using advanced AI technology.
            </p>
          </div>

          <div className="feature-card">
            <ImageIcon className="feature-icon w-12 h-12" />
            <h3 className="feature-title">Image to 3D</h3>
            <p className="feature-description">
              Convert your images into high-quality 3D models with accurate textures and details.
            </p>
          </div>

          <div className="feature-card">
            <Package2 className="feature-icon w-12 h-12" />
            <h3 className="feature-title">Multiple Formats</h3>
            <p className="feature-description">
              Export your 3D models in various formats including GLB, FBX, and OBJ for any use case.
            </p>
          </div>
        </div>
      </section>

      {/* Who We Cater To Section */}
      <section className="section bg-[var(--background-secondary)]">
        <h2 className="section-title">Who We Cater To</h2>
        <div className="section-grid">
          <div className="feature-card bg-[var(--background)]">
            <Palette className="feature-icon w-12 h-12" />
            <h3 className="feature-title">3D Artists</h3>
            <p className="feature-description">
              Streamline your workflow and quickly generate base models for further refinement.
            </p>
          </div>

          <div className="feature-card bg-[var(--background)]">
            <Shapes className="feature-icon w-12 h-12" />
            <h3 className="feature-title">Designers</h3>
            <p className="feature-description">
              Create 3D assets for your design projects without extensive 3D modeling experience.
            </p>
          </div>

          <div className="feature-card bg-[var(--background)]">
            <Code className="feature-icon w-12 h-12" />
            <h3 className="feature-title">Game Developers</h3>
            <p className="feature-description">
              Rapidly prototype and generate game assets to accelerate your development process.
            </p>
          </div>
        </div>
        <p className="time-saving-message">
          We accomplish tasks that typically take 3-4 hours in just 5 minutes with our web app, 
          significantly saving developers' time.
        </p>
      </section>

      {/* About Developer Section */}
      <section className="about-section">
        <div className="about-pattern" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="about-title text-center mb-12">About Developer</h2>
          <div className="about-developer-grid">
            {/* Image Column */}
            <div className="about-image-container">
              <div className="about-image-wrapper">
                <Image
                  src={AboutUsImage}
                  alt="Arth Vala"
                  width={400}
                  height={400}
                  className="about-image"
                  priority
                />
              </div>
            </div>

            {/* Content Column */}
            <div className="about-content">
              <div className="about-text">
                <p>
                  My name is <span className="font-bold">Arth Vala</span>, and I am a final-year student at <span className="font-bold">Parul University</span>,
                  pursuing an Integrated MCA with a specialization in Artificial Intelligence.
                  Set to graduate in 2025, I am deeply passionate about advancing technologies 
                  in Artificial Intelligence, Computer Vision, Deep Learning, and Machine Learning.
                </p>
                <p>
                  My academic journey has been driven by a strong interest in exploring the potential 
                  of AI and its transformative impact on real-world applications.
                </p>
                <p>
                  I'm currently focused on building AI-powered applications, 
                  contributing to open-source projects, and mentoring aspiring developers. 
                  Feel free to connect with me on my journey!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="section">
        <h2 className="section-title">Get in Touch</h2>
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="message" className="form-label">Message</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="form-input"
              rows={5}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="form-submit"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
          {submitStatus === 'success' && (
            <p className="success-message">Message sent successfully!</p>
          )}
          {submitStatus === 'error' && (
            <p className="error-message">Failed to send message. Please try again.</p>
          )}
        </form>
      </section>

      {/* Follow Me Section */}
      <section className="follow-section">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            className="follow-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Follow Me
          </motion.h2>
          <motion.div 
            className="social-icons-grid"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.a
              href="https://linkedin.com/in/arthvala"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon linkedin"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaLinkedin size={24} />
              <span>LinkedIn</span>
            </motion.a>

            <motion.a
              href="https://github.com/CrewArth"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon github"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaGithub size={24} />
              <span>GitHub</span>
            </motion.a>

            <motion.a
              href="https://youtube.com/c/CricketGuruji15"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon youtube"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaYoutube size={24} />
              <span>YouTube</span>
            </motion.a>

            <motion.a
              href="https://instagram.com/arthvala.15"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon instagram"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaInstagram size={24} />
              <span>Instagram</span>
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div>
              <h3 className="footer-brand">
                ShapeShift AI
              </h3>
              <p className="footer-description">
                Transform your ideas into stunning 3D models using AI technology.
              </p>
            </div>
            <div>
              <h4 className="footer-section-title">Quick Links</h4>
              <div className="footer-links">
                <Link href="/workspace/text-to-3d" className="footer-link">
                  Text to 3D
                </Link>
                <Link href="/workspace/image-to-3d" className="footer-link">
                  Image to 3D
                </Link>
                <Link href="/dashboard" className="footer-link">
                  Dashboard
                </Link>
              </div>
            </div>
            <div>
              <h4 className="footer-section-title">Connect</h4>
              <div className="footer-links">
                <a href="mailto:support@shapeshiftai.com" className="footer-link">
                  support@shapeshiftai.com
                </a>
                <Link href="/contact" className="footer-link">
                  Contact Form
                </Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 ShapeShift AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 