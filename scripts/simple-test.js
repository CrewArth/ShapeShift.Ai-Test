const { MongoClient } = require('mongodb');

// Connection URL
const url = 'mongodb+srv://arthvala:arthvala15@shapeshiftai.xiyoj.mongodb.net/?retryWrites=true&w=majority&appName=ShapeShiftAI';

// Database Name
const dbName = 'shapeshiftai';

async function main() {
  console.log('Starting MongoDB connection test...');
  
  const client = new MongoClient(url);

  try {
    // Connect to the MongoDB server
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully to MongoDB server');

    // Get the database
    const db = client.db(dbName);
    console.log('Accessed database:', dbName);

    // Perform a simple operation (list collections)
    const collections = await db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name));

    return 'Connection test completed successfully.';
  } catch (err) {
    console.error('An error occurred:', err);
    throw err;
  } finally {
    // Close the connection
    await client.close();
    console.log('Connection closed');
  }
}

main()
  .then(console.log)
  .catch(console.error)
  .finally(() => process.exit()); 