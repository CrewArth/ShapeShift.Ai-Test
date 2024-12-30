'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { ArrowRight, Wand2, Image as ImageIcon, Type, Lightbulb, Sparkles, IndianRupee, Check, Info } from 'lucide-react';
import './tutorial.css';

// Example prompts for Text-to-3D
const textToModelExamples = [
  {
    title: "Sci-Fi Character",
    prompt: "A futuristic cyborg warrior with glowing blue energy lines, detailed armor, standing in a combat pose",
    tips: ["Include specific details about materials", "Describe the pose clearly", "Mention color schemes"]
  },
  {
    title: "Fantasy Creature",
    prompt: "A majestic dragon with iridescent scales, large wings spread wide, perched on a crystal formation",
    tips: ["Describe textures and materials", "Include size references", "Add environmental context"]
  },
  {
    title: "Everyday Object",
    prompt: "A vintage leather armchair with brass studs, worn leather texture, deep brown color, wooden legs",
    tips: ["Be specific about materials", "Include color information", "Describe wear and tear if relevant"]
  }
];

// Tips for Image-to-3D
const imageToModelTips = [
  "Use high-resolution images with good lighting",
  "Ensure the subject is clearly visible against the background",
  "Avoid images with multiple overlapping objects",
  "Choose images with the subject in focus",
  "Prefer images with the subject from a good angle"
];

// Add new constants for pricing info
const creditSystemInfo = [
  {
    title: "Pay As You Go",
    description: "Purchase credit packs and use them whenever you need. Each model generation costs 5 credits.",
    features: [
      
      "Credits never expire",
      "Use for both Text-to-3D and Image-to-3D",
      "Download in multiple formats"
    ]
  },
  {
    title: "Cost Per Generation",
    description: "Each 3D model generation costs 5 credits, regardless of whether you use Text-to-3D or Image-to-3D.",
    features: [
      "Text-to-3D: 5 credits",
      "Image-to-3D: 5 credits",
      "Multiple attempts allowed",
      "High-quality outputs"
    ]
  },
  {
    title: "Credit Packs",
    description: "Purchase credit packs at discounted rates. The more credits you buy, the better the value.",
    features: [
      "Starter Pack: 25 credits Free",
      "Popular Pack: 100 credits",
      "Pro Pack: 400 credits",
      "Pro Max Pack: 1000 credits"
    ]
  }
];

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="tutorial-hero">
        <div className="container mx-auto px-4">
          <motion.h1 
            className="tutorial-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            How to Create Amazing 3D Models
          </motion.h1>
          <motion.p 
            className="tutorial-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Learn how to use our AI-powered tools to transform your ideas and images into stunning 3D models
          </motion.p>
        </div>
      </section>

      {/* Text to 3D Section */}
      <section className="tutorial-section">
        <div className="container mx-auto px-4">
          <div className="section-header">
            <Type className="section-icon" />
            <h2>Text to 3D Tutorial</h2>
          </div>
          
          <div className="content-grid">
            <div className="text-content">
              <h3>How It Works</h3>
              <p>
                Our Text-to-3D AI understands natural language descriptions and converts them into
                detailed 3D models. The key to getting great results is providing clear, detailed
                descriptions of what you want to create.
              </p>

              <div className="steps-container">
                <div className="step">
                  <div className="step-number">1</div>
                  <h4>Write a Detailed Prompt</h4>
                  <p>
                    Be specific about materials, colors, textures, and poses. The more detail you
                    provide, the better the results will be.
                  </p>
                </div>

                <div className="step">
                  <div className="step-number">2</div>
                  <h4>Choose Style (Optional)</h4>
                  <p>
                    You can specify art styles like "low-poly", "realistic", "cartoon", or
                    "sci-fi" to guide the model generation.
                  </p>
                </div>

                <div className="step">
                  <div className="step-number">3</div>
                  <h4>Generate and Refine</h4>
                  <p>
                    Click generate and wait for your model. If needed, adjust your prompt and
                    try again for different results.
                  </p>
                </div>
              </div>

              <div className="example-prompts">
                <h3>Example Prompts to Try</h3>
                <div className="prompts-grid">
                  {textToModelExamples.map((example, index) => (
                    <div key={index} className="prompt-card">
                      <h4>{example.title}</h4>
                      <p className="prompt-text">{example.prompt}</p>
                      <div className="tips-list">
                        {example.tips.map((tip, tipIndex) => (
                          <div key={tipIndex} className="tip-item">
                            <Lightbulb className="w-4 h-4" />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image to 3D Section */}
      <section className="tutorial-section bg-[var(--background-secondary)]">
        <div className="container mx-auto px-4">
          <div className="section-header">
            <ImageIcon className="section-icon" />
            <h2>Image to 3D Tutorial</h2>
          </div>
          
          <div className="content-grid">
            <div className="text-content">
              <h3>How It Works</h3>
              <p>
                Our Image-to-3D AI analyzes your 2D images and converts them into detailed 3D models.
                The quality of your input image greatly affects the final result.
              </p>

              <div className="example-container">
                <div className="example-image">
                  <Image
                    src="/girl.png"
                    alt="Example image for 3D conversion"
                    width={400}
                    height={400}
                    className="rounded-lg"
                  />
                  <div className="image-caption">
                    Example of a good input image: Clear subject, good lighting, and clean background
                  </div>
                </div>

                <div className="tips-container">
                  <h4>Tips for Best Results</h4>
                  <div className="tips-grid">
                    {imageToModelTips.map((tip, index) => (
                      <div key={index} className="tip-card">
                        <Sparkles className="tip-icon" />
                        <p>{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="steps-container">
                <div className="step">
                  <div className="step-number">1</div>
                  <h4>Prepare Your Image</h4>
                  <p>
                    Choose a high-quality image with good lighting and a clear view of your subject.
                    The image should be at least 512x512 pixels.
                  </p>
                </div>

                <div className="step">
                  <div className="step-number">2</div>
                  <h4>Upload and Process</h4>
                  <p>
                    Upload your image and wait while our AI analyzes it and creates a 3D model.
                    This usually takes about 2-3 minutes.
                  </p>
                </div>

                <div className="step">
                  <div className="step-number">3</div>
                  <h4>Download and Use</h4>
                  <p>
                    Once processing is complete, you can preview your 3D model and download it
                    in various formats for your projects.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing and Credits Section */}
      <section className="tutorial-section">
        <div className="container mx-auto px-4">
          <div className="section-header">
            <IndianRupee className="section-icon" />
            <h2>Understanding Credits & Pricing</h2>
          </div>
          
          <div className="content-grid">
            <div className="text-content">
              <h3>How Our Credit System Works</h3>
              <p>
                Our simple credit-based system allows you to pay only for what you need.
                Whether you're creating a single model or building an entire collection,
                we have flexible options to suit your needs.
              </p>

              <div className="credit-info-grid">
                {creditSystemInfo.map((info, index) => (
                  <div key={index} className="credit-info-card">
                    <h4>{info.title}</h4>
                    <p>{info.description}</p>
                    <ul className="feature-list">
                      {info.features.map((feature, featureIndex) => (
                        <li key={featureIndex}>
                          <Check className="w-4 h-4" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="pricing-note">
                <Info className="w-5 h-5" />
                <p>
                  Credits are non-refundable but never expire. You can use your credits
                  anytime for any type of 3D model generation.
                </p>
              </div>

              <div className="text-center mt-8">
                <Link href="/pricing" className="view-pricing-button">
                  <IndianRupee className="w-5 h-5" />
                  View Detailed Pricing
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="container mx-auto px-4 text-center">
          <h2>Ready to Create Your First 3D Model?</h2>
          <p>Choose your preferred method and start creating amazing 3D models now!</p>
          
          <div className="cta-buttons">
            <Link href="/workspace/text-to-3d" className="cta-button text">
              <Type className="w-5 h-5" />
              Try Text to 3D
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/workspace/image-to-3d" className="cta-button image">
              <ImageIcon className="w-5 h-5" />
              Try Image to 3D
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 