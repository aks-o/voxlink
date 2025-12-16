# 📦 VoxLink Platform Backup Guide

## Overview
This guide helps you create a complete backup of your VoxLink telecom platform before pivoting to the WhatsApp Business model.

## Why Create a Backup?
- **Preserve Investment**: Your telecom platform is 80% complete and production-ready
- **Future Opportunities**: Telecom licensing may become feasible later
- **Code Reuse**: Many components can be repurposed for other projects
- **Safety Net**: Always have a working version to fall back to

## Quick Backup (Recommended)

### Windows (PowerShell)
```powershell
# Run the backup script
.\scripts\create-backup.ps1

# Or with custom name
.\scripts\create-backup.ps1 -BackupName "voxlink-v1-final" -BackupPath "C:\Backups"
```

### Linux/Mac (Bash)
```bash
# Make script executable
chmod +x scripts/create-backup.sh

# Run the backup script
./scripts/create-backup.sh

# Or with custom name
./scripts/create-backup.sh "voxlink-v1-final" "/path/to/backups"
```

## What Gets Backed Up

### ✅ Included
- **Source Code**: All packages (api-gateway, billing-service, number-service, etc.)
- **Infrastructure**: Terraform, Docker, ECS configurations
- **Tests**: Unit, integration, e2e test suites
- **Documentation**: All .md files, specs, guides
- **Configuration**: Environment files, Docker compose
- **Kiro Specs**: All feature specifications and designs
- **Deployment**: CI/CD workflows, deployment scripts

### ❌ Excluded
- `node_modules` directories
- Build artifacts (`dist`, `build`)
- Log files
- Git history (to reduce size)
- Temporary files

## Backup Structure
```
voxlink-telecom-platform-backup-2024-12-22-1430/
├── BACKUP_INFO.md              # Backup metadata and instructions
├── restore.ps1 / restore.sh    # Restoration script
├── packages/                   # All microservices
│   ├── api-gateway/
│   ├── billing-service/
│   ├── number-service/
│   ├── dashboard/
│   └── shared/
├── infrastructure/             # Deployment configs
├── tests/                     # Test suites
├── .kiro/                     # Kiro specifications
├── scripts/                   # Utility scripts
└── [all root config files]
```

## Restoration Process

### 1. Extract Backup
```bash
# From compressed archive
tar -xzf voxlink-telecom-platform-backup-2024-12-22-1430.tar.gz
# or
unzip voxlink-telecom-platform-backup-2024-12-22-1430.zip
```

### 2. Run Restoration Script
```bash
cd voxlink-telecom-platform-backup-2024-12-22-1430
./restore.sh  # Linux/Mac
# or
.\restore.ps1  # Windows
```

### 3. Setup Environment
```bash
cd ../restored-voxlink
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

## Manual Backup (Alternative)

If you prefer manual backup:

```bash
# Create backup directory
mkdir ../voxlink-backup-$(date +%Y%m%d)
cd ../voxlink-backup-$(date +%Y%m%d)

# Copy essential directories
cp -r ../VoxLink/packages .
cp -r ../VoxLink/infrastructure .
cp -r ../VoxLink/tests .
cp -r ../VoxLink/.kiro .
cp -r ../VoxLink/scripts .

# Copy root files
cp ../VoxLink/*.md .
cp ../VoxLink/*.json .
cp ../VoxLink/docker-compose.yml .
cp ../VoxLink/.env.example .

# Create archive
tar -czf ../voxlink-backup-$(date +%Y%m%d).tar.gz .
```

## Storage Recommendations

### Local Storage
- **Location**: External drive or separate partition
- **Multiple Copies**: Keep 2-3 backup versions
- **Naming**: Use timestamps for easy identification

### Cloud Storage
- **Google Drive**: Upload compressed archive
- **GitHub**: Private repository (if under size limits)
- **AWS S3**: Cost-effective for long-term storage
- **Dropbox**: Easy sharing and access

### Expected Sizes
- **Uncompressed**: ~50-100 MB
- **Compressed**: ~15-30 MB
- **With node_modules**: ~500+ MB (not recommended)

## Backup Verification

After creating backup, verify it contains:

```bash
# Check key directories exist
ls -la packages/
ls -la infrastructure/
ls -la tests/
ls -la .kiro/

# Verify package.json files
find . -name "package.json" -type f

# Check for environment files
ls -la *.env*

# Verify documentation
ls -la *.md
```

## Recovery Scenarios

### Scenario 1: Return to Telecom Platform
- Extract backup
- Run restoration script
- Update dependencies: `npm update`
- Resume development from backup point

### Scenario 2: Code Reuse for New Project
- Extract specific packages needed
- Adapt shared components
- Reuse infrastructure configurations
- Leverage existing test patterns

### Scenario 3: Reference Implementation
- Keep as documentation
- Study architecture patterns
- Reference for similar projects
- Training material for team

## Best Practices

### Before Backup
- [ ] Commit any pending changes
- [ ] Update documentation
- [ ] Clean up temporary files
- [ ] Test that platform runs correctly

### After Backup
- [ ] Verify backup integrity
- [ ] Test restoration process
- [ ] Store in multiple locations
- [ ] Document backup location and date

### Maintenance
- [ ] Create new backups at major milestones
- [ ] Clean up old backups periodically
- [ ] Update backup scripts as needed
- [ ] Test restoration process regularly

## Troubleshooting

### Common Issues

**Permission Errors**
```bash
# Fix permissions
chmod +x scripts/create-backup.sh
chmod +x restore.sh
```

**Large File Sizes**
```bash
# Check for node_modules
find . -name "node_modules" -type d
# Remove if found
rm -rf packages/*/node_modules
```

**Missing Files**
```bash
# Verify source files exist
ls -la packages/
ls -la infrastructure/
```

## Next Steps After Backup

1. **Verify Backup**: Test restoration process
2. **Secure Storage**: Store in multiple safe locations  
3. **Document Location**: Note where backup is stored
4. **Begin Pivot**: Start WhatsApp Business platform development
5. **Preserve Knowledge**: Keep team familiar with telecom codebase

## Support

If you encounter issues:
1. Check file permissions
2. Verify disk space
3. Review error messages
4. Test with smaller backup first
5. Contact development team

---

**Remember**: This backup preserves months of development work. Take time to verify it's complete and accessible before proceeding with platform changes.