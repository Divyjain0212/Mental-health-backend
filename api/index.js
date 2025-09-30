const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes'); 
const appointmentRoutes = require('./routes/appointmentRoutes');
const counsellorRoutes = require('./routes/counsellorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const alertRoutes = require('./routes/alertRoutes');
const moodRoutes = require('./routes/moodRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const forumRoutes = require('./routes/forumRoutes');

const app = express();

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://your-frontend-deployment.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Connect to MongoDB (for serverless, we need to handle connection differently)
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;
  
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

// Middleware to ensure database connection
app.use(async (req, res, next) => {
  await connectToDatabase();
  next();
});

// Health check endpoint
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
    endpoints: [
      '/api/auth',
      '/api/chat',
      '/api/appointments',
      '/api/counsellors',
      '/api/admin',
      '/api/alerts',
      '/api/moods',
      '/api/vouchers',
      '/api/forum'
    ]
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/counsellors', counsellorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/forum', forumRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

module.exports = app;