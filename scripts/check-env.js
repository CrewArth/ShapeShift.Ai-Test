require('dotenv').config();
console.log('Environment check:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
if (process.env.MONGODB_URI) {
  console.log('URI value:', process.env.MONGODB_URI);
} 