import React, { useState } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'
import ModelViewer from '@/components/ModelViewer'
import { Download, Share2 } from 'lucide-react'
import { CustomLoader } from '@/components/CustomLoader'
import { useNotification } from '@/contexts/NotificationContext'
import { useRouter } from 'next/navigation'
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'

interface ThreeDResultContainerProps {
  modelUrl: string
  loading: boolean
  progress: number
  originalImage: string
  thumbnailUrl?: string
}

export const ThreeDResultContainer = ({
  modelUrl,
  loading,
  progress,
  originalImage,
  thumbnailUrl
}: ThreeDResultContainerProps) => {
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const { showNotification } = useNotification()
  const router = useRouter()

  // Create proxy URLs for different formats
  const getProxyUrl = (url: string) => `/api/proxy?url=${encodeURIComponent(url)}`
  const proxyModelUrl = getProxyUrl(modelUrl)

  const handlePublish = async () => {
    try {
      if (!modelUrl) {
        showNotification('Model not fully generated yet', 'error');
        return;
      }

      const publishData = {
        title: title || 'My 3D Model',
        description: description || 'Generated using ShapeShift.AI',
        originalImage: originalImage,
        thumbnailUrl: thumbnailUrl || originalImage,
        modelUrl: modelUrl,
        tags: ['image-to-3d'],
        type: 'image-to-3d'
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
  
  return (
    <div className="result-container">
      <h2 className="result-title">3D Model Preview</h2>
      <div className="viewer-container">
        {loading ? (
          <div className="loading-container">
            <CustomLoader progress={progress} message="Generating 3D model..." />
          </div>
        ) : modelUrl ? (
          <ModelViewer modelUrl={proxyModelUrl} />
        ) : (
          <p className="empty-state-message">
            No model generated yet. Upload an image and click Generate to create a 3D model.
          </p>
        )}
      </div>

      {modelUrl && !loading && (
        <>
          <div className="download-section">
            <h3 className="download-title">Download Model</h3>
            <div className="download-grid">
              <a 
                href={proxyModelUrl} 
                download="model.glb"
                className="download-button download-button-glb"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={16} />
                GLB
              </a>
              <a 
                href={getProxyUrl(modelUrl.replace('.glb', '.fbx'))}
                download="model.fbx"
                className="download-button download-button-fbx"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={16} />
                FBX
              </a>
              <a 
                href={getProxyUrl(modelUrl.replace('.glb', '.obj'))}
                download="model.obj"
                className="download-button download-button-obj"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={16} />
                OBJ
              </a>
              <a 
                href={getProxyUrl(modelUrl.replace('.glb', '.usdz'))}
                download="model.usdz"
                className="download-button download-button-usdz"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={16} />
                USDZ
              </a>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="publish-button"
              onClick={() => setPublishDialogOpen(true)}
            >
              <Share2 size={20} />
              Publish to Community
            </button>
          </div>
        </>
      )}

      <Dialog 
        open={publishDialogOpen} 
        onClose={() => setPublishDialogOpen(false)}
        PaperProps={{
          className: 'publish-dialog'
        }}
      >
        
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="dialog-input"
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="dialog-input"
          />
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button 
            onClick={() => setPublishDialogOpen(false)}
            className="dialog-button-secondary"
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePublish} 
            variant="contained" 
            className="dialog-button-primary"
          >
            Publish
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}