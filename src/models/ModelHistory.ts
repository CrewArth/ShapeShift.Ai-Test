import mongoose from 'mongoose';

const modelHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  prompt: {
    type: String,
    required: true
  },
  modelUrl: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text-to-3d', 'image-to-3d'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for faster queries
modelHistorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.ModelHistory || mongoose.model('ModelHistory', modelHistorySchema); 