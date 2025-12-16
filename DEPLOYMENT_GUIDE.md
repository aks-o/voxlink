# 🚀 VoxLink Deployment Guide

**Multiple deployment options for VoxLink microservices**

---

## 🎯 **Choose Your Deployment Platform**

### 1️⃣ **Railway** (Easiest - Recommended for Quick Testing)
**Cost:** $5-15/month | **Time:** 10 minutes

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Deploy database
railway add postgres
railway add redis
```

**Pros:** ✅ Easy, ✅ Fast, ✅ No infrastructure setup
**Cons:** ❌ Limited control, ❌ Not India-focused

---

### 2️⃣ **AWS ECS Fargate** (Enterprise-Grade)
**Cost:** ₹1,05,000/month (~$1,268) | **Time:** 45 minutes

```bash
# Follow detailed AWS deployment
# See: infrastructure/DEPLOYMENT.md
```

**Pros:** ✅ Scalable, ✅ Enterprise features, ✅ Global
**Cons:** ❌ Expensive, ❌ Complex setup

---

### 3️⃣ **DigitalOcean App Platform** (Budget-Friendly)
**Cost:** $54/month | **Time:** 20 minutes

```bash
# Create app spec
# See: https://docs.digitalocean.com/products/app-platform/
```

---

### 4️⃣ **Self-Hosted** (Most Control)
**Cost:** Server costs only | **Time:** 30 minutes

```bash
# Deploy to your own server
# See: SCRIPTS/deploy-self-hosted.sh
```

---

### 5️⃣ **Cyfuture Cloud** (Best for India)
**Cost:** ₹42,400/month (~$512) | **Time:** 25 minutes

**Manual Deployment Steps:**

#### Step 1: Cyfuture Account Setup
```bash
# Visit: https://cyfuture.com
# Create account
# Get API credentials
```

#### Step 2: Install Cyfuture CLI
```bash
# Download from: https://cli.cyfuture.com/download
# Or check their documentation for installation
```

#### Step 3: Infrastructure Setup
```bash
# Create VPC
cyfuture vpc create --name voxlink-vpc --region mumbai-1 --cidr 10.0.0.0/16

# Create PostgreSQL
cyfuture database create --name voxlink-db --engine postgres --version 15 --region mumbai-1 --size medium

# Create Redis
cyfuture cache create --name voxlink-redis --engine redis --version 7 --region mumbai-1 --size small

# Create Object Storage
cyfuture storage create --name voxlink-storage --region mumbai-1

# Create Load Balancer
cyfuture lb create --name voxlink-lb --region mumbai-1 --type application
```

#### Step 4: Build Application
```bash
cd D:\VoxLink

# Install dependencies
npm install

# Build all services
npm run build --workspaces

# Generate Prisma clients
cd packages/billing-service && npx prisma generate && cd ../..
cd packages/notification-service && npx prisma generate && cd ../..
cd packages/number-service && npx prisma generate && cd ../..
```

#### Step 5: Deploy Services
```bash
# Deploy API Gateway
cyfuture container deploy \
  --name voxlink-api-gateway \
  --image your-registry/api-gateway:latest \
  --region mumbai-1 \
  --replicas 2 \
  --port 3000

# Deploy Number Service
cyfuture container deploy \
  --name voxlink-number-service \
  --image your-registry/number-service:latest \
  --region mumbai-1 \
  --replicas 3 \
  --port 3001

# Deploy Billing Service
cyfuture container deploy \
  --name voxlink-billing-service \
  --image your-registry/billing-service:latest \
  --region mumbai-1 \
  --replicas 2 \
  --port 3002

# Deploy Notification Service
cyfuture container deploy \
  --name voxlink-notification-service \
  --image your-registry/notification-service:latest \
  --region mumbai-1 \
  --replicas 2 \
  --port 3003

# Deploy AI Agent Service
cyfuture container deploy \
  --name voxlink-ai-agent-service \
  --image your-registry/ai-agent-service:latest \
  --region mumbai-1 \
  --replicas 2 \
  --port 3004

# Deploy Dashboard
cyfuture container deploy \
  --name voxlink-dashboard \
  --image your-registry/dashboard:latest \
  --region mumbai-1 \
  --replicas 2 \
  --port 80
```

#### Step 6: Configure Load Balancer
```bash
# Add backends
cyfuture lb add-backend voxlink-lb --target voxlink-api-gateway --port 3000
cyfuture lb add-backend voxlink-lb --target voxlink-dashboard --port 80

# Setup SSL
cyfuture ssl create --domain yourdomain.in --auto-renew
cyfuture lb add-ssl voxlink-lb --domain yourdomain.in
```

---

## 🏆 **Recommended Approach**

### **For Production (India Market):**
1. **Railway** for quick testing ($5-15/month)
2. **Cyfuture Cloud** for production (₹42,400/month)
3. **AWS** for enterprise needs (₹1,05,000/month)

### **For Development:**
1. **Local deployment** (free)
2. **Railway** (easy testing)

---

## 📊 **Cost Comparison**

| Platform | Monthly Cost | Best For |
|----------|-------------|----------|
| **Local Dev** | Free | Development |
| **Railway** | $5-15 | Quick testing |
| **DigitalOcean** | $54 | Budget production |
| **Cyfuture** | ₹42,400 (~$512) | India production |
| **AWS** | ₹1,05,000 (~$1,268) | Enterprise |
| **Self-hosted** | Server costs | Full control |

---

## 🚀 **Quick Start Commands**

### **Railway (Easiest):**
```bash
npm install -g @railway/cli
railway login
cd D:\VoxLink
railway init
railway up
```

### **Local Testing:**
```bash
cd D:\VoxLink
.\deploy-local.ps1
# Open: http://localhost:5173
```

### **Cyfuture (India):**
```bash
# Follow manual steps above
# See: CYFUTURE_QUICK_START.md
```

---

## 📞 **Need Help?**

- **Railway:** https://docs.railway.app/
- **AWS:** infrastructure/DEPLOYMENT.md
- **Cyfuture:** https://cyfuture.com/support
- **Local:** QUICK_START.md

---

## 🎯 **Current Status**

✅ **All services built and working**
✅ **TypeScript compilation passing**
✅ **Prisma schemas configured**
✅ **Responsive design implemented**
✅ **Deployment scripts ready**

---

**Ready to deploy? Choose your platform above!** 🚀