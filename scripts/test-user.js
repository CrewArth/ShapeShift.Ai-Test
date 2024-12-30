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

async function testUserCreation() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Using database: shapeshiftai');
    await mongoose.connect(uri);
    console.log('Connected successfully to MongoDB');

    const User = mongoose.model('User', userSchema);

    // Create a test user
    const testUser = new User({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'user'
    });

    // Save the user
    await testUser.save();
    console.log('Test user created successfully');
    console.log('Password has been hashed:', testUser.password.startsWith('$2a$'));

    // Retrieve the user
    const foundUser = await User.findOne({ email: 'test@example.com' });
    console.log('Retrieved user:', {
      id: foundUser._id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
      createdAt: foundUser.createdAt,
      hashedPassword: foundUser.password.substring(0, 10) + '...'
    });

    // Clean up - delete the test user
    await User.deleteOne({ _id: testUser._id });
    console.log('Test user cleaned up');

    return 'User creation test completed successfully';
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

testUserCreation()
  .then(console.log)
  .catch(console.error)
  .finally(() => process.exit()); 