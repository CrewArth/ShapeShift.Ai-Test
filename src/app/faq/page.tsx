'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './faq.css';
import Link from 'next/link';

// FAQ data structure
interface FAQItem {
  question: string;
  answer: string | JSX.Element;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: "Getting Started",
    question: "What is ShapeShift.AI?",
    answer: "ShapeShift.AI is an advanced AI-powered platform that converts text descriptions and images into high-quality 3D models. Using state-of-the-art AI technology, we make 3D model creation accessible to everyone, whether you're a designer, developer, or creator."
  },
  {
    category: "Getting Started",
    question: "How do I get started with ShapeShift.AI?",
    answer: "Getting started is easy: 1) Sign up for an account, 2) Choose between Text-to-3D or Image-to-3D generation, 3) Enter your prompt or upload an image, 4) Click generate and wait for your 3D model. New users receive free credits to try out the service."
  },
  {
    category: "Text to 3D",
    question: "How do I create the best text prompts for 3D generation?",
    answer: (
      <div>
        For best results:
        <ul className="list-disc pl-5 mt-2">
          <li>Be specific about shape, material, and style</li>
          <li>Use descriptive adjectives (e.g., "shiny", "rough", "metallic")</li>
          <li>Include negative prompts to avoid unwanted features</li>
          <li>Focus on a single object rather than complex scenes</li>
          <li>Specify the art style (realistic, cartoon, stylized, etc.)</li>
        </ul>
      </div>
    )
  },
  {
    category: "Image to 3D",
    question: "What types of images work best for Image-to-3D conversion?",
    answer: (
      <div>
        For optimal results:
        <ul className="list-disc pl-5 mt-2">
          <li>Use high-resolution images (at least 1024x1024 pixels)</li>
          <li>Ensure good lighting and clear object visibility</li>
          <li>Avoid complex backgrounds</li>
          <li>Use images with a single main object</li>
          <li>Supported formats: JPG, PNG</li>
        </ul>
      </div>
    )
  },
  {
    category: "Models & Export",
    question: "What 3D model formats are supported?",
    answer: "ShapeShift.AI supports multiple export formats including GLB, FBX, OBJ (with MTL), and USDZ. GLB is recommended for web use, while FBX and OBJ are better for 3D software compatibility."
  },
  {
    category: "Models & Export",
    question: "Can I edit the generated 3D models?",
    answer: "Yes, you can download the models in various formats and edit them in your preferred 3D software. The models come with textures and materials that can be modified. For best editability, we recommend using the FBX or OBJ format."
  },
  {
    category: "Credits & Billing",
    question: "How does the credit system work?",
    answer: (
      <div>
        <p>Each 3D model generation costs credits:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Text-to-3D generation: 5 credits per model</li>
          <li>Image-to-3D generation: 5 credits per model</li>
        </ul>
        <p className="mt-2">New users receive free credits upon signup. You can purchase additional credits or subscribe to a plan for regular credit allowances.</p>
      </div>
    )
  },
  {
    category: "Credits & Billing",
    question: "What subscription plans are available?",
    answer: "We offer several subscription plans: Ninja, Pro, and Pro Max. Each plan includes monthly credits, priority generation, and additional features. You can view detailed plan comparisons on our pricing page. Currently, we only offer credit purchases."
  },
  {
    category: "Technical",
    question: "What are the supported browsers and devices?",
    answer: "ShapeShift.AI works best on modern browsers like Chrome, Firefox, Safari, and Edge. For optimal performance, we recommend using a desktop or laptop computer with a dedicated graphics card."
  },
  {
    category: "Technical",
    question: "How long does it take to generate a 3D model?",
    answer: "Generation time varies depending on the complexity of the prompt or image. Typically, Text-to-3D models take 2-5 minutes, while Image-to-3D conversions take 3-7 minutes. Times may vary during peak usage."
  }
];

// Group FAQs by category
const groupedFaqs = faqs.reduce((acc, faq) => {
  if (!acc[faq.category]) {
    acc[faq.category] = [];
  }
  acc[faq.category].push(faq);
  return acc;
}, {} as Record<string, FAQItem[]>);

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (question: string) => {
    setOpenItems(prev => ({
      ...prev,
      [question]: !prev[question]
    }));
  };

  // Add structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": typeof faq.answer === 'string' ? faq.answer : 'See website for detailed answer.'
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-[var(--background)]">
        <Navbar />
        <div className="faq-container">
          <h1 className="faq-title">Frequently Asked Questions</h1>
          <p className="faq-subtitle">
            Find answers to common questions about ShapeShift.AI's 3D generation capabilities
          </p>

          {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
            <div key={category} className="faq-category">
              <h2 className="category-title">{category}</h2>
              <div className="faq-list">
                {categoryFaqs.map((faq) => (
                  <div key={faq.question} className="faq-item">
                    <button
                      className="faq-question"
                      onClick={() => toggleItem(faq.question)}
                      aria-expanded={openItems[faq.question]}
                    >
                      <span>{faq.question}</span>
                      {openItems[faq.question] ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                    {openItems[faq.question] && (
                      <div className="faq-answer">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
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
    </>
  );
} 