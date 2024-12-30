const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'mongodb-test-results.txt');

// Clear the log file
fs.writeFileSync(logFile, '');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
}

// Connection URL
const url = 'mongodb+srv://arthvala:arthvala15@shapeshiftai.xiyoj.mongodb.net/?retryWrites=true&w=majority&appName=ShapeShiftAI';

// Create a new MongoClient
const client = new MongoClient(url);

async function testConnection() {
  try {
    log('Starting connection test...');
    log(`Using MongoDB URI: ${url}`);

    await client.connect();
    log('Connected successfully to MongoDB');
    
    const admin = client.db('admin');
    const result = await admin.command({ ping: 1 });
    log(`MongoDB server responded to ping: ${JSON.stringify(result)}`);
    
    const dbs = await client.db().admin().listDatabases();
    log(`Available databases: ${dbs.databases.map(db => db.name).join(', ')}`);
    
    log('Connection test completed successfully');
  } catch (err) {
    log('Connection error occurred:');
    log(`Error name: ${err.name}`);
    log(`Error message: ${err.message}`);
    log(`Full error: ${JSON.stringify(err, null, 2)}`);
    throw err;
  } finally {
    await client.close();
    log('Connection closed');
  }
}

testConnection()
  .catch(err => {
    log(`Unhandled error: ${err.message}`);
  })
  .finally(() => {
    log('Test script completed');
    console.log(`Results have been written to: ${logFile}`);
    process.exit();
  }); 