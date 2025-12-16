#!/bin/bash
# VoxLink Platform Backup Script (Linux/Mac)
# Creates a complete backup of the current platform state

BACKUP_NAME=${1:-"voxlink-telecom-platform-backup-$(date +%Y-%m-%d-%H%M)"}
BACKUP_PATH=${2:-"../backups"}

echo "🚀 Creating VoxLink Platform Backup..."
echo "Backup Name: $BACKUP_NAME"

# Create backup directory
FULL_BACKUP_PATH="$BACKUP_PATH/$BACKUP_NAME"
mkdir -p "$FULL_BACKUP_PATH"

# Create backup info file
cat > "$FULL_BACKUP_PATH/BACKUP_INFO.md" << EOF
# VoxLink Platform Backup
**Created:** $(date '+%Y-%m-%d %H:%M:%S')
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
EOF

echo "📦 Copying files..."

# Copy important directories and files
rsync -av --progress \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.git' \
  --exclude='*.log' \
  --exclude='coverage' \
  --exclude='.nyc_output' \
  --exclude='tmp' \
  --exclude='temp' \
  packages/ "$FULL_BACKUP_PATH/packages/"

rsync -av --progress infrastructure/ "$FULL_BACKUP_PATH/infrastructure/"
rsync -av --progress tests/ "$FULL_BACKUP_PATH/tests/"
rsync -av --progress scripts/ "$FULL_BACKUP_PATH/scripts/"
rsync -av --progress .kiro/ "$FULL_BACKUP_PATH/.kiro/"
rsync -av --progress .github/ "$FULL_BACKUP_PATH/.github/"

# Copy root files
cp *.md "$FULL_BACKUP_PATH/" 2>/dev/null || true
cp *.json "$FULL_BACKUP_PATH/" 2>/dev/null || true
cp *.js "$FULL_BACKUP_PATH/" 2>/dev/null || true
cp *.ts "$FULL_BACKUP_PATH/" 2>/dev/null || true
cp *.yml "$FULL_BACKUP_PATH/" 2>/dev/null || true
cp *.yaml "$FULL_BACKUP_PATH/" 2>/dev/null || true
cp .env* "$FULL_BACKUP_PATH/" 2>/dev/null || true
cp docker-compose.yml "$FULL_BACKUP_PATH/" 2>/dev/null || true
cp Dockerfile* "$FULL_BACKUP_PATH/" 2>/dev/null || true
cp .eslintrc.js "$FULL_BACKUP_PATH/" 2>/dev/null || true
cp .gitignore "$FULL_BACKUP_PATH/" 2>/dev/null || true

# Copy docker directory if exists
if [ -d "docker" ]; then
    rsync -av --progress docker/ "$FULL_BACKUP_PATH/docker/"
fi

# Create restoration script
cat > "$FULL_BACKUP_PATH/restore.sh" << 'EOF'
#!/bin/bash
# VoxLink Platform Restoration Script
# Run this script to restore the platform

echo "🔄 Restoring VoxLink Platform..."

# Copy all files to current directory
cp -r ./* ../restored-voxlink/

echo "📋 Next Steps:"
echo "1. cd ../restored-voxlink"
echo "2. npm install"
echo "3. cp .env.example .env"
echo "4. Edit .env with your configuration"
echo "5. npm run dev"

echo "✅ Platform restored successfully!"
echo "See BACKUP_INFO.md for more details"
EOF

chmod +x "$FULL_BACKUP_PATH/restore.sh"

# Create compressed archive
echo "🗜️ Creating compressed archive..."
ZIP_PATH="$FULL_BACKUP_PATH.tar.gz"
tar -czf "$ZIP_PATH" -C "$BACKUP_PATH" "$BACKUP_NAME"

# Calculate sizes
FOLDER_SIZE=$(du -sh "$FULL_BACKUP_PATH" | cut -f1)
ZIP_SIZE=$(du -sh "$ZIP_PATH" | cut -f1)

echo ""
echo "✅ Backup Created Successfully!"
echo "📁 Folder: $FULL_BACKUP_PATH"
echo "📦 Archive: $ZIP_PATH"
echo "📊 Folder Size: $FOLDER_SIZE"
echo "📊 Archive Size: $ZIP_SIZE"
echo ""
echo "🎯 Ready for platform pivot!"