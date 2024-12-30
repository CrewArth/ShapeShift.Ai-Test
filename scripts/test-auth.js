const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connection URL with explicit database name
const uri = 'mongodb+srv://arthvala:arthvala15@shapeshiftai.xiyoj.mongodb.net/shapeshiftai?retryWrites=true&w=majority&appName=ShapeShiftAI';

// User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  }
}, {
  collection: 'users',
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

async function testAuthentication() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected successfully to MongoDB');

    const User = mongoose.model('User', userSchema);

    // Test user credentials
    const testUser = {
      email: 'arth@example.com',
      password: 'password123',
      name: 'Arth Vala'
    };

    console.log('\n--- Testing Signup ---');
    // Create new user
    const newUser = new User(testUser);
    await newUser.save();
    console.log('User created successfully:', {
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      hashedPassword: newUser.password.substring(0, 10) + '...'
    });

    console.log('\n--- Testing Login ---');
    // Find user by email
    const foundUser = await User.findOne({ email: testUser.email });
    if (!foundUser) {
      throw new Error('User not found');
    }

    // Test correct password
    const isValidPassword = await foundUser.comparePassword(testUser.password);
    console.log('Login with correct password:', isValidPassword ? 'SUCCESS' : 'FAILED');

    // Test wrong password
    const isInvalidPassword = await foundUser.comparePassword('wrongpassword');
    console.log('Login with wrong password:', !isInvalidPassword ? 'CORRECTLY REJECTED' : 'FAILED');

    // Clean up - delete test user
    await User.deleteOne({ _id: newUser._id });
    console.log('\nTest user cleaned up');

    return 'Authentication test completed successfully';
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

testAuthentication()
  .then(console.log)
  .catch(console.error)
  .finally(() => process.exit()); 