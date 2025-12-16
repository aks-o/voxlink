# VoxLink Development Startup Script (PowerShell)
# This script starts all services for local development without Docker

Write-Host "Starting VoxLink Development Environment" -ForegroundColor Blue
Write-Host "=============================================="

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Create development environment file for no-docker setup
Write-Host "📝 Creating .env file for development..." -ForegroundColor Yellow

$envContent = @'
# VoxLink Development Environment Configuration

# Environment
NODE_ENV=development
LOG_LEVEL=debug

# In-Memory Database Configuration (SQLite for development)
DATABASE_URL=file:./dev.db
BILLING_DATABASE_URL=file:./billing.db
TEST_DATABASE_URL=file:./test.db

# In-Memory Redis (using memory store)
REDIS_URL=memory://localhost

# API Gateway Configuration
API_GATEWAY_PORT=3000
API_GATEWAY_HOST=localhost

# Service Ports
NUMBER_SERVICE_PORT=3001
BILLING_SERVICE_PORT=3002
NOTIFICATION_SERVICE_PORT=3003

# Service URLs
NUMBER_SERVICE_URL=http://localhost:3001
BILLING_SERVICE_URL=http://localhost:3002
NOTIFICATION_SERVICE_URL=http://localhost:3003

# JWT Configuration
JWT_SECRET=dev_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# File Upload
MAX_FILE_SIZE_MB=10

# Development API Keys (Mock/Test)
TWILIO_ACCOUNT_SID=dev_twilio_account_sid
TWILIO_AUTH_TOKEN=dev_twilio_auth_token
BANDWIDTH_USER_ID=dev_bandwidth_user_id
BANDWIDTH_API_TOKEN=dev_bandwidth_api_token
STRIPE_SECRET_KEY=sk_test_dev_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_dev_stripe_webhook_secret
SENDGRID_API_KEY=SG.dev_sendgrid_api_key

# Dashboard Configuration
VITE_API_URL=http://localhost:3000
VITE_ENVIRONMENT=development
VITE_LOG_LEVEL=debug

# Mock/Development Settings
USE_MOCK_PROVIDERS=true
MOCK_PAYMENT_PROCESSING=true
MOCK_SMS_DELIVERY=true
MOCK_EMAIL_DELIVERY=true
USE_MEMORY_STORE=true
USE_SQLITE=true

# Development Features
ENABLE_API_DOCS=true
ENABLE_DEBUG_ROUTES=true
ENABLE_MOCK_DATA=true
'@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "Environment configured!" -ForegroundColor Green

Write-Host "Development environment is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Available Services:" -ForegroundColor Blue
Write-Host "  - API Gateway:         http://localhost:3000" -ForegroundColor Green
Write-Host "  - Number Service:      http://localhost:3001" -ForegroundColor Green
Write-Host "  - Billing Service:     http://localhost:3002" -ForegroundColor Green
Write-Host "  - Notification Service: http://localhost:3003" -ForegroundColor Green
Write-Host "  - Dashboard:           http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Data Storage:" -ForegroundColor Blue
Write-Host "  - Main DB:    SQLite (./dev.db)" -ForegroundColor Green
Write-Host "  - Billing DB: SQLite (./billing.db)" -ForegroundColor Green
Write-Host "  - Cache:      In-Memory" -ForegroundColor Green
Write-Host ""
Write-Host "Starting all services..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Start all services
npm run dev