const express = require('express');
const path = require('path');
const compression = require('compression');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());

// Serve static files from dashboard build
const dashboardPath = path.join(__dirname, 'packages/dashboard/dist');
app.use(express.static(dashboardPath));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'VoxLink API Gateway',
    timestamp: new Date().toISOString(),
    services: {
      dashboard: 'available',
      api: 'mock-mode'
    }
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: [
      { name: 'api-gateway', status: 'mock' },
      { name: 'number-service', status: 'mock' },
      { name: 'billing-service', status: 'mock' },
      { name: 'notification-service', status: 'mock' },
      { name: 'ai-agent-service', status: 'mock' }
    ]
  });
});

// Mock API endpoints for development
app.get('/api/numbers', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Number service not deployed - using mock data'
  });
});

app.get('/api/billing', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Billing service not deployed - using mock data'
  });
});

app.get('/api/notifications', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Notification service not deployed - using mock data'
  });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(dashboardPath, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

app.listen(PORT, () => {
  console.log(`🚀 VoxLink server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Mock mode'}`);
});
