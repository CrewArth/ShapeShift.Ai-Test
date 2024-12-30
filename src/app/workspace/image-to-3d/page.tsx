'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { useNotification } from '@/contexts/NotificationContext'
import { ImageUploadContainer } from './components/ImageUploadContainer/ImageUploadContainer'
import { ThreeDResultContainer } from './components/ThreeDResultContainer/ThreeDResultContainer'
import { Info, CheckCircle2 } from 'lucide-react'
import './image-to-3d.css'
import { useAuth } from '@clerk/nextjs';
import AuthCheck from '@/components/auth-check';

export default function ImageTo3D() {
  const router = useRouter()
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [taskId, setTaskId] = useState<string>('')
  const [modelUrl, setModelUrl] = useState<string>('')
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string>('')
  const { showNotification } = useNotification()
  const { getToken } = useAuth();
  const [publishError, setPublishError] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [publishDialogOpen, setPublishDialogOpen] = useState<boolean>(false);

  // Function to poll task status
  const pollTaskStatus = useCallback(async (taskId: string) => {
    console.log('[Frontend] Starting to poll task:', {
      taskId,
      timestamp: new Date().toISOString()
    });
    
    let retryCount = 0;
    const maxRetries = 5;
    const maxPollingTime = 10 * 60 * 1000; // 10 minutes
    const startTime = Date.now();
    const baseDelay = 5000;

    while (true) {
      try {
        // Check if we've exceeded the maximum polling time
        if (Date.now() - startTime > maxPollingTime) {
          throw new Error('Generation timed out after 10 minutes. Please try again.');
        }

        console.log(`[Frontend] Polling attempt ${retryCount + 1} for task ${taskId}`, {
          timestamp: new Date().toISOString()
        });
        
        const formData = new FormData();
        formData.append('taskId', taskId);

        const response = await fetch('/api/image-to-3d', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          console.error('[Frontend] Poll request failed:', {
            status: response.status,
            statusText: response.statusText,
            timestamp: new Date().toISOString()
          });

          const errorData = await response.json();
          console.error('[Frontend] Error response:', errorData);

          // Handle specific error cases
          if (response.status === 404) {
            throw new Error('Task not found or expired. Please try generating again.');
          } else if (response.status === 400) {
            throw new Error(errorData.error || errorData.message || 'Invalid task request');
          } else if (response.status === 429) {
            throw new Error('Too many requests. Please wait a moment and try again.');
          }
          
          throw new Error(errorData.error || errorData.message || 'Failed to check task status');
        }

        const data = await response.json();
        console.log('[Frontend] Poll response:', {
          status: data.status,
          progress: data.progress,
          modelUrls: data.model_urls,
          thumbnailUrl: data.thumbnail_url,
          timestamp: new Date().toISOString()
        });

        // Update progress
        setProgress(data.progress || 0);

        if (data.status === 'SUCCEEDED') {
          console.log('[Frontend] Task completed successfully:', {
            modelUrls: data.model_urls,
            thumbnailUrl: data.thumbnail_url,
            timestamp: new Date().toISOString()
          });
          
          setModelUrl(data.model_urls.glb);
          setThumbnailUrl(data.thumbnail_url);
          setProgress(100);
          setLoading(false);
          showNotification('3D model generated successfully!', 'success');
          break;
        }

        if (data.status === 'FAILED') {
          console.error('[Frontend] Task failed:', {
            error: data.error,
            message: data.message,
            timestamp: new Date().toISOString()
          });
          throw new Error(data.message || data.error || 'Failed to generate 3D model. Please try again.');
        }

        // Reset retry count on successful response
        retryCount = 0;

        // Calculate delay with exponential backoff, but cap it at 15 seconds
        const delay = Math.min(baseDelay * Math.pow(1.5, retryCount), 15000);
        console.log(`[Frontend] Waiting ${delay}ms before next poll`, {
          timestamp: new Date().toISOString()
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error: any) {
        console.error('[Frontend] Polling error:', {
          error: error.message,
          retryCount,
          maxRetries,
          taskId,
          timestamp: new Date().toISOString()
        });
        
        retryCount++;

        if (retryCount >= maxRetries) {
          setError('Generation process encountered an error. Please try again.');
          setLoading(false);
          showNotification('Failed to complete generation. Please try again.', 'error');
          break;
        }

        // Exponential backoff for retries
        const retryDelay = Math.min(baseDelay * Math.pow(2, retryCount), 15000);
        console.log(`[Frontend] Retrying in ${retryDelay}ms (attempt ${retryCount} of ${maxRetries})`, {
          timestamp: new Date().toISOString()
        });
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }, [showNotification]);

  const handleGenerate = async () => {
    if (!image) return;

    setLoading(true);
    setError('');
    setModelUrl('');
    setProgress(0);

    try {
      console.log('[Frontend] Starting generation:', {
        imageType: image.type,
        imageSize: image.size,
        timestamp: new Date().toISOString()
      });

      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch('/api/image-to-3d', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        console.error('[Frontend] Generation error:', {
          status: response.status,
          statusText: response.statusText,
          timestamp: new Date().toISOString()
        });

        const errorData = await response.json();
        console.error('[Frontend] Error response:', errorData);

        // Handle specific error cases
        if (errorData.creditsNeeded) {
          throw new Error(`Insufficient credits. Required: ${errorData.creditsNeeded}, Current: ${errorData.currentCredits}`);
        }

        throw new Error(errorData.error || errorData.message || 'Failed to start generation');
      }

      const data = await response.json();
      console.log('[Frontend] Generation started:', {
        taskId: data.taskId,
        status: data.status,
        timestamp: new Date().toISOString()
      });

      if (!data.taskId) {
        throw new Error('No task ID received from server');
      }

      setTaskId(data.taskId);
      setThumbnailUrl(data.thumbnail_url);
      
      // Start polling
      pollTaskStatus(data.taskId);
    } catch (error: any) {
      console.error('[Frontend] Generation error:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      setError(error.message || 'Failed to start generation');
      setLoading(false);
      showNotification(error.message || 'Failed to start generation', 'error');
    }
  };

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImage(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      setModelUrl('');
      setError('');
    }
  }, []);

  const handlePublish = async () => {
    try {
      setPublishError('');

      if (!title.trim()) {
        setPublishError('Title is required');
        showNotification('Please provide a title for your model', 'error');
        return;
      }

      if (!modelUrl) {
        showNotification('Model not fully generated yet', 'error');
        return;
      }

      if (!thumbnailUrl) {
        showNotification('Thumbnail not generated yet', 'error');
        return;
      }

      const publishData = {
        title: title.trim(),
        description: description || 'No description provided',
        modelUrl,
        thumbnailUrl,
        type: 'image-to-3d'
      };

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

  const fetchUpdatedBalance = async () => {
    try {
      const response = await fetch('/api/credits/balance');
      if (response.ok) {
        const data = await response.json();
        window.dispatchEvent(new CustomEvent('credits-updated', { detail: data.credits }));
      }
    } catch (error) {
      console.error('Failed to fetch updated balance:', error);
    }
  };

  return (
    <>
      <AuthCheck />
      <div className="workspace-container">
        <Navbar />
        <main className="workspace-main">
          <div className="workspace-content">
            <div className="workspace-grid">
              <ImageUploadContainer
                preview={preview}
                loading={loading}
                progress={progress}
                error={error}
                onDrop={handleDrop}
                onGenerate={handleGenerate}
              />
              <ThreeDResultContainer
                modelUrl={modelUrl || ''}
                loading={loading}
                progress={progress}
                originalImage={preview}
                thumbnailUrl={thumbnailUrl}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  )
} 