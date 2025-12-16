# Deploy Next.js App to Cyfuture Cloud
# For: quarry-to-crusher-frontend or any Next.js application

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectPath,
    
    [Parameter()]
    [string]$ProjectName = "quarry-crusher",
    
    [Parameter()]
    [string]$Region = "mumbai-1"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Deploy Next.js App to Cyfuture Cloud" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Project: $ProjectName" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Path: $ProjectPath" -ForegroundColor Yellow
Write-Host ""

# Check if project exists
if (-not (Test-Path $ProjectPath)) {
    Write-Host "[ERROR] Project path not found: $ProjectPath" -ForegroundColor Red
    exit 1
}

# Navigate to project
Set-Location $ProjectPath

# Check for package.json
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] package.json not found in project directory" -ForegroundColor Red
    exit 1
}

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

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Dependencies installed" -ForegroundColor Green

# Build Next.js app
Write-Host ""
Write-Host "Building Next.js application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Build completed" -ForegroundColor Green

# Create Dockerfile if it doesn't exist
if (-not (Test-Path "Dockerfile")) {
    Write-Host ""
    Write-Host "Creating Dockerfile..." -ForegroundColor Yellow
    
    @"
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
"@ | Out-File -FilePath "Dockerfile" -Encoding utf8
    
    Write-Host "  [OK] Dockerfile created" -ForegroundColor Green
}

# Update next.config.js for standalone output
Write-Host ""
Write-Host "Checking Next.js configuration..." -ForegroundColor Yellow
$nextConfig = Get-Content "next.config.js" -Raw 2>$null
if ($nextConfig -notmatch "output.*standalone") {
    Write-Host "  [WARNING] Add 'output: standalone' to next.config.js for Docker deployment" -ForegroundColor Yellow
}

# Login to Cyfuture
Write-Host ""
Write-Host "Logging into Cyfuture..." -ForegroundColor Yellow
cyfuture auth status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    cyfuture login
}

# Create container registry if needed
Write-Host ""
Write-Host "Setting up container registry..." -ForegroundColor Yellow
cyfuture registry create --name "$ProjectName-registry" --region $Region 2>$null
$registryInfo = cyfuture registry get "$ProjectName-registry" --output json 2>$null | ConvertFrom-Json
if ($registryInfo) {
    $REGISTRY_URL = $registryInfo.url
} else {
    $REGISTRY_URL = "registry.cyfuture.cloud/$ProjectName"
}
Write-Host "  Registry: $REGISTRY_URL" -ForegroundColor Gray

# Build Docker image
Write-Host ""
Write-Host "Building Docker image..." -ForegroundColor Yellow
$imageTag = "${REGISTRY_URL}/app:latest"
docker build -t $imageTag .
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker build failed" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Image built" -ForegroundColor Green

# Push to registry
Write-Host ""
Write-Host "Pushing to Cyfuture registry..." -ForegroundColor Yellow
cyfuture registry login 2>$null
docker push $imageTag
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Push failed" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Image pushed" -ForegroundColor Green

# Deploy to Cyfuture
Write-Host ""
Write-Host "Deploying to Cyfuture Cloud..." -ForegroundColor Yellow
cyfuture container deploy `
    --name "$ProjectName" `
    --image $imageTag `
    --region $Region `
    --replicas 2 `
    --port 3000 `
    --env NODE_ENV=production
    
if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK] Deployment successful" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] Deployment may have issues" -ForegroundColor Yellow
}

# Setup load balancer
Write-Host ""
Write-Host "Setting up load balancer..." -ForegroundColor Yellow
cyfuture lb create --name "$ProjectName-lb" --region $Region --type application 2>$null
cyfuture lb add-backend "$ProjectName-lb" --target $ProjectName --port 3000 2>$null

# Get deployment info
Write-Host ""
Write-Host "========================================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host ""

$lbInfo = cyfuture lb get "$ProjectName-lb" --output json 2>$null | ConvertFrom-Json
if ($lbInfo) {
    Write-Host "Application URL: https://$($lbInfo.public_ip)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs:    cyfuture logs tail $ProjectName" -ForegroundColor Gray
Write-Host "  Scale app:    cyfuture container scale $ProjectName --replicas 4" -ForegroundColor Gray
Write-Host "  Restart:      cyfuture container restart $ProjectName" -ForegroundColor Gray
Write-Host ""

