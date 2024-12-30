import { Schema, model, models } from 'mongoose';

const CommunityModelSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  originalImage: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    required: true,
  },
  modelUrl: {
    type: String,
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
  tags: [{
    type: String,
  }],
  prompt: {
    type: String,
  },
  type: {
    type: String,
    enum: ['text-to-3d', 'image-to-3d'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Add text index for search
CommunityModelSchema.index({ title: 'text', description: 'text', tags: 'text' });

export default models.CommunityModel || model('CommunityModel', CommunityModelSchema); 