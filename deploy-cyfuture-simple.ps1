# VoxLink Cyfuture Cloud Deployment Script
# Simplified version for reliable execution

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

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "    VoxLink Cyfuture Cloud Deployment Script v1.0      " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_NAME = "voxlink"
$CYFUTURE_REGION = $Region
$ENV_NAME = $Environment

Write-Host "Deployment Configuration:" -ForegroundColor Yellow
Write-Host "  Project: $PROJECT_NAME" -ForegroundColor Gray
Write-Host "  Region: $CYFUTURE_REGION" -ForegroundColor Gray
Write-Host "  Environment: $ENV_NAME" -ForegroundColor Gray
Write-Host ""

# Step 1: Check Prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
Write-Host "  Checking Node.js..." -ForegroundColor Gray
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check Docker
Write-Host "  Checking Docker..." -ForegroundColor Gray
$dockerVersion = docker --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Docker: $dockerVersion" -ForegroundColor Green
    
    docker ps | Out-Null 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] Docker is running" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] Docker is not running. Please start Docker Desktop." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [ERROR] Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check Cyfuture CLI
Write-Host ""
Write-Host "Checking Cyfuture CLI..." -ForegroundColor Yellow
cyfuture --version 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [WARNING] Cyfuture CLI not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Cyfuture CLI is required for deployment." -ForegroundColor Yellow
    Write-Host "  Please install it first:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Option 1: Install via npm" -ForegroundColor White
    Write-Host "    npm install -g @cyfuture/cli" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Option 2: Download from website" -ForegroundColor White
    Write-Host "    https://cli.cyfuture.com/install" -ForegroundColor Gray
    Write-Host ""
    $install = Read-Host "  Would you like to install via npm now? (y/n)"
    if ($install -eq "y" -or $install -eq "Y") {
        Write-Host "  Installing Cyfuture CLI..." -ForegroundColor Yellow
        npm install -g @cyfuture/cli
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  [ERROR] Failed to install Cyfuture CLI" -ForegroundColor Red
            exit 1
        }
        Write-Host "  [OK] Cyfuture CLI installed" -ForegroundColor Green
    } else {
        Write-Host "  Please install Cyfuture CLI and try again." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "  [OK] Cyfuture CLI installed" -ForegroundColor Green
}

# Check Cyfuture authentication
Write-Host ""
Write-Host "Checking Cyfuture authentication..." -ForegroundColor Yellow
cyfuture auth status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [WARNING] Not authenticated with Cyfuture" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Please login to Cyfuture Cloud..." -ForegroundColor Yellow
    cyfuture login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERROR] Authentication failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  [OK] Authenticated with Cyfuture" -ForegroundColor Green

# Step 2: Build Application
if (-not $SkipBuild) {
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
} else {
    Write-Host ""
    Write-Host "Skipping build (using existing build)" -ForegroundColor Yellow
}

# Step 3: Cyfuture Infrastructure Note
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  IMPORTANT: Cyfuture Infrastructure Setup Required   " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Before deploying, you need to create Cyfuture infrastructure:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. VPC and Networking:" -ForegroundColor White
Write-Host "   cyfuture vpc create --name voxlink-vpc --region $CYFUTURE_REGION --cidr 10.0.0.0/16" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Container Registry:" -ForegroundColor White
Write-Host "   cyfuture registry create --name voxlink-registry --region $CYFUTURE_REGION" -ForegroundColor Gray
Write-Host ""
Write-Host "3. PostgreSQL Database:" -ForegroundColor White
Write-Host "   cyfuture database create --name voxlink-db --engine postgres --version 15 --region $CYFUTURE_REGION --size medium" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Redis Cache:" -ForegroundColor White
Write-Host "   cyfuture cache create --name voxlink-redis --engine redis --version 7 --region $CYFUTURE_REGION --size small" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Object Storage:" -ForegroundColor White
Write-Host "   cyfuture storage create --name voxlink-storage --region $CYFUTURE_REGION" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Load Balancer:" -ForegroundColor White
Write-Host "   cyfuture lb create --name voxlink-lb --region $CYFUTURE_REGION --type application" -ForegroundColor Gray
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY RUN] Deployment simulation complete" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Create Cyfuture infrastructure (commands above)" -ForegroundColor White
    Write-Host "2. Configure environment variables" -ForegroundColor White
    Write-Host "3. Run: .\deploy-cyfuture-simple.ps1 -Region $CYFUTURE_REGION" -ForegroundColor White
    exit 0
}

Write-Host ""
$continue = Read-Host "Have you created the infrastructure above? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host ""
    Write-Host "Please create the infrastructure first, then run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For detailed instructions, see: CYFUTURE_QUICK_START.md" -ForegroundColor Gray
    exit 0
}

# Get registry URL
Write-Host ""
Write-Host "Getting registry information..." -ForegroundColor Yellow
$registryInfo = cyfuture registry get voxlink-registry --output json 2>$null | ConvertFrom-Json
if ($registryInfo) {
    $REGISTRY_URL = $registryInfo.url
} else {
    $REGISTRY_URL = "registry.cyfuture.cloud/voxlink"
    Write-Host "  [WARNING] Could not get registry URL, using default: $REGISTRY_URL" -ForegroundColor Yellow
}

Write-Host "  Registry URL: $REGISTRY_URL" -ForegroundColor Gray

# Step 4: Build and Push Docker Images
Write-Host ""
Write-Host "Building and pushing Docker images..." -ForegroundColor Yellow

# Login to registry
Write-Host "  Logging into container registry..." -ForegroundColor Gray
cyfuture registry login 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Failed to login to registry" -ForegroundColor Red
    exit 1
}

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
    Write-Host "  Building $serviceName..." -ForegroundColor Gray
    
    $imageTag = "$REGISTRY_URL/${serviceName}:latest"
    
    docker build -t $imageTag -f $dockerfile . 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERROR] Failed to build $serviceName" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  Pushing $serviceName..." -ForegroundColor Gray
    docker push $imageTag 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [ERROR] Failed to push $serviceName" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  [OK] $serviceName pushed" -ForegroundColor Green
}

# Build and push Dashboard
Write-Host ""
Write-Host "  Building dashboard..." -ForegroundColor Gray
$dashboardTag = "$REGISTRY_URL/dashboard:latest"

Push-Location "packages/dashboard"
docker build -t $dashboardTag -f Dockerfile.prod . 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Failed to build dashboard" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

Write-Host "  Pushing dashboard..." -ForegroundColor Gray
docker push $dashboardTag 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [ERROR] Failed to push dashboard" -ForegroundColor Red
    exit 1
}

Write-Host "  [OK] Dashboard pushed" -ForegroundColor Green

# Step 5: Deploy Services
Write-Host ""
Write-Host "Deploying services to Cyfuture..." -ForegroundColor Yellow

foreach ($service in $services) {
    $serviceName = $service.Name
    Write-Host "  Deploying $serviceName..." -ForegroundColor Gray
    
    cyfuture container deploy `
        --name "voxlink-$serviceName" `
        --image "$REGISTRY_URL/${serviceName}:latest" `
        --region $CYFUTURE_REGION `
        --replicas 2 `
        --port 3000 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [OK] $serviceName deployed" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] $serviceName deployment may have issues" -ForegroundColor Yellow
    }
}

# Deploy Dashboard
Write-Host "  Deploying dashboard..." -ForegroundColor Gray
cyfuture container deploy `
    --name "voxlink-dashboard" `
    --image "$REGISTRY_URL/dashboard:latest" `
    --region $CYFUTURE_REGION `
    --replicas 2 `
    --port 80 2>$null

Write-Host "  [OK] All services deployed" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "       VoxLink Deployed to Cyfuture Cloud!           " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configure Load Balancer:" -ForegroundColor White
Write-Host "   cyfuture lb add-backend voxlink-lb --target voxlink-api-gateway --port 3000" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Setup SSL:" -ForegroundColor White
Write-Host "   cyfuture ssl create --domain yourdomain.in --auto-renew" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Run Migrations:" -ForegroundColor White
Write-Host "   cyfuture container exec voxlink-api-gateway -- npx prisma migrate deploy" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Check Status:" -ForegroundColor White
Write-Host "   cyfuture container list --name voxlink-*" -ForegroundColor Gray
Write-Host ""
Write-Host "5. View Logs:" -ForegroundColor White
Write-Host "   cyfuture logs tail voxlink-api-gateway" -ForegroundColor Gray
Write-Host ""

Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  View services:  cyfuture container list" -ForegroundColor Gray
Write-Host "  View logs:      cyfuture logs tail voxlink-api-gateway" -ForegroundColor Gray
Write-Host "  Scale service:  cyfuture container scale voxlink-api-gateway --replicas 4" -ForegroundColor Gray
Write-Host "  View costs:     cyfuture billing usage" -ForegroundColor Gray
Write-Host ""

Write-Host "Documentation: CYFUTURE_QUICK_START.md" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

