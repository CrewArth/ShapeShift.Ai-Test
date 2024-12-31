
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCredits } from '@/contexts/CreditsContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { toast } from 'sonner';
import Image from 'next/image';
import { CREDIT_COST_PER_GENERATION } from '@/config/subscriptionPlans';

interface ModelUrls {
  glb: string;
  fbx: string;
  obj: string;
  usdz: string;
  textures?: Array<{
    base_color: string;
    metallic: string;
    normal: string;
    roughness: string;
  }>;
}

export default function ImageTo3D() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [modelUrls, setModelUrls] = useState<ModelUrls | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { credits, updateCredits } = useCredits();
  const [pollCount, setPollCount] = useState(0);
  const maxPolls = 30; // 5 minutes with 10-second intervals

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should be less than 10MB');
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        toast.error('Only JPG and PNG images are supported');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const checkTaskStatus = async (id: string) => {
    if (!id) {
      console.error('[Frontend] No taskId provided for status check');
      return false;
    }

    try {
      console.log('[Frontend] Checking task status:', id);
      const url = new URL('/api/image-to-3d/status', window.location.origin);
      url.searchParams.append('taskId', id);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();
      console.log('[Frontend] Task status response:', data);

      if (!response.ok) {
        console.error('[Frontend] Status check error:', data);
        throw new Error(data.error || 'Failed to check status');
      }

      if (data.status === 'SUCCEEDED') {
        setLoading(false);
        setProgress(100);
        setModelUrls(data.model_urls);
        toast.success('3D model generated successfully!');
        return true;
      } else if (data.status === 'FAILED') {
        setLoading(false);
        setProgress(0);
        toast.error(data.error || 'Failed to generate 3D model');
        return true;
      } else {
        setProgress(data.progress || 0);
        return false;
      }
    } catch (error) {
      console.error('[Frontend] Status check error:', error);
      if (pollCount >= maxPolls - 1) {
        setLoading(false);
        toast.error('Generation timed out. Please try again.');
      }
      return false;
    }
  };

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let isPolling = false;
    let isMounted = true;

    const startPolling = async () => {
      if (!taskId || !loading || isPolling || !isMounted) {
        console.log('[Frontend] Polling conditions not met:', {
          taskId,
          loading,
          isPolling,
          isMounted
        });
        return;
      }

      isPolling = true;
      console.log('[Frontend] Starting polling for taskId:', taskId);

      try {
        // Initial check
        const isDone = await checkTaskStatus(taskId);
        if (isDone || !isMounted) {
          isPolling = false;
          return;
        }

        pollInterval = setInterval(async () => {
          if (!isMounted || !taskId) {
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
            return;
          }

          setPollCount(count => {
            const newCount = count + 1;
            if (newCount >= maxPolls) {
              if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
              }
              setLoading(false);
              isPolling = false;
              toast.error('Generation timed out. Please try again.');
              return count;
            }
            return newCount;
          });

          const isDone = await checkTaskStatus(taskId);
          if ((isDone || !isMounted) && pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
            isPolling = false;
          }
        }, 10000); // Poll every 10 seconds
      } catch (error) {
        console.error('[Frontend] Polling error:', error);
        isPolling = false;
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      }
    };

    startPolling();

    return () => {
      console.log('[Frontend] Cleaning up polling');
      isMounted = false;
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      isPolling = false;
    };
  }, [taskId, loading, pollCount, maxPolls]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    if (credits < CREDIT_COST_PER_GENERATION) {
      toast.error(`Insufficient credits. You need ${CREDIT_COST_PER_GENERATION} credits for this operation.`);
      return;
    }

    setLoading(true);
    setProgress(0);
    setPollCount(0);
    setModelUrls(null);
    setTaskId(null); // Reset taskId before starting new generation
    
    try {
      console.log('[Frontend] Starting image upload:', {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size
      });

      const formData = new FormData();
      formData.append('image', selectedFile, selectedFile.name);

      const response = await fetch('/api/image-to-3d', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();
      console.log('[Frontend] Upload response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process image');
      }

      if (data.remainingCredits !== undefined) {
        updateCredits(data.remainingCredits);
      }

      if (!data.taskId) {
        throw new Error('No taskId received from server');
      }

      setTaskId(data.taskId);
      toast.success('Processing started successfully');
    } catch (error) {
      console.error('[Frontend] Upload error:', error);
      setLoading(false);
      toast.error(error instanceof Error ? error.message : 'Failed to process image');
    }
  };

  const handleDownload = (url: string, format: string) => {
    if (!url) {
      toast.error(`${format} model URL not available`);
      return;
    }
    window.open(url, '_blank');
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Image to 3D Model</h2>
            <div className="text-sm">
              Credits: <span className="font-medium">{credits}</span>
              <span className="text-muted-foreground ml-2">
                (Cost: {CREDIT_COST_PER_GENERATION} credits)
              </span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-4">
              <Input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                {selectedFile ? selectedFile.name : 'Select Image'}
              </Button>
              {preview && (
                <div className="relative w-full h-64">
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                Supported formats: JPG, PNG (max 10MB)
              </div>
              {loading && (
                <div className="w-full">
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-sm text-center mt-1">
                    Processing: {progress}%
                  </div>
                </div>
              )}
              {modelUrls && (
                <div className="w-full space-y-2">
                  <h3 className="font-medium">Download 3D Model:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleDownload(modelUrls.glb, 'GLB')}
                      variant="outline"
                      size="sm"
                      disabled={!modelUrls.glb}
                    >
                      Download GLB
                    </Button>
                    <Button
                      onClick={() => handleDownload(modelUrls.obj, 'OBJ')}
                      variant="outline"
                      size="sm"
                      disabled={!modelUrls.obj}
                    >
                      Download OBJ
                    </Button>
                    <Button
                      onClick={() => handleDownload(modelUrls.fbx, 'FBX')}
                      variant="outline"
                      size="sm"
                      disabled={!modelUrls.fbx}
                    >
                      Download FBX
                    </Button>
                    <Button
                      onClick={() => handleDownload(modelUrls.usdz, 'USDZ')}
                      variant="outline"
                      size="sm"
                      disabled={!modelUrls.usdz}
                    >
                      Download USDZ
                    </Button>
                  </div>
                </div>
              )}
              <Button
                type="submit"
                disabled={!selectedFile || loading || credits < CREDIT_COST_PER_GENERATION}
                className="w-full"
              >
                {loading ? `Processing (${progress}%)` : 'Generate 3D Model'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
