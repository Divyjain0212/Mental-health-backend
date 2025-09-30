const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// CORS configuration
app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB connection
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

// Health check endpoints
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the MindCare Backend API!', 
    status: 'Server is running correctly.',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    message: 'MindCare API is running', 
    version: '1.0.0',
    endpoints: ['/api/auth', '/api/test']
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString()
  });
});

// Load routes with proper error handling
try {
  // Auth routes
  app.use('/api/auth', async (req, res, next) => {
    await connectToDatabase();
    next();
  }, require('../routes/authRoutes'));

  // Add other routes one by one after testing auth works
  
} catch (err) {
  console.error('Error loading routes:', err);
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl 
  });
});

module.exports = app;