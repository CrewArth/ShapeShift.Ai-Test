import React, { useState } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import ModelViewer from '@/components/ModelViewer'
import { Download, Share2 } from 'lucide-react'
import { CustomLoader } from '@/components/CustomLoader'
import { useNotification } from '@/contexts/NotificationContext'
import { useRouter } from 'next/navigation'
import { Button, TextField, Dialog, DialogContent, DialogActions } from '@mui/material'
import { useSession, signIn } from 'next-auth/react'
import './ThreeDResultContainer.css'


interface ThreeDResultContainerProps {
  modelUrl: string | null
  thumbnailUrl?: string | null
  loading: boolean
  progress: number
  prompt: string
}

const ThreeDResultContainer = ({
  modelUrl,
  thumbnailUrl,
  loading,
  progress,
  prompt
}: ThreeDResultContainerProps) => {
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const { showNotification } = useNotification()
  const router = useRouter()
  const { data: session } = useSession()
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async (format: 'glb' | 'obj' | 'fbx' | 'usdz') => {
    try {
      if (!modelUrl) {
        throw new Error('No model URL available');
      }

      // Extract the original URL if it's already proxied
      const originalUrl = modelUrl.startsWith('/api/proxy') ? 
        decodeURIComponent(modelUrl.split('url=')[1]) : 
        modelUrl;

      // Create the URL for the desired format
      const formatUrl = originalUrl.replace('.glb', `.${format}`);
      
      // Create a fresh proxy URL
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(formatUrl)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Failed to download ${format} model: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `model.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification(`${format.toUpperCase()} model downloaded successfully!`, 'success');
    } catch (error) {
      console.error(`Error downloading ${format} model:`, error);
      showNotification(`Failed to download ${format.toUpperCase()} model. Please try again.`, 'error');
    }
  };

  const handlePublish = async () => {
    try {
      if (!modelUrl) {
        showNotification('Model not fully generated yet', 'error');
        return;
      }

      const publishData = {
        title: title || 'My 3D Model',
        description: description || 'Generated using ShapeShift.AI',
        prompt: prompt,
        thumbnailUrl: thumbnailUrl || '',
        modelUrl: modelUrl,
        tags: ['text-to-3d'],
        type: 'text-to-3d'
      };

      console.log('Publishing with data:', publishData);

      const response = await fetch('/api/community/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publishData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish model');
      }

      showNotification('Model published successfully! You can view it in the Community Forum.', 'success');
      setPublishDialogOpen(false);
      router.push('/forum');
    } catch (error) {
      console.error('Error publishing model:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to publish model', 'error');
    }
  };

  const handleModelError = (error: string) => {
    setError(error);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Generating your 3D model...</p>
        {progress > 0 && (
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
            <span className="progress-text">{progress}%</span>
          </div>
        )}
      </div>
    );
  }

  if (!modelUrl) {
    return (
      <div className="empty-state">
        <p>Enter a prompt and click Generate to create a 3D model</p>
      </div>
    );
  }

  return (
    <div className="result-viewer">
      {error ? (
        <div className="error-message">
          {error}
        </div>
      ) : (
        <ModelViewer
          modelUrl={modelUrl}
          onError={handleModelError}
        />
      )}
      <div className="result-info">
        <h3>Generated Model</h3>
        <p className="prompt-text">{prompt}</p>
        {thumbnailUrl && (
          <div className="thumbnail">
            <img src={thumbnailUrl} alt="Model thumbnail" />
          </div>
        )}
        <button 
          className={`download-button ${!session ? 'disabled' : ''}`}
          onClick={() => session ? window.open(modelUrl, '_blank') : signIn()}
          disabled={!session}
        >
          {session ? 'Download Model' : 'Sign in to Download'}
        </button>
      </div>
    </div>
  )
}

export default ThreeDResultContainer; 