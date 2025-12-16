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
    environment: process.env.NODE_ENV || 'production'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    services: ['dashboard', 'api-gateway'],
    version: '2.0.0'
  });
});

// Mock API endpoints
app.get('/api/numbers', (req, res) => {
  res.json({ success: true, data: [], message: 'Demo mode' });
});

app.get('/api/billing', (req, res) => {
  res.json({ success: true, data: [], message: 'Demo mode' });
});

app.post('/api/auth/login', (req, res) => {
  res.json({ success: true, token: 'demo-token', user: { name: 'Demo User' } });
});

// Serve React dashboard
const dashboardPath = path.join(__dirname, 'dashboard');
app.use(express.static(dashboardPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(dashboardPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`VoxLink v2.0 running on port ${PORT}`);
  console.log(`Dashboard served from: ${dashboardPath}`);
});
