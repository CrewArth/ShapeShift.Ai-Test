'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { useNotification } from '@/contexts/NotificationContext';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { FaLinkedin, FaGithub, FaYoutube, FaInstagram } from 'react-icons/fa';
import Link from 'next/link';
import './contact.css';

export default function ContactPage() {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          subject,
          message,
          type: 'contact'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      showNotification('Message sent successfully!', 'success');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification(
        error instanceof Error ? error.message : 'Failed to send message',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Navbar />
      <div className="contact-container flex-grow">
        <div className="contact-content">
          <h1 className="contact-title">Contact Us</h1>
          <p className="contact-description">
            Have questions or need assistance? We're here to help! Fill out the form below and we'll get back to you as soon as possible.
          </p>

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's this about?"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your message..."
                required
                className="form-textarea"
                rows={5}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? (
                'Sending...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>

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
  );
} 