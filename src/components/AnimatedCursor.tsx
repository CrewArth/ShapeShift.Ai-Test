'use client'

import React, { useEffect, useState } from 'react'
import './animated-cursor.css'

export default function AnimatedCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPointer, setIsPointer] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isClicked, setIsClicked] = useState(false)

  useEffect(() => {
    const updateCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }

    const updateCursorStyle = () => {
      const element = document.elementFromPoint(position.x, position.y)
      const isClickable = element?.matches('button, a, input, select, textarea') ||
        element?.closest('button, a, input, select, textarea') !== null
      setIsPointer(isClickable)
    }

    const handleMouseDown = () => setIsClicked(true)
    const handleMouseUp = () => setIsClicked(false)
    const handleMouseEnter = () => setIsVisible(true)
    const handleMouseLeave = () => setIsVisible(false)

    document.addEventListener('mousemove', updateCursor)
    document.addEventListener('mouseover', updateCursorStyle)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseenter', handleMouseEnter)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mousemove', updateCursor)
      document.removeEventListener('mouseover', updateCursorStyle)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseenter', handleMouseEnter)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [position])

  if (!isVisible) return null

  return (
    <>
      <div 
        className={`cursor-dot ${isClicked ? 'cursor-clicked' : ''}`}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`
        }}
      />
      <div 
        className={`cursor-ring ${isPointer ? 'cursor-ring-pointer' : ''} ${isClicked ? 'cursor-clicked' : ''}`}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`
        }}
      />
    </>
  )
} 