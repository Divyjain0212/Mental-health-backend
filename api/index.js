// Ultra-minimal serverless function for debugging
const app = require('express')();

// Basic middleware
app.use(require('cors')());
app.use(require('express').json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'MindCare Backend API - Working!',
    status: 'success',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'API is running',
    endpoints: [
      'GET /',
      'GET /api',
      'GET /api/health'
    ],
    status: 'success'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: {
      node_version: process.version,
      platform: process.platform,
      memory: process.memoryUsage()
    }
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
    message: 'This endpoint does not exist'
  });
});

// Export for Vercel
module.exports = app;