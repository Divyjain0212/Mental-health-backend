const express = require('express');
const cors = require('cors');

const app = express();

// Simple CORS for testing
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'MindCare Backend API is working!',
    status: 'success',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    message: 'API endpoints available',
    endpoints: ['/', '/api', '/api/test'],
    status: 'success'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint working',
    status: 'success',
    data: { test: true }
  });
});

// Basic error handler
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
    error: 'Not found',
    path: req.originalUrl 
  });
});

module.exports = app;