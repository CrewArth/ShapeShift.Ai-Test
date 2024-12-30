const mongoose = require('mongoose');
const fs = require('fs');

// Mongoose connection string
const uri = 'mongodb+srv://arthvala:arthvala15@shapeshiftai.xiyoj.mongodb.net/?retryWrites=true&w=majority&appName=ShapeShiftAI';

const logFile = 'mongoose-test.log';
fs.writeFileSync(logFile, ''); // Clear the log file

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp}: ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(message);
}

log('Starting Mongoose connection test...');

// Create a simple test schema
const TestSchema = new mongoose.Schema({
  name: String,
  createdAt: { type: Date, default: Date.now }
});

async function testConnection() {
  try {
    // Connect using Mongoose
    log('Attempting to connect...');
    await mongoose.connect(uri);
    log('Successfully connected to MongoDB');

    // Get connection status
    log(`Connection state: ${mongoose.connection.readyState}`);
    log(`Connected to database: ${mongoose.connection.name}`);
    
    // Create a test model
    const Test = mongoose.model('Test', TestSchema);
    
    // Try to create a document
    const testDoc = new Test({ name: 'test' });
    await testDoc.save();
    log('Successfully created test document');
    
    // Find the document
    const found = await Test.findOne({ name: 'test' });
    log(`Found test document: ${JSON.stringify(found)}`);
    
    // Clean up - delete the test document
    await Test.deleteOne({ _id: testDoc._id });
    log('Cleaned up test document');
    
    return 'All tests passed successfully';
  } catch (error) {
    log(`Connection error: ${error.message}`);
    log(`Error stack: ${error.stack}`);
    throw error;
  } finally {
    // Close the connection
    await mongoose.disconnect();
    log('Connection closed');
  }
}

// Run the test
testConnection()
  .then(result => {
    log(result);
    process.exit(0);
  })
  .catch(error => {
    log(`Test failed: ${error.message}`);
    process.exit(1);
  }); 