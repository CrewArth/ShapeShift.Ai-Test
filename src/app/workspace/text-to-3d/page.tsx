'use client'

import React, { useState, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import AuthCheck from '@/components/auth-check'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Info, CheckCircle2, Loader2 } from 'lucide-react'
import './text-to-3d.css'
import ModelViewer from '@/components/ModelViewer'
import { useNotification } from '@/contexts/NotificationContext'
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { useRouter } from 'next/navigation'
import { CustomLoader } from '@/components/CustomLoader'

const ART_STYLES = [
  'realistic',
  'sculpture'
]

const EXAMPLE_PROMPTS = [
  'Realistic symmetrical Donald Trump, Doing T-Pose, arms out to sides.',
  'majestic egyptian sphinx made of marble, color-full metal painted details, ultra-realistic, all the textures are well lit and bright, highest quality, highest resolution, deep carved details.',
  'A powerful dwarf druid stands in a mystical pose, exuding strength and wisdom. He is a stocky and muscular man, with a thick brown beard and messy hair, with a headband of thorns. Clad in leather armor, he embodies a druidic aesthetic. He wields a gnarled staff entwined with vines, surmounted by a glowing green sphere and a shield of willow wood. Bags and amulets adorn his belt, emphasizing his druidic and nomadic nature. Altamente Detallado, World of Warcraft',
  'Gingerbread Tesla Cyber Truck, realism, decorated with icing and gum drop candy, boxy design, high resolution.',
  'A high detailed, photorealistic Jaguar Cat laying, relaxing on a snowy rock gazing into the distance. His face and ears is symmetrical. Sharp eye textures and photorealistic 3d model. sharp calved texture. No whiskers. Sharp detailed paws. Ensure 5K realism, intricate, sharp textures, symmetrical details, even balanced lighting, and a neutral background. Emphasize snow, and sharpen textures for ultra-precise mesh generation'
];

export default function TextTo3D() {
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTexturing, setIsTexturing] = useState(false)
  const [error, setError] = useState('')
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [modelUrls, setModelUrls] = useState<{
    glb?: string;
    fbx?: string;
    usdz?: string;
    obj?: string;
    mtl?: string;
  }>({})
  const [progress, setProgress] = useState(0)
  const [taskId, setTaskId] = useState<string | null>(null)
  const { showNotification } = useNotification()
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const router = useRouter()
  const [mode, setMode] = useState<'preview' | 'refine'>('preview')
  const [artStyle, setArtStyle] = useState<string>('realistic')
  const [publishError, setPublishError] = useState<string>('');

  const pollTaskStatus = async (taskId: string) => {
    let retryCount = 0;
    const maxRetries = 5;
    const maxPollingTime = 10 * 60 * 1000;
    const startTime = Date.now();
    const baseDelay = 5000;

    while (true) {
      try {
        // Check if we've exceeded the maximum polling time
        if (Date.now() - startTime > maxPollingTime) {
          throw new Error('Generation timed out after 10 minutes. Please try again.');
        }

        console.log(`[Frontend] Polling attempt ${retryCount + 1} for task ${taskId}`);

        const response = await fetch('/api/text-to-3d', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskId })
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('[Frontend] Poll request failed:', {
            status: response.status,
            data,
            timestamp: new Date().toISOString()
          });
          
          // Immediately stop polling and show error for insufficient credits
          if (data.creditsNeeded) {
            setError(`Insufficient credits. You need ${data.creditsNeeded} credits to generate a 3D model. Current balance: ${data.currentCredits} credits. Please top up your credits to continue.`);
            setLoading(false);
            showNotification('Insufficient credits. Please top up your balance.', 'error');
            return; // Stop polling immediately
          }
          
          // Handle specific error cases
          if (response.status === 404) {
            throw new Error('Task not found or expired. Please try generating again.');
          } else if (response.status === 400) {
            throw new Error(data.error || data.message || 'Invalid task request');
          } else if (response.status === 429) {
            throw new Error('Too many requests. Please wait a moment and try again.');
          }
          
          throw new Error(data.error || data.message || 'Failed to check task status');
        }

        console.log('[Frontend] Poll response:', {
          status: data.status,
          progress: data.progress,
          timestamp: new Date().toISOString()
        });

        setProgress(data.progress || 0);

        if (data.status === 'FAILED') {
          throw new Error(data.message || 'Failed to generate 3D model. Please try again.');
        }

        if (data.status === 'SUCCEEDED') {
          console.log('[Frontend] Preview generation succeeded, starting refinement');
          await startRefineStage(taskId);
          break;
        } else if (data.status === 'IN_PROGRESS' || data.status === 'PENDING') {
          // Reset retry count on successful response
          retryCount = 0;
          
          // Calculate delay with exponential backoff, but cap it at 15 seconds
          const delay = Math.min(baseDelay * Math.pow(1.5, retryCount), 15000);
          console.log(`[Frontend] Waiting ${delay}ms before next poll`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
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
        console.log(`[Frontend] Retrying in ${retryDelay}ms (attempt ${retryCount} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  };

  const startRefineStage = async (previewTaskId: string) => {
    try {
      console.log('[Frontend] Starting refinement stage for task:', previewTaskId);
      setProgress(0);
      setIsTexturing(true);
      showNotification('Starting refinement stage...', 'success');

      // Check credits before refinement
      const balanceResponse = await fetch('/api/credits/balance');
      const balanceData = await balanceResponse.json();
      
      if (!balanceResponse.ok) {
        throw new Error('Failed to check credit balance');
      }

      console.log('[Frontend] Sending refinement request with task ID:', previewTaskId);
      const response = await fetch('/api/text-to-3d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'refine',
          preview_task_id: previewTaskId,
          enable_pbr: false
        })
      });

      const data = await response.json();
      console.log('[Frontend] Refinement response:', {
        status: response.status,
        data,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        if (data.creditsNeeded) {
          throw new Error(`Insufficient credits for refinement. You need ${data.creditsNeeded} credits. Current balance: ${data.currentCredits} credits.`);
        }
        throw new Error(data.error || 'Failed to start refinement');
      }

      // Update credits after successful refinement start
      await fetchUpdatedBalance();
      
      pollRefineStatus(data.taskId);
    } catch (error) {
      console.error('[Frontend] Error starting refinement:', {
        error,
        timestamp: new Date().toISOString()
      });
      setError(error instanceof Error ? error.message : 'Failed to start refinement');
      setLoading(false);
      setIsTexturing(false);
      showNotification(error instanceof Error ? error.message : 'Failed to start refinement', 'error');
    }
  };

  const pollRefineStatus = async (taskId: string) => {
    let retryCount = 0;
    const maxRetries = 5;
    const maxPollingTime = 10 * 60 * 1000; // 10 minutes
    const startTime = Date.now();
    const baseDelay = 5000; // 5 seconds base delay

    while (true) {
      try {
        // Check if we've exceeded the maximum polling time
        if (Date.now() - startTime > maxPollingTime) {
          throw new Error('Refinement timed out after 10 minutes. Please try again.');
        }

        console.log(`[Frontend] Polling refine attempt ${retryCount + 1} for task ${taskId}`);

        const response = await fetch('/api/text-to-3d', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ taskId })
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('[Frontend] Refine poll request failed:', {
            status: response.status,
            data,
            timestamp: new Date().toISOString()
          });
          
          // Handle specific error cases
          if (response.status === 404) {
            throw new Error('Refinement task not found or expired. Please try again.');
          } else if (response.status === 400) {
            throw new Error(data.error || data.message || 'Invalid refinement request');
          } else if (response.status === 429) {
            throw new Error('Too many requests. Please wait a moment and try again.');
          }
          
          throw new Error(data.error || data.message || 'Failed to check refinement status');
        }

        console.log('[Frontend] Refine poll response:', {
          status: data.status,
          progress: data.progress,
          timestamp: new Date().toISOString()
        });

        setProgress(data.progress || 0);

        if (data.status === 'SUCCEEDED' && data.model_urls?.glb) {
          setModelUrls(data.model_urls);
          
          // Set the model URL directly without double proxying
          setModelUrl(data.model_urls.glb);
          
          if (data.thumbnail_url) {
            setThumbnailUrl(data.thumbnail_url);
          }

          // Update history with the successful generation
          try {
            console.log('[Frontend] Updating history with model data:', {
              taskId,
              modelUrl: data.model_urls.glb,
              thumbnailUrl: data.thumbnail_url
            });

            const historyResponse = await fetch('/api/history', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'text-to-3d',
                taskId: taskId,
                thumbnailUrl: data.thumbnail_url,
                prompt: prompt,
                negativePrompt: negativePrompt,
                artStyle: artStyle,
                status: 'SUCCEEDED',
                modelUrls: data.model_urls,
                error: null
              })
            });

            if (!historyResponse.ok) {
              console.error('[Frontend] Failed to update history:', await historyResponse.text());
            } else {
              console.log('[Frontend] History updated successfully');
            }
          } catch (error) {
            console.error('[Frontend] Error updating history:', error);
          }
          
          setLoading(false);
          setIsTexturing(false);
          showNotification('3D model completed successfully!', 'success');
          // Fetch updated balance after successful generation
          await fetchUpdatedBalance();
          break;
        }

        if (data.status === 'FAILED') {
          // Update history with failed status
          try {
            console.log('[Frontend] Updating history with failed status:', {
              taskId,
              error: data.message
            });

            const historyResponse = await fetch('/api/history', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                type: 'text-to-3d',
                taskId: taskId,
                thumbnailUrl: null,
                prompt: prompt,
                negativePrompt: negativePrompt,
                artStyle: artStyle,
                status: 'FAILED',
                modelUrls: null,
                error: data.message || 'Refinement failed'
              })
            });

            if (!historyResponse.ok) {
              console.error('[Frontend] Failed to update history:', await historyResponse.text());
            } else {
              console.log('[Frontend] History updated successfully with failed status');
            }
          } catch (error) {
            console.error('[Frontend] Error updating history for failed status:', error);
          }

          throw new Error(data.message || 'Refinement failed. Please try again.');
        }

        if (data.status === 'IN_PROGRESS' || data.status === 'PENDING') {
          // Reset retry count on successful response
          retryCount = 0;
          
          // Calculate delay with exponential backoff, but cap it at 15 seconds
          const delay = Math.min(baseDelay * Math.pow(1.5, retryCount), 15000);
          console.log(`[Frontend] Waiting ${delay}ms before next refine poll`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error: any) {
        console.error('[Frontend] Refine polling error:', {
          error: error.message,
          retryCount,
          maxRetries,
          taskId,
          timestamp: new Date().toISOString()
        });
        
        retryCount++;

        if (retryCount >= maxRetries) {
          setError('Refinement process encountered an error. Please try again.');
          setLoading(false);
          setIsTexturing(false);
          showNotification('Failed to complete refinement. Please try again.', 'error');
          break;
        }

        // Exponential backoff for retries
        const retryDelay = Math.min(baseDelay * Math.pow(2, retryCount), 15000);
        console.log(`[Frontend] Retrying refine in ${retryDelay}ms (attempt ${retryCount} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showNotification('Please enter a prompt', 'error')
      return
    }

    setLoading(true)
    setError('')
    setModelUrl(null)
    setProgress(0)

    try {
      // First, check credits before starting generation
      const balanceResponse = await fetch('/api/credits/balance');
      const balanceData = await balanceResponse.json();
      
      if (!balanceResponse.ok) {
        throw new Error('Failed to check credit balance');
      }

      const response = await fetch('/api/text-to-3d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: negativePrompt,
          art_style: artStyle,
          mode: 'preview'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.creditsNeeded) {
          throw new Error(`Insufficient credits. You need ${data.creditsNeeded} credits to generate a 3D model. Current balance: ${data.currentCredits} credits.`);
        }
        throw new Error(data.error || data.message || 'Failed to start generation')
      }

      // Update credits immediately after successful task creation
      await fetchUpdatedBalance();

      // Create initial history entry
      try {
        console.log('[Frontend] Creating initial history entry for task:', data.taskId);
        const historyResponse = await fetch('/api/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'text-to-3d',
            taskId: data.taskId,
            thumbnailUrl: null,
            prompt: prompt,
            negativePrompt: negativePrompt,
            artStyle: artStyle,
            status: 'PENDING',
            modelUrls: null,
            error: null
          })
        });

        if (!historyResponse.ok) {
          console.error('[Frontend] Failed to create initial history entry:', await historyResponse.text());
        } else {
          console.log('[Frontend] Initial history entry created successfully');
        }
      } catch (error) {
        console.error('[Frontend] Error creating initial history entry:', error);
      }
      
      setTaskId(data.taskId)
      pollTaskStatus(data.taskId)
    } catch (error) {
      console.error('Error starting generation:', error)
      setError(error instanceof Error ? error.message : 'Failed to start generation')
      setLoading(false)
      showNotification(error instanceof Error ? error.message : 'Failed to start generation', 'error')
    }
  }

  const handlePublish = async () => {
    try {
      setPublishError('');

      if (!title.trim()) {
        setPublishError('Title is required');
        showNotification('Please provide a title for your model', 'error');
        return;
      }

      if (!modelUrls?.glb) {
        showNotification('Model not fully generated yet', 'error');
        return;
      }

      if (!thumbnailUrl) {
        showNotification('Thumbnail not generated yet', 'error');
        return;
      }

      const publishData = {
        title: title.trim(),
        description: description || prompt,
        originalImage: thumbnailUrl,
        thumbnailUrl: thumbnailUrl,
        modelUrl: modelUrls.glb,
        tags: ['text-to-3d'],
        type: 'text-to-3d',
        prompt: prompt.trim()
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

  const handleDownload = async (format: 'glb' | 'fbx' | 'usdz' | 'obj' | 'mtl') => {
    if (!modelUrls?.[format]) {
      showNotification(`${format.toUpperCase()} model not available`, 'error');
      return;
    }

    try {
      const modelUrlForFormat = modelUrls[format];
      const response = await fetch(`/api/download-model?url=${encodeURIComponent(modelUrlForFormat)}&format=${format}`);
      
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `model.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      showNotification(`${format.toUpperCase()} model downloaded successfully`, 'success');
    } catch (error) {
      console.error(`Error downloading ${format} model:`, error);
      showNotification(`Failed to download ${format.toUpperCase()} model`, 'error');
    }
  };

  const getLoadingMessage = () => {
    if (isTexturing) {
      return `Applying textures... ${progress}%`
    }
    return `Generating 3D model... ${progress}%`
  }

  const handleModeChange = (newMode: 'preview' | 'refine') => {
    setMode(newMode);
  };

  const handleArtStyleChange = (newStyle: string) => {
    setArtStyle(newStyle);
  };

  const fetchUpdatedBalance = async () => {
    try {
      const response = await fetch('/api/credits/balance');
      if (response.ok) {
        const data = await response.json();
        // Update credits in the UI
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('credits-updated', { detail: data.credits }));
        }
        // Also update local storage if you're using it
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('userCredits', data.credits.toString());
        }
      } else {
        console.error('Failed to fetch credits balance:', await response.text());
      }
    } catch (error) {
      console.error('Failed to fetch updated balance:', error);
    }
  }

  const handleExampleClick = () => {
    const randomIndex = Math.floor(Math.random() * EXAMPLE_PROMPTS.length);
    setPrompt(EXAMPLE_PROMPTS[randomIndex]);
  };

  return (
    <>
      <AuthCheck />
      <div className="workspace-container">
        <Navbar />
        <main className="text-to-3d-container">
          <div className="top-section">
            <div className="left-section">
              <div className="input-container">
                <h1 className="container-header">Text to 3D Model</h1>
                <div className="prompt-section">
                  <div className="prompt-input-container">
                    <div className="prompt-header">
                      <span className="example-link" onClick={handleExampleClick}>
                        Example
                      </span>
                    </div>
                    <textarea
                      className="prompt-input"
                      placeholder="Enter your prompt here... (e.g., 'A cute robot toy with friendly features')"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <textarea
                    className="negative-prompt-input"
                    placeholder="Enter negative prompt here... (what you don't want to see in the model)"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="style-section">
                  <h3>Art Style</h3>
                  <div className="style-options">
                    {ART_STYLES.map((style) => (
                      <button
                        key={style}
                        className={`style-button ${artStyle === style ? 'active' : ''}`}
                        onClick={() => setArtStyle(style)}
                        disabled={loading}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  className="generate-button"
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'Generate 3D Model'
                  )}
                </button>
              </div>

              <div className="tips-card">
                <div className="tips-header">
                  <div className="tips-icon-wrapper">
                    <Info className="tips-main-icon" />
                  </div>
                  <div className="tips-header-content">
                    <h3 className="tips-title">Tips for Best Results</h3>
                    <p className="tips-subtitle">Follow these guidelines for optimal 3D model generation</p>
                  </div>
                </div>
                <div className="tips-grid">
                  <div className="tip-card">
                    <div className="tip-icon-wrapper">
                      <CheckCircle2 className="tip-icon" />
                    </div>
                    <div className="tip-content">
                      <h4 className="tip-title">Be Specific</h4>
                      <p className="tip-description">
                        Include details about shape, material, and style in your prompt
                      </p>
                    </div>
                  </div>
                  <div className="tip-card">
                    <div className="tip-icon-wrapper">
                      <CheckCircle2 className="tip-icon" />
                    </div>
                    <div className="tip-content">
                      <h4 className="tip-title">Use Negatives</h4>
                      <p className="tip-description">
                        Add negative prompts to avoid unwanted features in your model
                      </p>
                    </div>
                  </div>
                  <div className="tip-card">
                    <div className="tip-icon-wrapper">
                      <CheckCircle2 className="tip-icon" />
                    </div>
                    <div className="tip-content">
                      <h4 className="tip-title">Stay Focused</h4>
                      <p className="tip-description">
                        Keep your prompt focused on a single object for best results
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="result-container">
              <h1 className="container-header">3D Preview</h1>
              {error && (
                <div className="error-message">
                  <Info className="mr-2" />
                  {error}
                </div>
              )}

              {loading && (
                <div className="progress-section">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="status-text">
                    {isTexturing
                      ? 'Adding textures and materials...'
                      : 'Generating 3D model...'}
                    {progress}%
                  </p>
                </div>
              )}

              {modelUrl && (
                <div className="model-viewer-container">
                  <ModelViewer modelUrl={modelUrl} onError={(error) => setError(error)} />
                </div>
              )}

              {modelUrl && !loading && (
                <div className="action-buttons">
                  <button
                    className="publish-button"
                    onClick={() => setPublishDialogOpen(true)}
                  >
                    <CheckCircle2 className="mr-2" />
                    Publish Model
                  </button>
                  <div className="download-buttons">
                    {modelUrls?.glb && (
                      <button
                        className="download-button glb"
                        onClick={() => handleDownload('glb')}
                      >
                        Download GLB
                      </button>
                    )}
                    {modelUrls?.fbx && (
                      <button
                        className="download-button fbx"
                        onClick={() => handleDownload('fbx')}
                      >
                        Download FBX
                      </button>
                    )}
                    {modelUrls?.obj && (
                      <button
                        className="download-button obj"
                        onClick={() => handleDownload('obj')}
                      >
                        Download OBJ
                      </button>
                    )}
                    {modelUrls?.mtl && (
                      <button
                        className="download-button mtl"
                        onClick={() => handleDownload('mtl')}
                      >
                        Download MTL
                      </button>
                    )}
                    {modelUrls?.usdz && (
                      <button
                        className="download-button usdz"
                        onClick={() => handleDownload('usdz')}
                      >
                        Download USDZ
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Dialog
        open={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
      >
        <DialogTitle>Publish Your 3D Model</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!publishError}
            helperText={publishError}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePublish} variant="contained" color="primary">
            Publish
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
} 