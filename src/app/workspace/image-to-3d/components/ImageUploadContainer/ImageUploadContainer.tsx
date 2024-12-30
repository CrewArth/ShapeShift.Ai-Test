import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Info, CheckCircle2 } from 'lucide-react'

interface ImageUploadContainerProps {
  preview: string
  loading: boolean
  progress: number
  error: string
  onDrop: (acceptedFiles: File[]) => void
  onGenerate: () => void
}

export const ImageUploadContainer = ({
  preview,
  loading,
  progress,
  error,
  onDrop,
  onGenerate
}: ImageUploadContainerProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    multiple: false
  })

  return (
    <div className="upload-container">
      <h2 className="upload-title">Upload Image</h2>
      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        {preview ? (
          <div className="preview-container">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="preview-image"
            />
          </div>
        ) : (
          <div className="dropzone-content">
            <div className="dropzone-icon">📸</div>
            {isDragActive ? (
              <p className="dropzone-text">Drop your image here...</p>
            ) : (
              <p className="dropzone-text">
                Drag & drop an image here, or <strong>click to select</strong>
              </p>
            )}
          </div>
        )}
      </div>

      {preview && (
        <div className="generate-button-container">
          <button
            className="generate-button"
            onClick={onGenerate}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <span>Generating... {progress}%</span>
              </div>
            ) : (
              'Generate 3D Model'
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="tips-container">
        <h3 className="tips-title">
          <Info size={20} className="tip-icon" />
          Tips for Best Results
        </h3>
        <div className="tips-list">
          <div className="tip-item">
            <CheckCircle2 size={16} className="tip-icon" />
            <span>Use PNG or JPG format images for optimal results</span>
          </div>
          <div className="tip-item">
            <CheckCircle2 size={16} className="tip-icon" />
            <span>Upload high-quality images with clear details</span>
          </div>
          <div className="tip-item">
            <CheckCircle2 size={16} className="tip-icon" />
            <span>Ensure the image is focused on a single object</span>
          </div>
        </div>
      </div>
    </div>
  )
} 