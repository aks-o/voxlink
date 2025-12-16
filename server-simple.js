const express = require('express');

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'VoxLink is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    services: ['dashboard', 'api-gateway'],
    version: '1.0.0'
  });
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>VoxLink - Virtual Phone Numbers</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0f172a; color: white; }
          .container { max-width: 600px; margin: 0 auto; }
          h1 { color: #3b82f6; font-size: 3rem; }
          .status { color: #22c55e; font-weight: bold; font-size: 1.2rem; }
          a { color: #3b82f6; }
          .card { background: #1e293b; padding: 20px; border-radius: 10px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 VoxLink</h1>
          <p class="status">✅ Server Running Successfully!</p>
          <div class="card">
            <p>VoxLink Virtual Phone Number Management System</p>
            <p>Deployed on Railway</p>
          </div>
          <hr style="border-color: #334155;">
          <p><strong>Health Check:</strong> <a href="/api/health">/api/health</a></p>
          <p><strong>Status:</strong> <a href="/api/status">/api/status</a></p>
        </div>
      </body>
    </html>
  `);
});

// Catch all handler
app.get('*', (req, res) => {
  // For API routes, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'API endpoint not found',
      message: 'This is a demo deployment. Full API requires all microservices.'
    });
  }

  // Serve welcome page
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>VoxLink - Virtual Phone Numbers</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0f172a; color: white; }
          .container { max-width: 600px; margin: 0 auto; }
          h1 { color: #3b82f6; font-size: 3rem; }
          .status { color: #22c55e; font-weight: bold; font-size: 1.2rem; }
          a { color: #3b82f6; }
          .card { background: #1e293b; padding: 20px; border-radius: 10px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 VoxLink</h1>
          <p class="status">✅ Server Running Successfully!</p>
          <div class="card">
            <p>VoxLink Virtual Phone Number Management System</p>
            <p>Deployed on Railway</p>
          </div>
          <hr style="border-color: #334155;">
          <p><strong>Health Check:</strong> <a href="/api/health">/api/health</a></p>
          <p><strong>Status:</strong> <a href="/api/status">/api/status</a></p>
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 VoxLink v2.0 server running on port ${PORT}`);
  console.log(`📊 Health check available at /api/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`✅ Server ready - no dashboard dependency`);
});



