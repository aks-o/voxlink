const express = require('express');
const path = require('path');

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

// Serve static files from dashboard if it exists
const dashboardPath = path.join(__dirname, 'packages/dashboard/dist');
const staticPath = path.join(__dirname, 'packages/dashboard');

try {
  // Try to serve built files first
  app.use(express.static(dashboardPath));
  console.log('Serving built dashboard from:', dashboardPath);
} catch (error) {
  // Fallback to source files
  app.use(express.static(staticPath));
  console.log('Serving source dashboard from:', staticPath);
}

// Catch all handler for SPA routing
app.get('*', (req, res) => {
  // For API routes, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'API endpoint not found',
      message: 'This is a demo deployment. Full API requires all microservices.'
    });
  }

  // For everything else, serve the dashboard
  try {
    res.sendFile(path.join(dashboardPath, 'index.html'));
  } catch (error) {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>VoxLink - Coming Soon</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: 0 auto; }
            h1 { color: #2563eb; }
            .status { color: #059669; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 VoxLink</h1>
            <p class="status">Deployment in Progress</p>
            <p>VoxLink microservices platform is being deployed to Railway.</p>
            <p>Full dashboard and API will be available shortly!</p>
            <hr>
            <p><strong>Health Check:</strong> <a href="/api/health">/api/health</a></p>
            <p><strong>Status:</strong> <a href="/api/status">/api/status</a></p>
          </div>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 VoxLink server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});



