const { MongoClient } = require('mongodb');

// Connection URL
const url = 'mongodb+srv://arthvala:arthvala15@shapeshiftai.xiyoj.mongodb.net/?retryWrites=true&w=majority&appName=ShapeShiftAI';

// Create a new MongoClient
const client = new MongoClient(url);

// Function to test connection
async function testConnection() {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');
    
    const admin = client.db('admin');
    const result = await admin.command({ ping: 1 });
    console.log('MongoDB server responded to ping:', result);
    
    const dbs = await client.db().admin().listDatabases();
    console.log('Available databases:', dbs.databases.map(db => db.name));
    
    return 'Connection test successful';
  } catch (err) {
    console.error('Connection error:', err);
    throw err;
  }
}

// Make these available in REPL
global.client = client;
global.testConnection = testConnection;

console.log('MongoDB test environment ready.');
console.log('Try: await testConnection()'); 