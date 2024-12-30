'use client';

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Navbar from '@/components/Navbar';
import ThreeDResultContainer from './components/ThreeDResultContainer';
import './text-to-3d.css';

export const dynamic = 'force-dynamic';

export default function TextTo3D() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const session = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.data) {
      signIn();
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      const response = await fetch('/api/text-to-3d/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate 3D model');
      }

      const data = await response.json();
      setModelUrl(data.modelUrl);
      setThumbnailUrl(data.thumbnailUrl);
    } catch (err) {
      console.error('Error generating 3D model:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate 3D model');
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = (newProgress: number) => {
    setProgress(newProgress);
  };

  return (
    <div className="text-to-3d-container">
      <Navbar />
      <div className="content-container">
        <div className="input-container">
          <h1 className="title">Text to 3D</h1>
          <p className="description">
            Enter a text prompt to generate a 3D model
          </p>
          <form onSubmit={handleSubmit} className="prompt-form">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              className="prompt-input"
              rows={4}
            />
            <button 
              type="submit" 
              className={`generate-button ${loading ? 'loading' : ''}`}
              disabled={loading || !session?.data}
            >
              {loading ? 'Generating...' : session?.data ? 'Generate 3D Model' : 'Sign in to Generate'}
            </button>
          </form>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
        <div className="result-container">
          {!session?.data ? (
            <div className="auth-required-message">
              <p>Please sign in to generate 3D models</p>
              <button 
                className="sign-in-button"
                onClick={() => signIn()}
              >
                Sign In
              </button>
            </div>
          ) : (
            <ThreeDResultContainer
              modelUrl={modelUrl}
              thumbnailUrl={thumbnailUrl}
              loading={loading}
              progress={progress}
              prompt={prompt}
            />
          )}
        </div>
      </div>
    </div>
  );
} 