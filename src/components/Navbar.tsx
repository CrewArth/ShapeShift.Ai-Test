'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronDown, Menu, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import ShapeShiftLogo from '@/assets/ShapeShiftLogo.png'
import './navbar.css'
import { useCredits } from '@/hooks/useCredits'

const resourcesLinks = [
  
  { name: 'Contact Us', href: '/contact' },
  { name: 'About Us', href: '/aboutus' },
  { name: 'FAQ', href: '/faq' },
];

function ResourcesDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { credits } = useCredits();

  return (
    <div className="resources-container">
      <button
        className="resources-button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
      >
        Resources
        <ChevronDown size={16} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          <Link href="/tutorial" className="dropdown-item">
            Tutorial
          </Link>
          <Link href="/history" className="dropdown-item">
            History
          </Link>
          <Link href="/pricing" className="dropdown-item">
            Pricing
            {credits !== undefined && (
              <span className="credits-badge">{credits} credits</span>
            )}
          </Link>
          {resourcesLinks.map((link) => (
            <Link key={link.name} href={link.href} className="dropdown-item">
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { isSignedIn } = useUser()
  const [imageError, setImageError] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const AuthButtons = () => (
    <div className="auth-buttons">
      <SignInButton mode="modal">
        <button className="navbar-button-secondary">
          Sign In
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="navbar-button">
          Get Started
        </button>
      </SignUpButton>
    </div>
  )

  return (
    <motion.nav 
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="navbar-container">
        <Link href="/" className="navbar-brand-container">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 360 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {!imageError ? (
              <Image 
                src={ShapeShiftLogo}
                alt="ShapeShift AI Logo" 
                width={40} 
                height={40}
                className="navbar-logo"
                onError={() => setImageError(true)}
                priority
              />
            ) : (
              <div className="navbar-logo-placeholder">
                S
              </div>
            )}
          </motion.div>
          <span className="navbar-brand-text gradient-text">ShapeShift AI</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-links desktop-only">
          <ResourcesDropdown />
          <ThemeToggle />
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <AuthButtons />
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="mobile-only">
          <button className="mobile-menu-button" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`mobile-menu ${isMenuOpen ? 'show' : ''}`}>
          <ResourcesDropdown />
          <ThemeToggle />
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <AuthButtons />
          )}
        </div>
      </div>
    </motion.nav>
  )
} 