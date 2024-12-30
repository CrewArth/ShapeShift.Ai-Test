const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = 3001;

// MongoDB connection string
const uri = "mongodb+srv://arthvala:arthvala15@shapeshiftai.xiyoj.mongodb.net/?retryWrites=true&w=majority&appName=ShapeShiftAI";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/test-db', async (req, res) => {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');

    // Ping the database
    await client.db('admin').command({ ping: 1 });
    console.log('Database ping successful');

    // List databases
    const dbs = await client.db().admin().listDatabases();
    console.log('Available databases:', dbs);

    res.json({ 
      status: 'success',
      message: 'Connected to MongoDB successfully',
      databases: dbs
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      status: 'error',
      message: error.message,
      error: error
    });
  } finally {
    await client.close();
  }
});

app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}/test-db`);
}); 