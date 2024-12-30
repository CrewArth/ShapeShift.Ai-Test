const { MongoClient, ServerApiVersion } = require('mongodb');

// Use the exact connection string
const uri = "mongodb+srv://arthvala:arthvala15@shapeshiftai.xiyoj.mongodb.net/?retryWrites=true&w=majority&appName=ShapeShiftAI";

process.stderr.write('Starting MongoDB connection test...\n');

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    process.stderr.write('Attempting to connect to MongoDB...\n');
    await client.connect();
    process.stderr.write('Successfully connected to the server\n');

    // List databases to verify connection
    const adminDb = client.db('admin');
    const result = await adminDb.command({ ping: 1 });
    process.stderr.write('Pinged deployment. Server responded with: ' + JSON.stringify(result) + '\n');

    // Try to access our specific database
    const database = client.db('shapeshiftai');
    process.stderr.write('Successfully accessed shapeshiftai database\n');

    // List all collections
    const collections = await database.listCollections().toArray();
    process.stderr.write('Available collections: ' + collections.map(c => c.name).join(', ') + '\n');

    process.stderr.write('Connection test completed successfully!\n');
  } catch (error) {
    process.stderr.write('\nConnection failed with error:\n');
    process.stderr.write('Error name: ' + error.name + '\n');
    process.stderr.write('Error message: ' + error.message + '\n');
    process.stderr.write('Full error:\n' + JSON.stringify(error, null, 2) + '\n');
    throw error;
  } finally {
    await client.close();
    process.stderr.write('Connection closed\n');
  }
}

// Add global error handlers
process.on('unhandledRejection', (error) => {
  process.stderr.write('\nUnhandled Promise Rejection:\n');
  process.stderr.write(error.stack + '\n');
});

process.on('uncaughtException', (error) => {
  process.stderr.write('\nUncaught Exception:\n');
  process.stderr.write(error.stack + '\n');
});

run()
  .catch(error => {
    process.stderr.write('\nScript failed:\n');
    process.stderr.write(error.stack + '\n');
  })
  .finally(() => {
    process.stderr.write('Test script completed\n');
    process.exit();
  }); 