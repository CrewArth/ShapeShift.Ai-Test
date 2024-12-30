import { Schema, model, models, Document } from 'mongoose';

export interface Transaction {
  _id?: string;
  type: 'subscription' | 'topup' | 'usage';
  amount?: number;
  credits?: number;
  razorpayPaymentId?: string;
  modelType?: 'text-to-3d' | 'image-to-3d';
  prompt?: string;
  imageUrl?: string;
  modelUrl?: string;
  timestamp: Date;
  status: 'success' | 'failed' | 'pending';
}

export interface UserCredits extends Document {
  userId: string;
  credits: number;
  subscription: {
    type: 'none' | 'ninja' | 'pro' | 'promax';
    razorpaySubscriptionId?: string;
    startDate?: Date;
    endDate?: Date;
    status: 'active' | 'cancelled' | 'expired';
  };
  transactions: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}

const UserCreditsSchema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  credits: {
    type: Number,
    default: 25, // Default free credits for new users
  },
  subscription: {
    type: {
      type: String,
      enum: ['none', 'ninja', 'pro', 'promax'],
      default: 'none',
    },
    razorpaySubscriptionId: String,
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired'],
      default: 'active',
    },
  },
  transactions: [{
    type: {
      type: String,
      enum: ['subscription', 'topup', 'usage'],
      required: true,
    },
    amount: Number,
    credits: Number,
    razorpayPaymentId: String,
    modelType: {
      type: String,
      enum: ['text-to-3d', 'image-to-3d'],
    },
    prompt: String,
    imageUrl: String,
    modelUrl: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'pending',
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add index for faster queries
UserCreditsSchema.index({ userId: 1 });

// Update the updatedAt timestamp before saving
UserCreditsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const UserCreditsModel = models.UserCredits || model<UserCredits>('UserCredits', UserCreditsSchema);
export default UserCreditsModel; 