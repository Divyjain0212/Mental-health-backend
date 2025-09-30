// Vercel serverless function with MongoDB and basic routes
import mongoose from 'mongoose';

let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;
  
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      isConnected = true;
      console.log('MongoDB Connected');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
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
    // Connect to database for API routes
    if (url.startsWith('/api/')) {
      await connectToDatabase();
    }
    
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
    
    // Auth login endpoint (basic implementation)
    if (url === '/api/auth/login' && method === 'POST') {
      return res.status(200).json({
        message: 'Login endpoint working',
        note: 'Full authentication will be added next',
        timestamp: new Date().toISOString()
      });
    }
    
    // 404 for other routes
    return res.status(404).json({
      error: 'Not Found',
      url: url,
      message: 'Endpoint not found',
      availableEndpoints: ['/', '/api', '/api/health', '/api/auth/login']
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