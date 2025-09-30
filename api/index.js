// Vercel serverless function with MongoDB and authentication
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// User Schema (inline for simplicity)
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin', 'counsellor'], default: 'student' },
  name: { type: String },
  campus: { type: String },
  phone: { type: String },
  languages: [String],
  specialization: [String],
  location: { type: String },
  availableDays: [String],
  availableHours: { type: String }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password comparison method
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

let User;
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;
  
  try {
    if (process.env.MONGO_URI) {
      console.log('Attempting MongoDB connection...');
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      
      // Initialize User model
      User = mongoose.models.User || mongoose.model('User', UserSchema);
      
      isConnected = true;
      console.log('MongoDB Connected Successfully');
      
      // Create test user if not exists
      await createTestUser();
    } else {
      console.log('MONGO_URI not found in environment variables');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    isConnected = false;
  }
};

// Create a test user for login
const createTestUser = async () => {
  try {
    const existingUser = await User.findOne({ email: 'test@student.com' });
    if (!existingUser) {
      const testUser = new User({
        email: 'test@student.com',
        password: 'password123',
        role: 'student',
        name: 'Test Student'
      });
      await testUser.save();
      console.log('Test user created: test@student.com / password123');
    }
  } catch (error) {
    console.error('Error creating test user:', error);
  }
};

// Helper function to parse JSON body
const parseBody = (req) => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, method } = req;
  
  try {
    // Always try to connect to database
    await connectToDatabase();
    
    // Root endpoint
    if (url === '/' || url === '') {
      return res.status(200).json({
        message: 'MindCare Backend API - Working!',
        status: 'success',
        timestamp: new Date().toISOString(),
        method: method,
        database: isConnected ? 'connected' : 'disconnected'
      });
    }
    
    // API info endpoint
    if (url === '/api' || url === '/api/') {
      return res.status(200).json({
        message: 'MindCare API is running',
        version: '1.0.0',
        status: 'success',
        database: isConnected ? 'connected' : 'disconnected',
        endpoints: [
          'GET /',
          'GET /api',
          'GET /api/health',
          'POST /api/auth/login',
          'GET /api/auth/profile'
        ]
      });
    }
    
    // Health check
    if (url === '/api/health') {
      return res.status(200).json({
        status: 'healthy',
        database: isConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        environment: {
          hasMongoUri: !!process.env.MONGO_URI,
          hasJwtSecret: !!process.env.JWT_SECRET,
          nodeEnv: process.env.NODE_ENV
        }
      });
    }
    
    // Auth register endpoint
    if (url === '/api/auth/register' && method === 'POST') {
      if (!isConnected || !User) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      const body = await parseBody(req);
      const { email, password, role = 'student', name } = body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
        }
        
        // Create new user
        const newUser = new User({
          email,
          password,
          role,
          name
        });
        
        await newUser.save();
        
        // Generate JWT token
        const token = jwt.sign(
          { userId: newUser._id, email: newUser.email, role: newUser.role },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '7d' }
        );
        
        return res.status(201).json({
          token,
          _id: newUser._id,
          email: newUser.email,
          role: newUser.role,
          name: newUser.name
        });
        
      } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Server error during registration' });
      }
    }
    
    // Auth register endpoint
    if (url === '/api/auth/register' && method === 'POST') {
      if (!isConnected || !User) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      const body = await parseBody(req);
      const { email, password, role = 'student', name } = body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
        }
        
        // Create new user
        const newUser = new User({
          email,
          password,
          role,
          name
        });
        
        await newUser.save();
        
        // Generate JWT token
        const token = jwt.sign(
          { userId: newUser._id, email: newUser.email, role: newUser.role },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '7d' }
        );
        
        return res.status(201).json({
          token,
          _id: newUser._id,
          email: newUser.email,
          role: newUser.role,
          name: newUser.name
        });
        
      } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Server error during registration' });
      }
    }
    
    // Auth login endpoint
    if (url === '/api/auth/login' && method === 'POST') {
      if (!isConnected || !User) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      const body = await parseBody(req);
      const { email, password } = body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      try {
        // Find user
        const user = await User.findOne({ email }).select('+password');
        
        if (!user || !(await user.comparePassword(password))) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
          { userId: user._id, email: user.email, role: user.role },
          process.env.JWT_SECRET || 'fallback-secret',
          { expiresIn: '7d' }
        );
        
        return res.status(200).json({
          token,
          _id: user._id,
          email: user.email,
          role: user.role,
          name: user.name
        });
        
      } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login' });
      }
    }
    
    // Auth profile endpoint
    if (url === '/api/auth/profile' && method === 'GET') {
      if (!isConnected || !User) {
        return res.status(500).json({ message: 'Database not connected' });
      }
      
      // Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        return res.status(200).json({
          _id: user._id,
          email: user.email,
          role: user.role,
          name: user.name
        });
        
      } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
      }
    }
    
    // 404 for other routes
    return res.status(404).json({
      error: 'Not Found',
      url: url,
      message: 'Endpoint not found',
      availableEndpoints: ['/', '/api', '/api/health', '/api/auth/login', '/api/auth/profile']
    });
    
  } catch (error) {
    console.error('Function error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}