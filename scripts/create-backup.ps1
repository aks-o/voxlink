# VoxLink Platform Backup Script
# Creates a complete backup of the current platform state

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

# Files and directories to include in backup
$IncludeItems = @(
    "packages",
    "infrastructure", 
    "tests",
    "scripts",
    ".kiro",
    ".github",
    "docker",
    "*.md",
    "*.json",
    "*.js",
    "*.ts",
    "*.yml",
    "*.yaml",
    "*.env*",
    "docker-compose.yml",
    "Dockerfile*",
    ".eslintrc.js",
    ".gitignore"
)

# Files and directories to exclude
$ExcludeItems = @(
    "node_modules",
    "dist",
    "build", 
    ".git",
    "*.log",
    "coverage",
    ".nyc_output",
    "tmp",
    "temp"
)

Write-Host "📦 Copying files..." -ForegroundColor Blue

# Copy each included item
foreach ($item in $IncludeItems) {
    $sourcePath = $item
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $FullBackupPath $item
        
        if (Test-Path $sourcePath -PathType Container) {
            # It's a directory
            Write-Host "  📁 $item/" -ForegroundColor Cyan
            Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
            
            # Remove excluded items from copied directory
            foreach ($exclude in $ExcludeItems) {
                $excludePath = Join-Path $destPath $exclude
                if (Test-Path $excludePath) {
                    Remove-Item -Path $excludePath -Recurse -Force -ErrorAction SilentlyContinue
                }
            }
        } else {
            # It's a file or pattern
            Write-Host "  📄 $item" -ForegroundColor Gray
            Copy-Item -Path $sourcePath -Destination $FullBackupPath -Force -ErrorAction SilentlyContinue
        }
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