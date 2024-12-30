import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<mongoose.Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then(m => m.connection);
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}

interface MongoCollection {
  name: string;
}

export async function initializeModelsCollection() {
  const connection = await connectToDatabase();
  if (!connection) throw new Error('Failed to connect to database');
  if (!connection.db) throw new Error('Database not found');
  
  // Check if the collection exists
  const collections = await connection.db.listCollections().toArray();
  const collectionExists = collections.some((col: MongoCollection) => col.name === 'models');
  
  if (!collectionExists) {
    await connection.db.createCollection('models');
    
    // Create indexes
    await connection.db.collection('models').createIndexes([
      { key: { userId: 1 } },
      { key: { isPublic: 1 } },
      { key: { createdAt: -1 } },
      { key: { prompt: 'text', title: 'text' } }
    ]);
  }
}