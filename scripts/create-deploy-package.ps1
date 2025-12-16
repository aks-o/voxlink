# VoxLink Deployment Package Creator
# Run this script on your Windows machine to create the deployment zip

Write-Host "Creating VoxLink Deployment Package..." -ForegroundColor Blue
Write-Host "======================================="

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$zipName = "voxlink-deploy-$timestamp.zip"

# Files and folders to include
$includeItems = @(
    "packages",
    "infrastructure", 
    "scripts",
    "docker-compose.yml",
    "package.json",
    "package-lock.json",
    "ecosystem.config.js",
    ".env.production",
    ".env.example",
    "tsconfig.json"
)

Write-Host ""
Write-Host "Including:" -ForegroundColor Yellow
foreach ($item in $includeItems) {
    if (Test-Path $item) {
        Write-Host "   + $item" -ForegroundColor Green
    } else {
        Write-Host "   - $item (not found)" -ForegroundColor Red
    }
}

# Create temporary staging directory
$stagingDir = "deploy-staging"
if (Test-Path $stagingDir) {
    Remove-Item -Recurse -Force $stagingDir
}
New-Item -ItemType Directory -Path $stagingDir | Out-Null

# Copy files to staging
Write-Host ""
Write-Host "Copying files to staging..." -ForegroundColor Yellow
foreach ($item in $includeItems) {
    if (Test-Path $item) {
        $destination = Join-Path $stagingDir $item
        if ((Get-Item $item).PSIsContainer) {
            Copy-Item -Recurse -Path $item -Destination $destination
            # Remove node_modules if copied
            $nodeModulesPath = Join-Path $destination "node_modules"
            if (Test-Path $nodeModulesPath) {
                Remove-Item -Recurse -Force $nodeModulesPath
            }
            # Remove dist if copied
            $distPath = Join-Path $destination "dist"
            if (Test-Path $distPath) {
                Remove-Item -Recurse -Force $distPath
            }
        } else {
            Copy-Item -Path $item -Destination $destination
        }
    }
}

# Create the zip
Write-Host ""
Write-Host "Creating zip archive..." -ForegroundColor Yellow
if (Test-Path $zipName) {
    Remove-Item $zipName
}
Compress-Archive -Path "$stagingDir\*" -DestinationPath $zipName -CompressionLevel Optimal

# Cleanup staging
Remove-Item -Recurse -Force $stagingDir

# Get file size
$size = (Get-Item $zipName).Length / 1MB
$sizeFormatted = "{0:N2}" -f $size

Write-Host ""
Write-Host "Deployment package created!" -ForegroundColor Green
Write-Host "   File: $zipName" -ForegroundColor Cyan
Write-Host "   Size: $sizeFormatted MB" -ForegroundColor Cyan

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Blue
Write-Host "   1. Upload $zipName to Cyfuture server using WinSCP"
Write-Host "   2. SSH to server and extract the zip"
Write-Host "   3. Configure .env with production values"
Write-Host "   4. Run deploy-cyfuture.sh"
Write-Host ""
