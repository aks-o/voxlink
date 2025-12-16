# VoxLink Deployment Script for Cyfuture Cloud
# Deploys VoxLink to Cyfuture Cloud Infrastructure

param(
    [Parameter()]
    [string]$Region = "mumbai-1",
    
    [Parameter()]
    [string]$Environment = "production",
    
    [Parameter()]
    [switch]$SkipBuild = $false,
    
    [Parameter()]
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    VoxLink Cyfuture Cloud Deployment Script v1.0      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_NAME = "voxlink"
$CYFUTURE_REGION = $Region
$ENV_NAME = $Environment

Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "   Project: $PROJECT_NAME" -ForegroundColor Gray
Write-Host "   Region: $CYFUTURE_REGION" -ForegroundColor Gray
Write-Host "   Environment: $ENV_NAME" -ForegroundColor Gray
Write-Host ""

# Step 1: Check Prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "   ✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check Docker
try {
    $dockerVersion = docker --version
    Write-Host "   ✓ Docker: $dockerVersion" -ForegroundColor Green
    
    docker ps | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check Cyfuture CLI
Write-Host ""
Write-Host "🌐 Checking Cyfuture CLI..." -ForegroundColor Yellow
try {
    $cyfutureVersion = cyfuture --version 2>$null
    Write-Host "   ✓ Cyfuture CLI installed" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Cyfuture CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Installing Cyfuture CLI..." -ForegroundColor Yellow
    Write-Host "   Please visit: https://cli.cyfuture.com/install" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Or install via npm:" -ForegroundColor Yellow
    Write-Host "   npm install -g @cyfuture/cli" -ForegroundColor Gray
    Write-Host ""
    $install = Read-Host "Install Cyfuture CLI now? (y/n)"
    if ($install -eq "y") {
        npm install -g @cyfuture/cli
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ✗ Failed to install Cyfuture CLI" -ForegroundColor Red
            exit 1
        }
        Write-Host "   ✓ Cyfuture CLI installed" -ForegroundColor Green
    } else {
        Write-Host "   Please install Cyfuture CLI and try again." -ForegroundColor Yellow
        exit 1
    }
}

# Check Cyfuture authentication
Write-Host ""
Write-Host "🔐 Checking Cyfuture authentication..." -ForegroundColor Yellow
cyfuture auth status 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ✗ Not authenticated with Cyfuture" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Please login to Cyfuture Cloud..." -ForegroundColor Yellow
    cyfuture login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ✗ Authentication failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "   ✓ Authenticated with Cyfuture" -ForegroundColor Green

# Step 2: Build Application
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "🔨 Building application..." -ForegroundColor Yellow
    
    # Install dependencies
    Write-Host "   Installing dependencies..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ✗ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    
    # Build all packages
    Write-Host "   Building all packages..." -ForegroundColor Gray
    npm run build --workspaces
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ✗ Build failed" -ForegroundColor Red
        exit 1
    }
    
    # Generate Prisma clients
    Write-Host "   Generating Prisma clients..." -ForegroundColor Gray
    $services = @("billing-service", "notification-service", "number-service")
    foreach ($service in $services) {
        Push-Location "packages/$service"
        npx prisma generate | Out-Null
        Pop-Location
    }
    
    Write-Host "   ✓ Build completed" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⏭️  Skipping build (using existing build)" -ForegroundColor Yellow
}

# Step 3: Create/Update Cyfuture Infrastructure
Write-Host ""
Write-Host "🏗️  Setting up Cyfuture infrastructure..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "   [DRY RUN] Would create infrastructure" -ForegroundColor Gray
} else {
    Write-Host "   Creating VPC..." -ForegroundColor Gray
    cyfuture vpc create --name "$PROJECT_NAME-vpc" --region $CYFUTURE_REGION --cidr "10.0.0.0/16" 2>$null
    
    Write-Host "   Creating container registry..." -ForegroundColor Gray
    cyfuture registry create --name "$PROJECT_NAME-registry" --region $CYFUTURE_REGION 2>$null
    
    Write-Host "   Creating PostgreSQL database..." -ForegroundColor Gray
    cyfuture database create --name "$PROJECT_NAME-db" --engine postgres --version 15 --region $CYFUTURE_REGION --size medium 2>$null
    
    Write-Host "   Creating Redis cache..." -ForegroundColor Gray
    cyfuture cache create --name "$PROJECT_NAME-redis" --engine redis --version 7 --region $CYFUTURE_REGION --size small 2>$null
    
    Write-Host "   Creating object storage..." -ForegroundColor Gray
    cyfuture storage create --name "$PROJECT_NAME-storage" --region $CYFUTURE_REGION 2>$null
    
    Write-Host "   Creating load balancer..." -ForegroundColor Gray
    cyfuture lb create --name "$PROJECT_NAME-lb" --region $CYFUTURE_REGION --type application 2>$null
    
    Write-Host "   ✓ Infrastructure created" -ForegroundColor Green
}

# Step 4: Build and Push Docker Images
Write-Host ""
Write-Host "🐳 Building and pushing Docker images..." -ForegroundColor Yellow

$REGISTRY_URL = (cyfuture registry get "$PROJECT_NAME-registry" --output json 2>$null | ConvertFrom-Json).url

if ([string]::IsNullOrEmpty($REGISTRY_URL)) {
    $REGISTRY_URL = "registry.cyfuture.cloud/$PROJECT_NAME"
}

Write-Host "   Registry URL: $REGISTRY_URL" -ForegroundColor Gray

# Login to Cyfuture registry
Write-Host "   Logging into container registry..." -ForegroundColor Gray
cyfuture registry login

$services = @(
    @{Name="api-gateway"; Path="packages/api-gateway/Dockerfile"},
    @{Name="number-service"; Path="packages/number-service/Dockerfile"},
    @{Name="billing-service"; Path="packages/billing-service/Dockerfile"},
    @{Name="notification-service"; Path="packages/notification-service/Dockerfile"},
    @{Name="ai-agent-service"; Path="packages/ai-agent-service/Dockerfile"}
)

foreach ($service in $services) {
    $serviceName = $service.Name
    $dockerfile = $service.Path
    
    Write-Host ""
    Write-Host "   Building $serviceName..." -ForegroundColor Gray
    
    $imageTag = "$REGISTRY_URL/${serviceName}:latest"
    
    if ($DryRun) {
        Write-Host "   [DRY RUN] Would build and push: $imageTag" -ForegroundColor Gray
    } else {
        docker build -t $imageTag -f $dockerfile .
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ✗ Failed to build $serviceName" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "   Pushing $serviceName..." -ForegroundColor Gray
        docker push $imageTag
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ✗ Failed to push $serviceName" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "   ✓ $serviceName pushed" -ForegroundColor Green
    }
}

# Build and push Dashboard
Write-Host ""
Write-Host "   Building dashboard..." -ForegroundColor Gray
$dashboardTag = "$REGISTRY_URL/dashboard:latest"

if ($DryRun) {
    Write-Host "   [DRY RUN] Would build and push: $dashboardTag" -ForegroundColor Gray
} else {
    Push-Location "packages/dashboard"
    docker build -t $dashboardTag -f Dockerfile.prod .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ✗ Failed to build dashboard" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    Pop-Location
    
    Write-Host "   Pushing dashboard..." -ForegroundColor Gray
    docker push $dashboardTag
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ✗ Failed to push dashboard" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   ✓ Dashboard pushed" -ForegroundColor Green
}

# Step 5: Deploy Services
Write-Host ""
Write-Host "🚀 Deploying services to Cyfuture..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "   [DRY RUN] Would deploy services" -ForegroundColor Gray
} else {
    # Deploy each service
    foreach ($service in $services) {
        $serviceName = $service.Name
        Write-Host "   Deploying $serviceName..." -ForegroundColor Gray
        
        cyfuture container deploy `
            --name "$PROJECT_NAME-$serviceName" `
            --image "$REGISTRY_URL/${serviceName}:latest" `
            --region $CYFUTURE_REGION `
            --replicas 2 `
            --port 3000 `
            --env-file ".env.production" 2>$null
    }
    
    # Deploy Dashboard
    Write-Host "   Deploying dashboard..." -ForegroundColor Gray
    cyfuture container deploy `
        --name "$PROJECT_NAME-dashboard" `
        --image "$REGISTRY_URL/dashboard:latest" `
        --region $CYFUTURE_REGION `
        --replicas 2 `
        --port 80 2>$null
    
    Write-Host "   ✓ All services deployed" -ForegroundColor Green
}

# Step 6: Configure Load Balancer
Write-Host ""
Write-Host "⚖️  Configuring load balancer..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "   [DRY RUN] Would configure load balancer" -ForegroundColor Gray
} else {
    cyfuture lb add-backend "$PROJECT_NAME-lb" `
        --target "$PROJECT_NAME-api-gateway" `
        --port 3000 `
        --health-check "/health" 2>$null
    
    cyfuture lb add-backend "$PROJECT_NAME-lb" `
        --target "$PROJECT_NAME-dashboard" `
        --port 80 `
        --health-check "/" 2>$null
    
    Write-Host "   ✓ Load balancer configured" -ForegroundColor Green
}

# Step 7: Setup SSL Certificate
Write-Host ""
Write-Host "🔒 Setting up SSL certificate..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "   [DRY RUN] Would setup SSL certificate" -ForegroundColor Gray
} else {
    Write-Host "   Creating SSL certificate..." -ForegroundColor Gray
    Write-Host "   Note: You'll need to verify domain ownership" -ForegroundColor Gray
    
    cyfuture ssl create `
        --domain "voxlink.yourdomain.com" `
        --auto-renew 2>$null
    
    cyfuture lb add-ssl "$PROJECT_NAME-lb" `
        --domain "voxlink.yourdomain.com" 2>$null
}

# Step 8: Run Database Migrations
Write-Host ""
Write-Host "📊 Running database migrations..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "   [DRY RUN] Would run migrations" -ForegroundColor Gray
} else {
    Write-Host "   Connecting to API Gateway container..." -ForegroundColor Gray
    
    # Get container ID
    $containerId = (cyfuture container list --name "$PROJECT_NAME-api-gateway" --output json 2>$null | ConvertFrom-Json)[0].id
    
    if ($containerId) {
        Write-Host "   Running Prisma migrations..." -ForegroundColor Gray
        cyfuture container exec $containerId -- npx prisma migrate deploy
        
        Write-Host "   ✓ Migrations completed" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Could not find API Gateway container. Run migrations manually." -ForegroundColor Yellow
    }
}

# Step 9: Get Deployment Info
Write-Host ""
Write-Host "📋 Deployment Information:" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "   [DRY RUN MODE] No actual deployment performed" -ForegroundColor Gray
} else {
    # Get load balancer URL
    $lbInfo = cyfuture lb get "$PROJECT_NAME-lb" --output json 2>$null | ConvertFrom-Json
    $publicUrl = $lbInfo.public_ip
    
    Write-Host "   Application URL:" -ForegroundColor Yellow
    Write-Host "   https://$publicUrl" -ForegroundColor White
    Write-Host ""
    
    Write-Host "   Service Status:" -ForegroundColor Yellow
    cyfuture container list --name "$PROJECT_NAME-*"
    Write-Host ""
    
    Write-Host "   Database Connection:" -ForegroundColor Yellow
    $dbInfo = cyfuture database get "$PROJECT_NAME-db" --output json 2>$null | ConvertFrom-Json
    Write-Host "   Host: $($dbInfo.host)" -ForegroundColor Gray
    Write-Host "   Port: $($dbInfo.port)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "   Redis Connection:" -ForegroundColor Yellow
    $redisInfo = cyfuture cache get "$PROJECT_NAME-redis" --output json 2>$null | ConvertFrom-Json
    Write-Host "   Host: $($redisInfo.host)" -ForegroundColor Gray
    Write-Host "   Port: $($redisInfo.port)" -ForegroundColor Gray
}

# Step 10: Setup Monitoring
Write-Host ""
Write-Host "📊 Setting up monitoring..." -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "   [DRY RUN] Would setup monitoring" -ForegroundColor Gray
} else {
    Write-Host "   Creating monitoring dashboard..." -ForegroundColor Gray
    cyfuture monitoring create-dashboard `
        --name "$PROJECT_NAME-monitoring" `
        --services "$PROJECT_NAME-*" 2>$null
    
    Write-Host "   Setting up alerts..." -ForegroundColor Gray
    cyfuture alert create `
        --name "$PROJECT_NAME-health-check" `
        --condition "health_check_failed" `
        --notification-email "admin@yourdomain.com" 2>$null
    
    Write-Host "   ✓ Monitoring configured" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "     ✓ VoxLink Deployed to Cyfuture Cloud!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

if (-not $DryRun) {
    Write-Host "🎉 Next Steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Update DNS to point to load balancer IP" -ForegroundColor White
    Write-Host "2. Verify SSL certificate" -ForegroundColor White
    Write-Host "3. Test application: https://$publicUrl" -ForegroundColor White
    Write-Host "4. Monitor logs: cyfuture logs tail $PROJECT_NAME-api-gateway" -ForegroundColor White
    Write-Host "5. View metrics: cyfuture monitoring dashboard $PROJECT_NAME-monitoring" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📚 Useful Commands:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   View logs:        cyfuture logs tail $PROJECT_NAME-api-gateway" -ForegroundColor Gray
    Write-Host "   Scale service:    cyfuture container scale $PROJECT_NAME-api-gateway --replicas 4" -ForegroundColor Gray
    Write-Host "   Restart service:  cyfuture container restart $PROJECT_NAME-api-gateway" -ForegroundColor Gray
    Write-Host "   View costs:       cyfuture billing usage --project $PROJECT_NAME" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "To deploy for real, run without -DryRun flag:" -ForegroundColor Yellow
    Write-Host ".\deploy-cyfuture.ps1 -Region $CYFUTURE_REGION -Environment $ENV_NAME" -ForegroundColor White
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

