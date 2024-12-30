import mongoose from 'mongoose';

const modelSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  prompt: {
    type: String,
    required: true,
  },
  modelUrl: {
    type: String,
    required: true,
  },
  meshyTaskId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  format: {
    type: String,
    default: 'glb'
  },
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'private'
  },
  title: {
    type: String,
    default: function(this: any) {
      return `Model ${new Date().toLocaleDateString()}`;
    }
  },
  description: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  thumbnail: {
    type: String,
    default: null
  },
  stats: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    }
  },
  likedBy: [{
    type: String, // Clerk user IDs
    ref: 'User'
  }],
  comments: [{
    userId: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
modelSchema.index({ userId: 1, privacy: 1, createdAt: -1 });
modelSchema.index({ privacy: 1, createdAt: -1 }); // For public feed
modelSchema.index({ tags: 1, privacy: 1 }); // For tag search

// Method to get public model data
modelSchema.methods.getPublicData = function() {
  if (this.privacy === 'private') {
    return null;
  }
  
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    modelUrl: this.modelUrl,
    thumbnail: this.thumbnail,
    tags: this.tags,
    stats: this.stats,
    userId: this.userId,
    createdAt: this.createdAt,
    format: this.format
  };
};

const Model = mongoose.models.Model || mongoose.model('Model', modelSchema);

export default Model; 