# VoxLink Platform Backup Script - Simple Version
param(
    [string]$BackupName = "voxlink-telecom-platform-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')",
    [string]$BackupPath = "../backups"
)

Write-Host "🚀 Creating VoxLink Platform Backup..." -ForegroundColor Green
Write-Host "Backup Name: $BackupName" -ForegroundColor Yellow

# Create backup directory
$FullBackupPath = Join-Path $BackupPath $BackupName
New-Item -ItemType Directory -Path $FullBackupPath -Force | Out-Null

# Create backup info file
$BackupInfo = @"
# VoxLink Platform Backup
**Created:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
**Platform Version:** Telecom/Virtual Phone Number Platform
**Status:** Pre-Pivot Backup (Before WhatsApp Business Platform)

## What's Included:
- Complete source code (all packages)
- Infrastructure configurations
- Database schemas and migrations  
- Test suites and documentation
- Kiro specs and design documents
- Deployment configurations
- All configuration files

## Platform Features (At Backup Time):
- Virtual Phone Number Management
- AI Voice Agents
- Multi-provider Integration (Airtel, Jio, BSNL, Vi, Twilio)
- Regional Pricing (India-focused)
- Real-time Dashboard
- Call Analytics & Reporting
- Billing & Subscription Management
- Multi-tenant Architecture

## Next Steps After Restore:
1. Run: npm install
2. Copy .env.example to .env and configure
3. Run: npm run dev
4. See README.md for full setup instructions

## Business Context:
This backup was created before pivoting from telecom platform to WhatsApp Business platform
due to DoT/TRAI licensing requirements (₹50 crore investment).

The codebase is 80% complete and production-ready for telecom use case.
"@

$BackupInfo | Out-File -FilePath (Join-Path $FullBackupPath "BACKUP_INFO.md") -Encoding UTF8

Write-Host "📦 Copying files..." -ForegroundColor Blue

# Copy directories
$directories = @("packages", "infrastructure", "tests", "scripts", ".kiro", ".github")
foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "  📁 $dir/" -ForegroundColor Cyan
        Copy-Item -Path $dir -Destination $FullBackupPath -Recurse -Force
        
        # Clean up node_modules and build artifacts
        Get-ChildItem -Path (Join-Path $FullBackupPath $dir) -Name "node_modules" -Recurse -Directory | ForEach-Object {
            Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
        Get-ChildItem -Path (Join-Path $FullBackupPath $dir) -Name "dist" -Recurse -Directory | ForEach-Object {
            Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
        Get-ChildItem -Path (Join-Path $FullBackupPath $dir) -Name "build" -Recurse -Directory | ForEach-Object {
            Remove-Item -Path $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# Copy docker directory if exists
if (Test-Path "docker") {
    Write-Host "  📁 docker/" -ForegroundColor Cyan
    Copy-Item -Path "docker" -Destination $FullBackupPath -Recurse -Force
}

# Copy root files
$rootFiles = @("*.md", "*.json", "*.js", "*.ts", "*.yml", "*.yaml", ".env*", "docker-compose.yml", "Dockerfile*", ".eslintrc.js", ".gitignore")
foreach ($pattern in $rootFiles) {
    Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "  📄 $($_.Name)" -ForegroundColor Gray
        Copy-Item -Path $_.FullName -Destination $FullBackupPath -Force
    }
}

# Create restoration script
$RestoreScript = @"
# VoxLink Platform Restoration Script
# Run this script to restore the platform

Write-Host "🔄 Restoring VoxLink Platform..." -ForegroundColor Green

# Copy all files to current directory
Copy-Item -Path ".\*" -Destination "..\restored-voxlink" -Recurse -Force

Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. cd ..\restored-voxlink"
Write-Host "2. npm install"
Write-Host "3. cp .env.example .env"
Write-Host "4. Edit .env with your configuration"
Write-Host "5. npm run dev"

Write-Host "✅ Platform restored successfully!" -ForegroundColor Green
Write-Host "See BACKUP_INFO.md for more details" -ForegroundColor Blue
"@

$RestoreScript | Out-File -FilePath (Join-Path $FullBackupPath "restore.ps1") -Encoding UTF8

# Create compressed archive
Write-Host "🗜️ Creating compressed archive..." -ForegroundColor Blue
$ZipPath = "$FullBackupPath.zip"
Compress-Archive -Path $FullBackupPath -DestinationPath $ZipPath -Force

# Calculate sizes
$FolderSize = (Get-ChildItem -Path $FullBackupPath -Recurse | Measure-Object -Property Length -Sum).Sum
$ZipSize = (Get-Item $ZipPath).Length

Write-Host ""
Write-Host "✅ Backup Created Successfully!" -ForegroundColor Green
Write-Host "📁 Folder: $FullBackupPath" -ForegroundColor Cyan
Write-Host "📦 Archive: $ZipPath" -ForegroundColor Cyan
Write-Host "📊 Folder Size: $([math]::Round($FolderSize/1MB, 2)) MB" -ForegroundColor Yellow
Write-Host "📊 Archive Size: $([math]::Round($ZipSize/1MB, 2)) MB" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 Ready for platform pivot!" -ForegroundColor Magenta