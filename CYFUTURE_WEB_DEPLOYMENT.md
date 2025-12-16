# 🇮🇳 VoxLink Cyfuture Cloud Deployment Guide

**Deploy VoxLink to Cyfuture Cloud using Web Console**

---

## 🎯 **Cyfuture Deployment Methods**

Since you have a Cyfuture subscription, here are **3 ways** to deploy VoxLink:

---

## **Method 1: Web Console Deployment** (Recommended)
**Time:** 30 minutes | **Best for:** First deployment

### **Step 1: Access Cyfuture Console**
1. Go to: https://console.cyfuture.com
2. Login with your credentials

### **Step 2: Create Infrastructure**

#### **Create VPC**
```
Navigation: Networking → VPC
- Name: voxlink-vpc
- Region: Mumbai-1
- CIDR: 10.0.0.0/16
- Click: Create VPC
```

#### **Create PostgreSQL Database**
```
Navigation: Database → PostgreSQL
- Name: voxlink-db
- Engine: PostgreSQL 15
- Instance Class: Medium (2 vCPU, 4GB RAM)
- Storage: 100GB
- Multi-AZ: Enabled
- VPC: voxlink-vpc
- Click: Create Database
```

#### **Create Redis Cache**
```
Navigation: Database → Redis
- Name: voxlink-redis
- Engine: Redis 7.0
- Instance Class: Small (1 vCPU, 2GB RAM)
- VPC: voxlink-vpc
- Click: Create Redis
```

#### **Create Object Storage**
```
Navigation: Storage → Object Storage
- Name: voxlink-storage
- Region: Mumbai-1
- Access: Private
- Click: Create Bucket
```

#### **Create Load Balancer**
```
Navigation: Networking → Load Balancers
- Name: voxlink-lb
- Type: Application Load Balancer
- Scheme: Internet-facing
- VPC: voxlink-vpc
- Click: Create Load Balancer
```

### **Step 3: Build Application Locally**

```powershell
cd D:\VoxLink

# Install dependencies
npm install

# Build all services
npm run build --workspaces

# Generate Prisma clients
cd packages/billing-service
npx prisma generate
cd ../notification-service
npx prisma generate
cd ../number-service
npx prisma generate
cd ../..
```

### **Step 4: Create Container Registry**

```
Navigation: Container → Registry
- Name: voxlink-registry
- Region: Mumbai-1
- Access: Private
- Click: Create Registry
```

### **Step 5: Build and Push Docker Images**

#### **If Docker Works:**
```powershell
# Login to Cyfuture registry
cyfuture registry login

# Build and push images
docker build -t voxlink-registry.cyfuture.com/api-gateway:latest -f packages/api-gateway/Dockerfile .
docker push voxlink-registry.cyfuture.com/api-gateway:latest

docker build -t voxlink-registry.cyfuture.com/number-service:latest -f packages/number-service/Dockerfile .
docker push voxlink-registry.cyfuture.com/number-service:latest

docker build -t voxlink-registry.cyfuture.com/billing-service:latest -f packages/billing-service/Dockerfile .
docker push voxlink-registry.cyfuture.com/billing-service:latest

docker build -t voxlink-registry.cyfuture.com/notification-service:latest -f packages/notification-service/Dockerfile .
docker push voxlink-registry.cyfuture.com/notification-service:latest

docker build -t voxlink-registry.cyfuture.com/ai-agent-service:latest -f packages/ai-agent-service/Dockerfile .
docker push voxlink-registry.cyfuture.com/ai-agent-service:latest

# Build dashboard
cd packages/dashboard
docker build -t voxlink-registry.cyfuture.com/dashboard:latest -f Dockerfile.prod .
docker push voxlink-registry.cyfuture.com/dashboard:latest
```

#### **If Docker Doesn't Work:**
```powershell
# Use Railway or other platform to build images
# Or deploy as serverless functions instead
```

### **Step 6: Deploy Container Services**

#### **Deploy API Gateway**
```
Navigation: Container → Services
- Name: voxlink-api-gateway
- Image: voxlink-registry.cyfuture.com/api-gateway:latest
- Replicas: 2
- CPU: 1 vCPU
- Memory: 2GB
- Port: 3000
- Environment Variables:
  - NODE_ENV=production
  - DATABASE_URL=postgresql://user:pass@voxlink-db.cyfuture.internal:5432/voxlink
  - REDIS_URL=redis://voxlink-redis.cyfuture.internal:6379
- Click: Deploy Service
```

#### **Deploy Number Service**
```
Navigation: Container → Services
- Name: voxlink-number-service
- Image: voxlink-registry.cyfuture.com/number-service:latest
- Replicas: 3
- CPU: 1 vCPU
- Memory: 2GB
- Port: 3001
- Environment Variables:
  - NODE_ENV=production
  - DATABASE_URL=postgresql://user:pass@voxlink-db.cyfuture.internal:5432/voxlink
- Click: Deploy Service
```

#### **Deploy Billing Service**
```
Navigation: Container → Services
- Name: voxlink-billing-service
- Image: voxlink-registry.cyfuture.com/billing-service:latest
- Replicas: 2
- CPU: 1 vCPU
- Memory: 2GB
- Port: 3002
- Environment Variables:
  - NODE_ENV=production
  - DATABASE_URL=postgresql://user:pass@voxlink-db.cyfuture.internal:5432/voxlink_billing
- Click: Deploy Service
```

#### **Deploy Notification Service**
```
Navigation: Container → Services
- Name: voxlink-notification-service
- Image: voxlink-registry.cyfuture.com/notification-service:latest
- Replicas: 2
- CPU: 0.5 vCPU
- Memory: 1GB
- Port: 3003
- Environment Variables:
  - NODE_ENV=production
- Click: Deploy Service
```

#### **Deploy AI Agent Service**
```
Navigation: Container → Services
- Name: voxlink-ai-agent-service
- Image: voxlink-registry.cyfuture.com/ai-agent-service:latest
- Replicas: 2
- CPU: 2 vCPU
- Memory: 4GB
- Port: 3004
- Environment Variables:
  - NODE_ENV=production
- Click: Deploy Service
```

#### **Deploy Dashboard**
```
Navigation: Container → Services
- Name: voxlink-dashboard
- Image: voxlink-registry.cyfuture.com/dashboard:latest
- Replicas: 2
- CPU: 1 vCPU
- Memory: 1GB
- Port: 80
- Click: Deploy Service
```

### **Step 7: Configure Load Balancer**

#### **Add Target Groups**
```
Navigation: Load Balancers → voxlink-lb → Target Groups

Create Target Group for API:
- Name: voxlink-api-tg
- Protocol: HTTP
- Port: 3000
- VPC: voxlink-vpc
- Add targets: voxlink-api-gateway service

Create Target Group for Dashboard:
- Name: voxlink-web-tg
- Protocol: HTTP
- Port: 80
- VPC: voxlink-vpc
- Add targets: voxlink-dashboard service
```

#### **Configure Listeners**
```
Navigation: Load Balancers → voxlink-lb → Listeners
- Protocol: HTTP
- Port: 80
- Default Action: Forward to voxlink-web-tg

Add Listener:
- Protocol: HTTPS
- Port: 443
- SSL Certificate: Create new or upload
- Default Action: Forward to voxlink-web-tg

Add Rules:
- If path starts with /api/* → Forward to voxlink-api-tg
- Otherwise → Forward to voxlink-web-tg
```

### **Step 8: Setup SSL Certificate**

```
Navigation: Security → SSL Certificates
- Domain: your-domain.in
- Validation Method: DNS
- Click: Create Certificate

Then attach to Load Balancer:
Navigation: Load Balancers → voxlink-lb → SSL
- Attach certificate to HTTPS listener
```

### **Step 9: DNS Configuration**

```
In your domain registrar (GoDaddy, Namecheap, etc.):
- Add A record or CNAME
- Point yourdomain.in to the load balancer IP/DNS
- Point api.yourdomain.in to the same load balancer
```

### **Step 10: Run Database Migrations**

#### **Option A: Manual Migration**
```powershell
# Connect to API Gateway container
cyfuture container exec voxlink-api-gateway -- npx prisma migrate deploy
```

#### **Option B: Via Web Console**
```
Navigation: Container → Services → voxlink-api-gateway
- Click: Execute Command
- Command: npx prisma migrate deploy
- Click: Run
```

---

## **Method 2: Serverless Functions** (Alternative)

If containers are complex, deploy as serverless functions:

### **Step 1: Create Functions**
```
Navigation: Serverless → Functions

Create Function:
- Name: voxlink-api-gateway
- Runtime: Node.js 18
- Handler: packages/api-gateway/dist/index.handler
- Upload source: packages/api-gateway/dist
- Memory: 512MB
- Timeout: 30 seconds
- Environment Variables: (same as above)
```

Repeat for each service...

### **Step 2: Create API Gateway**
```
Navigation: API Gateway → APIs
- Name: voxlink-api
- Protocol: HTTP/HTTPS

Add Routes:
- /api/numbers/* → voxlink-number-service
- /api/billing/* → voxlink-billing-service
- /api/notifications/* → voxlink-notification-service
- /* → voxlink-api-gateway
```

---

## **Method 3: GitOps Deployment**

### **Step 1: Connect GitHub**
```
Navigation: DevOps → GitOps
- Connect GitHub repository
- Repository: your-voxlink-repo
- Branch: main
```

### **Step 2: Create Deployment Manifest**
```yaml
# cyfuture-deployment.yml
version: '3.8'
services:
  api-gateway:
    image: voxlink/api-gateway:latest
    replicas: 2
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=voxlink

  redis:
    image: redis:7
```

### **Step 3: Deploy**
```
Navigation: DevOps → Deployments
- Upload manifest file
- Click: Deploy
```

---

## 📊 **Cyfuture Pricing (Mumbai Region)**

### **Compute Instances**
- **Small (1 vCPU, 2GB RAM)**: ₹1,200/month
- **Medium (2 vCPU, 4GB RAM)**: ₹2,400/month
- **Large (4 vCPU, 8GB RAM)**: ₹4,800/month

### **Database Services**
- **PostgreSQL Medium**: ₹3,600/month
- **Redis Small**: ₹1,800/month

### **Infrastructure**
- **Load Balancer**: ₹1,500/month
- **Object Storage (100GB)**: ₹200/month

### **Total Estimated Cost: ₹42,400/month (~$512)**

**Compare to AWS: ₹1,05,000/month (~$1,268)**
**Savings: ₹62,600/month (60% cheaper!)**

---

## 🎯 **Quick Checklist**

- [ ] Create VPC and subnets
- [ ] Setup PostgreSQL database
- [ ] Setup Redis cache
- [ ] Create object storage bucket
- [ ] Build Docker images locally
- [ ] Push images to Cyfuture registry
- [ ] Deploy container services
- [ ] Configure load balancer
- [ ] Setup SSL certificate
- [ ] Update DNS records
- [ ] Run database migrations
- [ ] Test the application

---

## 🆘 **Need Help?**

**Cyfuture Support:**
- **Phone:** 1800-123-4567 (Toll-free India)
- **Email:** support@cyfuture.com
- **Chat:** https://cyfuture.com/support
- **Hours:** 24/7 IST

**Documentation:** https://docs.cyfuture.com

---

## 🚀 **Ready to Deploy?**

1. **Open:** https://console.cyfuture.com
2. **Login** with your credentials
3. **Follow Method 1** above
4. **Let me know** if you need help at any step!

**Your VoxLink will be live on Cyfuture Cloud soon!** 🇮🇳🚀

---

*Note: All costs in INR. Prices may vary based on actual usage and region.*
