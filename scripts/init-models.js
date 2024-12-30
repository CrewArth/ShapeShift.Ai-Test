const { MongoClient } = require('mongodb')
require('dotenv').config()

async function initializeModelsCollection() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Please add your Mongo URI to .env')
  }

  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    console.log('Connected to MongoDB')

    const db = client.db()
    
    // Check if the collection exists
    const collections = await db.listCollections().toArray()
    const collectionExists = collections.some(col => col.name === 'models')
    
    if (!collectionExists) {
      console.log('Creating models collection...')
      await db.createCollection('models')
      
      // Create indexes
      await db.collection('models').createIndexes([
        { key: { userId: 1 } },
        { key: { isPublic: 1 } },
        { key: { createdAt: -1 } },
        { key: { prompt: 'text', title: 'text' } }
      ])
      console.log('Created indexes for models collection')
    } else {
      console.log('Models collection already exists')
    }

    // Add a sample model if the collection is empty
    const count = await db.collection('models').countDocuments()
    if (count === 0) {
      console.log('Adding sample model...')
      await db.collection('models').insertOne({
        title: 'Sample 3D Model',
        prompt: 'A beautiful red sports car with metallic finish',
        thumbnail: '/sample-thumbnail.jpg',
        modelUrl: '/sample-model.glb',
        userName: 'Demo User',
        userId: 'demo-user-id',
        isPublic: true,
        createdAt: new Date(),
        description: 'This is a sample 3D model',
        tags: ['car', 'sports', 'red'],
        likes: 0,
        views: 0,
        format: 'glb',
        fileSize: 1024
      })
      console.log('Added sample model')
    }

    console.log('Models collection initialization complete!')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

initializeModelsCollection() 