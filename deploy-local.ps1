# VoxLink Local Deployment Script
# Automatically deploys VoxLink for local testing

param(
    [Parameter()]
    [switch]$WithDocker = $false,
    
    [Parameter()]
    [switch]$SkipBuild = $false,
    
    [Parameter()]
    [switch]$Production = $false
)

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        VoxLink Local Deployment Script v1.0           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "   ✓ npm: v$npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ npm not found" -ForegroundColor Red
    exit 1
}

# Check Docker if needed
if ($WithDocker) {
    Write-Host ""
    Write-Host "🐳 Checking Docker..." -ForegroundColor Yellow
    try {
        $dockerVersion = docker --version
        Write-Host "   ✓ Docker: $dockerVersion" -ForegroundColor Green
        
        # Check if Docker is running
        docker ps | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
            exit 1
        }
        Write-Host "   ✓ Docker is running" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ Docker not found or not running" -ForegroundColor Red
        Write-Host "   Please start Docker Desktop or run without -WithDocker flag" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Dependencies installed" -ForegroundColor Green

# Build projects
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "🔨 Building all projects..." -ForegroundColor Yellow
    npm run build --workspaces
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✓ All projects built successfully" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⏭️  Skipping build (using existing build)" -ForegroundColor Yellow
}

# Generate Prisma clients
Write-Host ""
Write-Host "🔧 Generating Prisma clients..." -ForegroundColor Yellow

$services = @(
    "packages/billing-service",
    "packages/notification-service",
    "packages/number-service"
)

foreach ($service in $services) {
    Write-Host "   Generating for $service..." -ForegroundColor Gray
    Push-Location $service
    npx prisma generate | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ✗ Failed to generate Prisma client for $service" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
}
Write-Host "   ✓ Prisma clients generated" -ForegroundColor Green

# Create .env file if it doesn't exist
Write-Host ""
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    
    if ($Production) {
        $envContent = @"
# VoxLink Production Environment Configuration

# Environment
NODE_ENV=production
LOG_LEVEL=info

# Database Configuration
DATABASE_URL=postgresql://voxlink:secure_password@localhost:5432/voxlink_prod
BILLING_DATABASE_URL=postgresql://voxlink:secure_password@localhost:5434/voxlink_billing_prod
TEST_DATABASE_URL=postgresql://voxlink:secure_password@localhost:5433/voxlink_test

# Redis
REDIS_URL=redis://localhost:6379

# API Gateway Configuration
API_GATEWAY_PORT=3000
API_GATEWAY_HOST=0.0.0.0

# Service Ports
NUMBER_SERVICE_PORT=3001
BILLING_SERVICE_PORT=3002
NOTIFICATION_SERVICE_PORT=3003
AI_AGENT_SERVICE_PORT=3004

# Service URLs
NUMBER_SERVICE_URL=http://localhost:3001
BILLING_SERVICE_URL=http://localhost:3002
NOTIFICATION_SERVICE_URL=http://localhost:3003
AI_AGENT_SERVICE_URL=http://localhost:3004

# JWT Configuration
JWT_SECRET=CHANGE_THIS_TO_SECURE_SECRET_MIN_32_CHARS
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=voxlink.com
JWT_AUDIENCE=voxlink-api

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Security
ENCRYPTION_KEY=CHANGE_THIS_32_BYTE_ENCRYPTION_KEY

# File Upload
MAX_FILE_SIZE_MB=10

# Telecom Providers (Replace with your credentials)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
BANDWIDTH_USER_ID=your_bandwidth_user_id
BANDWIDTH_API_TOKEN=your_bandwidth_api_token
VONAGE_API_KEY=your_vonage_api_key
VONAGE_API_SECRET=your_vonage_api_secret

# Payment Processing
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@voxlink.com

# Storage
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=voxlink-storage
AWS_REGION=ap-south-1
"@
    } else {
        $envContent = @"
# VoxLink Development Environment Configuration

# Environment
NODE_ENV=development
LOG_LEVEL=debug

# Database Configuration (SQLite for development)
DATABASE_URL=file:./dev.db
BILLING_DATABASE_URL=file:./billing.db
TEST_DATABASE_URL=file:./test.db

# Redis (In-memory for development)
REDIS_URL=memory://localhost

# API Gateway Configuration
API_GATEWAY_PORT=3000
API_GATEWAY_HOST=localhost

# Service Ports
NUMBER_SERVICE_PORT=3001
BILLING_SERVICE_PORT=3002
NOTIFICATION_SERVICE_PORT=3003
AI_AGENT_SERVICE_PORT=3004

# Service URLs
NUMBER_SERVICE_URL=http://localhost:3001
BILLING_SERVICE_URL=http://localhost:3002
NOTIFICATION_SERVICE_URL=http://localhost:3003
AI_AGENT_SERVICE_URL=http://localhost:3004

# JWT Configuration (Development - DO NOT USE IN PRODUCTION)
JWT_SECRET=dev_jwt_secret_key_change_in_production_min_32_chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=voxlink.local
JWT_AUDIENCE=voxlink-api

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Security
ENCRYPTION_KEY=dev_encryption_key_32_bytes_long

# File Upload
MAX_FILE_SIZE_MB=10

# Development API Keys (Mock/Test - Replace with real keys for testing)
TWILIO_ACCOUNT_SID=dev_twilio_account_sid
TWILIO_AUTH_TOKEN=dev_twilio_auth_token
BANDWIDTH_USER_ID=dev_bandwidth_user_id
BANDWIDTH_API_TOKEN=dev_bandwidth_api_token
VONAGE_API_KEY=dev_vonage_api_key
VONAGE_API_SECRET=dev_vonage_api_secret

# Payment Processing (Test Mode)
STRIPE_SECRET_KEY=sk_test_dev_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_dev_stripe_webhook_secret

# Email Configuration (Development)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=dev
SMTP_PASSWORD=dev
SMTP_FROM=dev@voxlink.local

# Storage (Local)
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_S3_BUCKET=voxlink-dev
AWS_REGION=us-east-1
AWS_ENDPOINT=http://localhost:9000
"@
    }
    
    Set-Content -Path ".env" -Value $envContent
    Write-Host "   ✓ .env file created" -ForegroundColor Green
} else {
    Write-Host "   ✓ .env file already exists" -ForegroundColor Green
}

# Deploy with Docker or without
Write-Host ""
if ($WithDocker) {
    Write-Host "🐳 Starting services with Docker..." -ForegroundColor Yellow
    Write-Host ""
    
    # Start Docker Compose
    docker-compose up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to start Docker services" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "   ✓ Docker services started" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Service Status:" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host ""
    Write-Host "📝 View logs:" -ForegroundColor Yellow
    Write-Host "   docker-compose logs -f" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🛑 Stop services:" -ForegroundColor Yellow
    Write-Host "   docker-compose down" -ForegroundColor Gray
    
} else {
    Write-Host "🚀 Starting services (without Docker)..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This will start all services in development mode." -ForegroundColor Gray
    Write-Host "Press Ctrl+C to stop all services." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Services will be available at:" -ForegroundColor Cyan
    Write-Host "   Dashboard:         http://localhost:5173" -ForegroundColor White
    Write-Host "   API Gateway:       http://localhost:3000" -ForegroundColor White
    Write-Host "   Number Service:    http://localhost:3001" -ForegroundColor White
    Write-Host "   Billing Service:   http://localhost:3002" -ForegroundColor White
    Write-Host "   Notification:      http://localhost:3003" -ForegroundColor White
    Write-Host "   AI Agent:          http://localhost:3004" -ForegroundColor White
    Write-Host ""
    Write-Host "Starting in 3 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    # Start development servers
    npm run dev
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "     ✓ VoxLink Deployment Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

