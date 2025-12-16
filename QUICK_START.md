# 🚀 VoxLink Quick Start Guide

Get VoxLink running in **5 minutes**!

---

## Option 1: Fastest Way (No Docker) ⚡

### One Command Deployment

```powershell
cd D:\VoxLink
.\deploy-local.ps1
```

**That's it!** The script will:
1. ✅ Check prerequisites
2. ✅ Install dependencies
3. ✅ Build all services
4. ✅ Generate Prisma clients
5. ✅ Create .env file
6. ✅ Start all services

### Access Your App

```
Dashboard:    http://localhost:5173
API Gateway:  http://localhost:3000
```

### Stop Services

Press `Ctrl + C` in the terminal

---

## Option 2: With Docker 🐳

### Prerequisites
- Docker Desktop running

### Deploy

```powershell
cd D:\VoxLink
.\deploy-local.ps1 -WithDocker
```

### Stop

```powershell
docker-compose down
```

---

## Script Options

```powershell
# Skip build (use existing)
.\deploy-local.ps1 -SkipBuild

# Production mode
.\deploy-local.ps1 -Production

# With Docker
.\deploy-local.ps1 -WithDocker

# All options combined
.\deploy-local.ps1 -WithDocker -SkipBuild
```

---

## Troubleshooting

### Port Already in Use

```powershell
# Find and kill process
netstat -ano | findstr :5173
taskkill /PID <process-id> /F
```

### Docker Not Starting

```powershell
# Check Docker is running
docker ps

# If not, start Docker Desktop from Start Menu
```

### Build Errors

```powershell
# Clean and rebuild
npm run clean
npm install
npm run build --workspaces
```

---

## What's Next?

1. **Configure API Keys** - Edit `.env` file with your Twilio, Stripe, etc.
2. **Run Tests** - `npm test`
3. **Deploy to Cloud** - See `DEPLOYMENT_GUIDE.md`

---

## Need Help?

- **Full Deployment Guide:** `DEPLOYMENT_GUIDE.md`
- **AWS Deployment:** `infrastructure/DEPLOYMENT.md`
- **Architecture:** `README.md`

---

**Happy Building! 🎉**

