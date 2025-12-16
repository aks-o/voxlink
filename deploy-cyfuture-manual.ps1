# VoxLink Cyfuture Manual Deployment (No Docker Required)
# Alternative deployment method without Docker containers

param(
    [Parameter()]
    [string]$Region = "mumbai-1",
    
    [Parameter()]
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  VoxLink Cyfuture Manual Deployment" -ForegroundColor Cyan
Write-Host "  (No Docker Required)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check Prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Node.js not found" -ForegroundColor Red
    exit 1
}

# Check Cyfuture CLI
cyfuture --version 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Cyfuture CLI not found" -ForegroundColor Red
    Write-Host "  Install: npm install -g @cyfuture/cli" -ForegroundColor Yellow
    exit 1
}
Write-Host "  [OK] Cyfuture CLI installed" -ForegroundColor Green

# Check Cyfuture authentication
cyfuture auth status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [WARNING] Not authenticated with Cyfuture" -ForegroundColor Yellow
    Write-Host "  Please login to Cyfuture Cloud..." -ForegroundColor Yellow
    cyfuture login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERROR] Authentication failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  [OK] Authenticated with Cyfuture" -ForegroundColor Green

# Step 2: Build Application
Write-Host ""
Write-Host "Building application..." -ForegroundColor Yellow

# Install dependencies
Write-Host "  Installing dependencies..." -ForegroundColor Gray
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Build all packages
Write-Host "  Building all packages..." -ForegroundColor Gray
npm run build --workspaces
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Build failed" -ForegroundColor Red
    exit 1
}

# Generate Prisma clients
Write-Host "  Generating Prisma clients..." -ForegroundColor Gray
$services = @("billing-service", "notification-service", "number-service")
foreach ($service in $services) {
    Push-Location "packages/$service"
    npx prisma generate | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERROR] Failed to generate Prisma client for $service" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
}

Write-Host "  [OK] Build completed" -ForegroundColor Green

# Step 3: Infrastructure Setup
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  MANUAL CYFUTURE INFRASTRUCTURE SETUP REQUIRED" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "You need to create these Cyfuture resources:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. VPC Network:" -ForegroundColor White
Write-Host "   cyfuture vpc create --name voxlink-vpc --region $Region --cidr 10.0.0.0/16" -ForegroundColor Gray
Write-Host ""

Write-Host "2. PostgreSQL Database:" -ForegroundColor White
Write-Host "   cyfuture database create --name voxlink-db --engine postgres --version 15 --region $Region --size medium" -ForegroundColor Gray
Write-Host ""

Write-Host "3. Redis Cache:" -ForegroundColor White
Write-Host "   cyfuture cache create --name voxlink-redis --engine redis --version 7 --region $Region --size small" -ForegroundColor Gray
Write-Host ""

Write-Host "4. Object Storage:" -ForegroundColor White
Write-Host "   cyfuture storage create --name voxlink-storage --region $Region" -ForegroundColor Gray
Write-Host ""

Write-Host "5. Load Balancer:" -ForegroundColor White
Write-Host "   cyfuture lb create --name voxlink-lb --region $Region --type application" -ForegroundColor Gray
Write-Host ""

$continue = Read-Host "Have you created all the infrastructure above? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host ""
    Write-Host "Please create the infrastructure first, then run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For detailed instructions, see: CYFUTURE_QUICK_START.md" -ForegroundColor Gray
    exit 0
}

# Step 4: Get Connection Details
Write-Host ""
Write-Host "Getting connection details..." -ForegroundColor Yellow

# Get database connection
$dbInfo = cyfuture database get voxlink-db --output json 2>$null | ConvertFrom-Json
if ($dbInfo) {
    $DB_HOST = $dbInfo.host
    $DB_PORT = $dbInfo.port
    $DB_USERNAME = $dbInfo.username
    Write-Host "  [OK] Database connection retrieved" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] Could not get database info" -ForegroundColor Yellow
    $DB_HOST = Read-Host "  Enter database host"
    $DB_PORT = Read-Host "  Enter database port"
    $DB_USERNAME = Read-Host "  Enter database username"
}

# Get Redis connection
$redisInfo = cyfuture cache get voxlink-redis --output json 2>$null | ConvertFrom-Json
if ($redisInfo) {
    $REDIS_HOST = $redisInfo.host
    $REDIS_PORT = $redisInfo.port
    Write-Host "  [OK] Redis connection retrieved" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] Could not get Redis info" -ForegroundColor Yellow
    $REDIS_HOST = Read-Host "  Enter Redis host"
    $REDIS_PORT = Read-Host "  Enter Redis port"
}

# Step 5: Deploy Services (Serverless Functions)
Write-Host ""
Write-Host "Deploying services as serverless functions..." -ForegroundColor Yellow

# Deploy API Gateway as serverless
Write-Host "  Deploying API Gateway..." -ForegroundColor Gray
cyfuture function create `
    --name voxlink-api-gateway `
    --runtime nodejs18 `
    --handler packages/api-gateway/dist/index.handler `
    --source packages/api-gateway/dist `
    --region $Region `
    --memory 512MB `
    --timeout 30s `
    --env NODE_ENV=production `
    --env DATABASE_URL="postgresql://${DB_USERNAME}:password@${DB_HOST}:${DB_PORT}/voxlink" `
    --env REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"

# Deploy Number Service
Write-Host "  Deploying Number Service..." -ForegroundColor Gray
cyfuture function create `
    --name voxlink-number-service `
    --runtime nodejs18 `
    --handler packages/number-service/dist/index.handler `
    --source packages/number-service/dist `
    --region $Region `
    --memory 512MB `
    --env NODE_ENV=production `
    --env DATABASE_URL="postgresql://${DB_USERNAME}:password@${DB_HOST}:${DB_PORT}/voxlink"

# Deploy Billing Service
Write-Host "  Deploying Billing Service..." -ForegroundColor Gray
cyfuture function create `
    --name voxlink-billing-service `
    --runtime nodejs18 `
    --handler packages/billing-service/dist/index.handler `
    --source packages/billing-service/dist `
    --region $Region `
    --memory 256MB `
    --env NODE_ENV=production `
    --env DATABASE_URL="postgresql://${DB_USERNAME}:password@${DB_HOST}:${DB_PORT}/voxlink_billing"

# Deploy Notification Service
Write-Host "  Deploying Notification Service..." -ForegroundColor Gray
cyfuture function create `
    --name voxlink-notification-service `
    --runtime nodejs18 `
    --handler packages/notification-service/dist/index.handler `
    --source packages/notification-service/dist `
    --region $Region `
    --memory 256MB `
    --env NODE_ENV=production

# Step 6: Deploy Dashboard (Static Website)
Write-Host ""
Write-Host "Deploying dashboard as static website..." -ForegroundColor Yellow

# Build dashboard for production
Push-Location "packages/dashboard"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Dashboard build failed" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Upload to object storage
Write-Host "  Uploading dashboard to object storage..." -ForegroundColor Gray
cyfuture storage upload `
    --bucket voxlink-storage `
    --source dist `
    --destination / `
    --recursive

Pop-Location

# Configure static website hosting
cyfuture storage website-config `
    --bucket voxlink-storage `
    --index-document index.html `
    --error-document index.html

Write-Host "  [OK] Dashboard deployed" -ForegroundColor Green

# Step 7: Configure API Gateway
Write-Host ""
Write-Host "Configuring API Gateway..." -ForegroundColor Yellow

cyfuture api create `
    --name voxlink-api `
    --region $Region

# Add routes
cyfuture api add-route `
    --api voxlink-api `
    --path /api/numbers `
    --method ANY `
    --function voxlink-number-service

cyfuture api add-route `
    --api voxlink-api `
    --path /api/billing `
    --method ANY `
    --function voxlink-billing-service

cyfuture api add-route `
    --api voxlink-api `
    --path /api/notifications `
    --method ANY `
    --function voxlink-notification-service

cyfuture api add-route `
    --api voxlink-api `
    --path /{proxy+} `
    --method ANY `
    --function voxlink-api-gateway

# Step 8: Setup Domain and SSL
Write-Host ""
Write-Host "Setting up domain and SSL..." -ForegroundColor Yellow

$domain = Read-Host "  Enter your domain name (e.g., voxlink.in)"
if ($domain) {
    # Setup SSL certificate
    cyfuture ssl create `
        --domain $domain `
        --auto-renew

    # Configure load balancer with SSL
    cyfuture lb add-ssl voxlink-lb `
        --domain $domain

    Write-Host "  [OK] SSL configured for $domain" -ForegroundColor Green
}

# Step 9: Run Database Migrations
Write-Host ""
Write-Host "Running database migrations..." -ForegroundColor Yellow

# For serverless deployment, you might need to run migrations manually
# or create a separate migration function

Write-Host "  [NOTE] Run migrations manually or create migration function" -ForegroundColor Yellow

# Summary
Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  VoxLink Deployed to Cyfuture Cloud!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

if ($domain) {
    Write-Host "Dashboard URL: https://$domain" -ForegroundColor Cyan
    Write-Host "API URL:      https://api.$domain" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  View functions: cyfuture function list" -ForegroundColor Gray
Write-Host "  View logs:      cyfuture logs tail voxlink-api-gateway" -ForegroundColor Gray
Write-Host "  Scale function: cyfuture function update voxlink-api-gateway --memory 1GB" -ForegroundColor Gray
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure environment variables in Cyfuture dashboard" -ForegroundColor White
Write-Host "2. Run database migrations manually" -ForegroundColor White
Write-Host "3. Test the application" -ForegroundColor White
Write-Host "4. Setup monitoring and alerts" -ForegroundColor White
Write-Host ""

Write-Host "========================================================" -ForegroundColor Green
Write-Host ""
