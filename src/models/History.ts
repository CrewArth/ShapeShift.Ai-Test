import { Schema, model, models } from 'mongoose';

// Base schema for common fields between Image-to-3D and Text-to-3D history
const baseHistorySchema = {
  userId: {
    type: String,
    required: true,
    index: true,
  },
  taskId: {
    type: String,
    required: true,
    unique: true,
  },
  thumbnailUrl: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    required: true,
    enum: ['SUCCEEDED', 'FAILED', 'PROCESSING'],
  },
  taskError: {
    message: {
      type: String,
      default: '',
    },
  },
};

// Schema for Image-to-3D history
const ImageTo3DHistorySchema = new Schema({
  ...baseHistorySchema,
  type: {
    type: String,
    default: 'image-to-3d',
  },
});

// Schema for Text-to-3D history
const TextTo3DHistorySchema = new Schema({
  ...baseHistorySchema,
  type: {
    type: String,
    default: 'text-to-3d',
  },
  prompt: {
    type: String,
    required: true,
  },
  negativePrompt: {
    type: String,
    default: '',
  },
  artStyle: {
    type: String,
    default: '',
  },
});

// Create models if they don't exist
export const ImageTo3DHistory = models.ImageTo3DHistory || model('ImageTo3DHistory', ImageTo3DHistorySchema);
export const TextTo3DHistory = models.TextTo3DHistory || model('TextTo3DHistory', TextTo3DHistorySchema); 