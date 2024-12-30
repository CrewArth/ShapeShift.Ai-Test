import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected) {
    return mongoose;
  }

  try {
    mongoose.connection.setMaxListeners(15); // Increase max listeners
    await mongoose.connect(MONGODB_URI!, {
      bufferCommands: true,
    });
    isConnected = true;
    console.log('[MongoDB] Connected successfully');
    return mongoose;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    isConnected = false;
    throw error;
  }
} 