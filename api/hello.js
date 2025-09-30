// Alternative simple serverless function
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Basic response
  return res.status(200).json({
    message: 'Mental Health Backend API',
    status: 'working',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
}