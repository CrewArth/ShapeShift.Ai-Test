'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaGithub, FaLinkedin, FaYoutube } from 'react-icons/fa';
import Navbar from '@/components/Navbar';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function AboutUsContent() {
  const skills = [
    { name: 'Artificial Intelligence', level: 90 },
    { name: 'Machine Learning', level: 85 },
    { name: 'Computer Vision', level: 95 },
    { name: 'Deep Learning', level: 85 }
  ];

  return (
    <>
      <Navbar />
      <div className="about-us-container">
        <motion.section 
          className="hero-section"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <h1 className="hero-title">Meet the Developer</h1>
          <p className="hero-subtitle">Passionate about AI and Innovation</p>
        </motion.section>

        <motion.section 
          className="developer-section"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div 
            className="developer-image-container"
            variants={fadeIn}
          >
            <img 
              src="/developer-image.jpg" 
              alt="Developer" 
              className="developer-image"
            />
          </motion.div>

          <motion.div 
            className="developer-content"
            variants={fadeIn}
          >
            <div className="content-wrapper">
              <h2 className="developer-name">Sai Vignesh</h2>
              <p className="developer-description">
                A passionate AI enthusiast and developer with a strong background in artificial intelligence, 
                machine learning, and computer vision. Currently pursuing Integrated MCA in Computer Applications 
                at Parul University, with a focus on AI/ML technologies. 
              </p>

              <div className="achievements">
                <div className="achievement-item">
                  <h3>ClassiVision Project</h3>
                  <p>Developed an AI-powered educational tool for visually impaired students</p>
                </div>
                <div className="achievement-item">
                  <h3>Research Internship</h3>
                  <p>Contributed to cutting-edge AI research at a leading institution</p>
                </div>
                <div className="achievement-item">
                  <h3>Content Creation</h3>
                  <p>Educational content creator with a growing YouTube following</p>
                </div>
                <div className="achievement-item">
                  <h3>ShapeShift.AI</h3>
                  <p>Created an innovative platform for AI-powered 3D model generation</p>
                </div>
              </div>

              <div className="social-links">
                <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer" className="social-link">
                  <FaGithub className="social-icon" />
                </a>
                <a href="https://linkedin.com/in/yourusername" target="_blank" rel="noopener noreferrer" className="social-link">
                  <FaLinkedin className="social-icon" />
                </a>
                <a href="https://youtube.com/@yourchannel" target="_blank" rel="noopener noreferrer" className="social-link">
                  <FaYoutube className="social-icon" />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.section>

        <motion.section 
          className="skills-section"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.h2 
            className="skills-title"
            variants={fadeIn}
          >
            Technical Expertise
          </motion.h2>
          <div className="skills-grid">
            {skills.map((skill, index) => (
              <motion.div 
                key={skill.name}
                className="skill-card"
                variants={fadeIn}
              >
                <h3>{skill.name}</h3>
                <div className="skill-bar">
                  <div 
                    className="skill-progress"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </>
  );
} 