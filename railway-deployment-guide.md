# 🚂 VoxLink Railway Deployment Guide

**Easiest & Cheapest Deployment - $5-15/month**

---

## 🎯 **Railway Deployment Steps**

### **Step 1: Account Setup**
1. Go to: https://railway.app
2. Sign up/Login with GitHub (recommended)
3. Verify your email

### **Step 2: Create Project**
1. Click **"New Project"**
2. Choose **"Deploy from GitHub repo"**
3. Connect your GitHub account
4. Select the VoxLink repository
5. Click **"Deploy"**

### **Step 3: Configure Environment**

Railway will auto-detect your Node.js project and create:
- ✅ **App Service** (your main application)
- ✅ **PostgreSQL Database** (free tier included!)
- ✅ **Redis Cache** (free tier included!)

### **Step 4: Environment Variables**

In Railway dashboard, go to **Variables** tab and add:

```bash
# Environment
NODE_ENV=production
LOG_LEVEL=info

# Database (Railway provides these automatically)
DATABASE_URL=${{Postgres.DATABASE_URL}}
BILLING_DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Railway provides this automatically)
REDIS_URL=${{Redis.REDIS_URL}}

# API Gateway
API_GATEWAY_PORT=3000
CORS_ORIGINS=https://your-app-name.up.railway.app

# JWT
JWT_SECRET=your-32-char-secret-key-here
JWT_EXPIRES_IN=24h
JWT_ISSUER=voxlink.railway.app
JWT_AUDIENCE=voxlink-api

# Payment (add when ready)
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret

# Telecom (add when ready)
AIRTEL_API_KEY=your-key
JIO_API_KEY=your-key
```

### **Step 5: Deploy**

Railway will automatically:
- ✅ Build your application
- ✅ Run database migrations
- ✅ Deploy to production
- ✅ Provide HTTPS URL

**Your app will be live at:** `https://your-project-name.up.railway.app`

---

## 💰 **Railway Pricing**

### **Free Tier (Perfect for Testing)**
- ✅ 512MB RAM
- ✅ 1GB storage
- ✅ PostgreSQL database
- ✅ Redis cache
- ✅ Custom domains
- ✅ 24/7 uptime
- ❌ Limited usage hours

### **Paid Plans (from $5/month)**
- ✅ Unlimited usage
- ✅ More RAM/storage
- ✅ Higher limits
- ✅ Priority support

---

## 🚀 **Quick Start Commands**

If you want to use CLI later:

```bash
# Install CLI
npm install -g @railway/cli

# Login (opens browser)
railway login

# Deploy
cd D:\VoxLink
railway init
railway up
```

---

## 📊 **Railway vs Cyfuture Cost Comparison**

```
Railway (Testing):     $0-5/month
Railway (Production):   $5-15/month
Cyfuture (Production):  ₹42,400/month (~$512)

Railway Savings:        90-97% cheaper than Cyfuture!
```

---

## 🎯 **What Railway Provides**

### **Free Included Services:**
- ✅ **PostgreSQL Database** (with pgAdmin access)
- ✅ **Redis Cache** (for sessions/API caching)
- ✅ **Automatic HTTPS** (SSL certificate)
- ✅ **Custom Domains** (yourdomain.com)
- ✅ **Environment Variables** (secure secrets)
- ✅ **Logs & Monitoring** (real-time)
- ✅ **Auto-deploy** (GitHub integration)

### **Auto-Features:**
- ✅ **Load Balancing** (built-in)
- ✅ **Auto-scaling** (based on traffic)
- ✅ **Backups** (database backups)
- ✅ **Rollback** (deploy previous versions)
- ✅ **Metrics** (CPU, memory, requests)

---

## 🔧 **Railway Architecture for VoxLink**

```
Internet
    ↓
Railway Load Balancer
    ↓
VoxLink App (Node.js)
├── API Gateway (port 3000)
├── Number Service (internal)
├── Billing Service (internal)
├── Notification Service (internal)
├── AI Agent Service (internal)
└── Dashboard (React SPA)

Database Layer:
├── PostgreSQL (Railway managed)
└── Redis (Railway managed)
```

---

## 📱 **Testing Your Deployment**

Once deployed, test these endpoints:

```bash
# Health check
curl https://your-app-name.up.railway.app/health

# API endpoints
curl https://your-app-name.up.railway.app/api/health

# Dashboard
# Open: https://your-app-name.up.railway.app
```

---

## 🆘 **Railway Support**

- **Documentation:** https://docs.railway.app/
- **Discord:** https://discord.gg/railway
- **GitHub:** https://github.com/railwayapp/cli
- **Status:** https://railway.instatus.com/

---

## 🎉 **Why Railway is Perfect for VoxLink**

### **Cost Effective:**
- Start with FREE tier
- Scale as you grow
- Pay only for what you use

### **Developer Friendly:**
- GitHub integration
- Automatic deployments
- Real-time logs
- Easy environment management

### **Production Ready:**
- SSL certificates included
- High availability
- Auto-scaling
- Database backups

---

## 🚀 **Ready to Deploy?**

1. **Go to:** https://railway.app
2. **Sign up** with GitHub
3. **Create new project**
4. **Connect VoxLink repository**
5. **Deploy!**

**Your VoxLink will be live in 5-10 minutes!** 🎉

---

**Questions?** Railway has excellent documentation and community support!

**Cost:** FREE to start, $5/month for production 🚀
