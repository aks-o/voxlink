# VoxLink Deployment on Cyfuture Cloud

## Overview

This guide covers deploying VoxLink on Cyfuture Cloud, India's leading cloud infrastructure provider. Cyfuture offers significant advantages for the Indian market including local data centers, competitive pricing, and compliance with Indian regulations.

## Why Cyfuture for VoxLink India?

### Cost Benefits
- **50-70% lower costs** compared to AWS for Indian workloads
- **No data transfer charges** within India regions
- **Local currency billing** in INR without forex fluctuations
- **Competitive compute pricing** starting at ₹0.50/hour for basic instances

### Compliance & Performance
- **Data localization** compliance with Indian regulations
- **Low latency** with Mumbai, Delhi, Bangalore data centers
- **GDPR & ISO 27001** certified infrastructure
- **24/7 Indian support** in local timezone

### Telecom Integration
- **Direct peering** with Indian telecom providers (Airtel, Jio, BSNL)
- **Reduced call routing costs** through local infrastructure
- **Better voice quality** with shorter network hops
- **Regulatory compliance** for telecom services in India

## Architecture on Cyfuture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cyfuture Cloud Infrastructure            │
├─────────────────────────────────────────────────────────────┤
│  Load Balancer (Mumbai Region)                             │
│  ├── SSL Termination                                       │
│  ├── DDoS Protection                                       │
│  └── Auto-scaling Groups                                   │
├─────────────────────────────────────────────────────────────┤
│  Compute Instances (Container Service)                     │
│  ├── API Gateway (2x Medium instances)                     │
│  ├── Number Service (3x Medium instances)                  │
│  ├── Billing Service (2x Medium instances)                 │
│  ├── AI Agent Service (2x Large instances)                 │
│  ├── Notification Service (2x Small instances)             │
│  └── Dashboard (2x Medium instances)                       │
├─────────────────────────────────────────────────────────────┤
│  Database Services                                          │
│  ├── PostgreSQL Cluster (Primary + 2 Replicas)            │
│  ├── Redis Cluster (3 nodes)                              │
│  └── Object Storage (for files, backups)                  │
├─────────────────────────────────────────────────────────────┤
│  Monitoring & Logging                                      │
│  ├── Prometheus + Grafana                                  │
│  ├── ELK Stack (Elasticsearch, Logstash, Kibana)          │
│  └── Alert Manager                                         │
└─────────────────────────────────────────────────────────────┘
```

## Cyfuture Services Mapping

### Compute Services
| AWS Service | Cyfuture Equivalent | VoxLink Usage |
|-------------|-------------------|---------------|
| ECS/EKS | Container Service | Microservices deployment |
| EC2 | Virtual Machines | Application hosting |
| Lambda | Serverless Functions | Event processing |
| Auto Scaling | Auto Scaling Groups | Traffic-based scaling |

### Database Services
| AWS Service | Cyfuture Equivalent | VoxLink Usage |
|-------------|-------------------|---------------|
| RDS PostgreSQL | Managed PostgreSQL | Primary database |
| ElastiCache | Managed Redis | Caching & sessions |
| S3 | Object Storage | File storage, backups |

### Networking & Security
| AWS Service | Cyfuture Equivalent | VoxLink Usage |
|-------------|-------------------|---------------|
| ALB/NLB | Load Balancer | Traffic distribution |
| CloudFront | CDN | Static content delivery |
| WAF | Web Application Firewall | Security protection |
| VPC | Virtual Private Cloud | Network isolation |

## Deployment Steps

### 1. Initial Setup

```bash
# Install Cyfuture CLI
curl -O https://cli.cyfuture.com/install.sh
bash install.sh

# Configure credentials
cyfuture configure
# Enter your API Key and Secret
# Select region: mumbai-1 (recommended for India)
```

### 2. Infrastructure Provisioning

```bash
# Create VPC and networking
cyfuture vpc create --name voxlink-vpc --cidr 10.0.0.0/16 --region mumbai-1

# Create subnets
cyfuture subnet create --vpc voxlink-vpc --name public-subnet --cidr 10.0.1.0/24 --type public
cyfuture subnet create --vpc voxlink-vpc --name private-subnet --cidr 10.0.2.0/24 --type private

# Create security groups
cyfuture security-group create --name voxlink-web --vpc voxlink-vpc
cyfuture security-group create --name voxlink-db --vpc voxlink-vpc
```

### 3. Database Setup

```bash
# Create PostgreSQL cluster
cyfuture database create \
  --name voxlink-postgres \
  --engine postgresql \
  --version 14 \
  --instance-class db.medium \
  --storage 100GB \
  --backup-retention 7 \
  --multi-az true \
  --vpc voxlink-vpc \
  --subnet-group private-subnet

# Create Redis cluster
cyfuture cache create \
  --name voxlink-redis \
  --engine redis \
  --version 6.2 \
  --instance-class cache.medium \
  --num-nodes 3 \
  --vpc voxlink-vpc \
  --subnet-group private-subnet
```

### 4. Container Deployment

Create `cyfuture-deploy.yml`:

```yaml
version: '3.8'
services:
  api-gateway:
    image: voxlink/api-gateway:latest
    replicas: 2
    resources:
      cpu: 1
      memory: 2GB
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    ports:
      - "3000:3000"
    
  number-service:
    image: voxlink/number-service:latest
    replicas: 3
    resources:
      cpu: 1
      memory: 2GB
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    
  billing-service:
    image: voxlink/billing-service:latest
    replicas: 2
    resources:
      cpu: 1
      memory: 2GB
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
    
  ai-agent-service:
    image: voxlink/ai-agent-service:latest
    replicas: 2
    resources:
      cpu: 2
      memory: 4GB
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    
  notification-service:
    image: voxlink/notification-service:latest
    replicas: 2
    resources:
      cpu: 0.5
      memory: 1GB
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
    
  dashboard:
    image: voxlink/dashboard:latest
    replicas: 2
    resources:
      cpu: 1
      memory: 1GB
    ports:
      - "80:80"
```

Deploy the stack:

```bash
cyfuture container deploy --file cyfuture-deploy.yml --cluster voxlink-cluster
```

### 5. Load Balancer Configuration

```bash
# Create load balancer
cyfuture lb create \
  --name voxlink-lb \
  --type application \
  --scheme internet-facing \
  --vpc voxlink-vpc \
  --subnets public-subnet

# Configure SSL certificate
cyfuture certificate create \
  --domain voxlink.in \
  --domain api.voxlink.in \
  --validation-method dns

# Add target groups
cyfuture lb target-group create \
  --name voxlink-api \
  --protocol HTTP \
  --port 3000 \
  --vpc voxlink-vpc

cyfuture lb target-group create \
  --name voxlink-web \
  --protocol HTTP \
  --port 80 \
  --vpc voxlink-vpc
```

## Environment Configuration

### Production Environment Variables

```bash
# Database
export DATABASE_URL="postgresql://username:password@voxlink-postgres.cyfuture.com:5432/voxlink"
export REDIS_URL="redis://voxlink-redis.cyfuture.com:6379"

# Indian Payment Gateways
export RAZORPAY_KEY_ID="rzp_live_xxxxxxxxxx"
export RAZORPAY_KEY_SECRET="xxxxxxxxxx"
export PAYU_MERCHANT_KEY="xxxxxxxxxx"
export PAYU_MERCHANT_SALT="xxxxxxxxxx"

# Indian Telecom Providers
export AIRTEL_API_KEY="xxxxxxxxxx"
export JIO_API_KEY="xxxxxxxxxx"
export BSNL_API_KEY="xxxxxxxxxx"

# Monitoring
export PROMETHEUS_URL="http://prometheus.voxlink.internal:9090"
export GRAFANA_URL="http://grafana.voxlink.internal:3000"

# Regional Settings
export DEFAULT_REGION="IN"
export DEFAULT_CURRENCY="INR"
export DEFAULT_TIMEZONE="Asia/Kolkata"
```

## Cost Optimization

### Cyfuture Pricing (Mumbai Region)

#### Compute Instances
- **Small (1 vCPU, 2GB RAM)**: ₹1,200/month (~$14.50)
- **Medium (2 vCPU, 4GB RAM)**: ₹2,400/month (~$29)
- **Large (4 vCPU, 8GB RAM)**: ₹4,800/month (~$58)

#### Database Services
- **PostgreSQL Medium**: ₹3,600/month (~$43)
- **Redis Medium**: ₹1,800/month (~$22)
- **Object Storage**: ₹2/GB/month (~$0.024)

#### Network & CDN
- **Load Balancer**: ₹1,500/month (~$18)
- **CDN**: ₹0.50/GB (~$0.006)
- **Data Transfer**: Free within India

### Monthly Cost Estimate

```
Production Environment (Indian Market):
├── Compute Instances: ₹24,000/month ($290)
├── Database Services: ₹5,400/month ($65)
├── Load Balancer: ₹1,500/month ($18)
├── Storage & CDN: ₹2,000/month ($24)
├── Monitoring: ₹1,200/month ($14)
└── Total: ₹34,100/month (~$411)

Compare to AWS: ~₹85,000/month (~$1,025)
Savings: 60% cost reduction
```

## Monitoring & Alerting

### Cyfuture Monitoring Stack

```yaml
# monitoring-stack.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana-storage:/var/lib/grafana
    
  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/alertmanager.yml

volumes:
  grafana-storage:
```

### Key Metrics to Monitor

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'voxlink-api-gateway'
    static_configs:
      - targets: ['api-gateway:3000']
  
  - job_name: 'voxlink-number-service'
    static_configs:
      - targets: ['number-service:3001']
  
  - job_name: 'voxlink-billing-service'
    static_configs:
      - targets: ['billing-service:3002']

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

## Security Configuration

### Network Security

```bash
# Configure security groups
cyfuture security-group rule add \
  --group voxlink-web \
  --protocol tcp \
  --port 80 \
  --source 0.0.0.0/0

cyfuture security-group rule add \
  --group voxlink-web \
  --protocol tcp \
  --port 443 \
  --source 0.0.0.0/0

cyfuture security-group rule add \
  --group voxlink-db \
  --protocol tcp \
  --port 5432 \
  --source voxlink-web
```

### SSL/TLS Configuration

```nginx
# nginx.conf for dashboard
server {
    listen 443 ssl http2;
    server_name voxlink.in;
    
    ssl_certificate /etc/ssl/certs/voxlink.in.crt;
    ssl_certificate_key /etc/ssl/private/voxlink.in.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    location / {
        proxy_pass http://dashboard:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Backup & Disaster Recovery

### Automated Backups

```bash
# Database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="voxlink_backup_$DATE"

# PostgreSQL backup
cyfuture database backup create \
  --database voxlink-postgres \
  --name $BACKUP_NAME \
  --retention-days 30

# Redis backup
cyfuture cache backup create \
  --cache voxlink-redis \
  --name "redis_$BACKUP_NAME"

# Upload to object storage
cyfuture storage upload \
  --bucket voxlink-backups \
  --file $BACKUP_NAME.sql
```

### Multi-Region Setup

```bash
# Create disaster recovery in Delhi region
cyfuture database replica create \
  --source voxlink-postgres \
  --name voxlink-postgres-dr \
  --region delhi-1 \
  --read-only false
```

## Deployment Scripts

### Automated Deployment

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Deploying VoxLink to Cyfuture Cloud..."

# Build and push images
docker build -t voxlink/api-gateway:latest packages/api-gateway/
docker build -t voxlink/number-service:latest packages/number-service/
docker build -t voxlink/billing-service:latest packages/billing-service/
docker build -t voxlink/ai-agent-service:latest packages/ai-agent-service/
docker build -t voxlink/notification-service:latest packages/notification-service/
docker build -t voxlink/dashboard:latest packages/dashboard/

# Push to Cyfuture Container Registry
cyfuture registry push voxlink/api-gateway:latest
cyfuture registry push voxlink/number-service:latest
cyfuture registry push voxlink/billing-service:latest
cyfuture registry push voxlink/ai-agent-service:latest
cyfuture registry push voxlink/notification-service:latest
cyfuture registry push voxlink/dashboard:latest

# Deploy to cluster
cyfuture container deploy --file cyfuture-deploy.yml --cluster voxlink-cluster

# Run database migrations
cyfuture container exec --service number-service -- npm run migrate

echo "✅ Deployment completed successfully!"
echo "🌐 Application URL: https://voxlink.in"
echo "📊 Monitoring: https://monitoring.voxlink.in"
```

## Benefits Summary

### Cost Savings
- **60% lower infrastructure costs** compared to AWS
- **No forex charges** with INR billing
- **Free data transfer** within India
- **Competitive telecom rates** through local peering

### Performance Benefits
- **30-50ms lower latency** for Indian users
- **Better voice quality** with local routing
- **Faster API responses** with regional deployment
- **Improved user experience** for Indian customers

### Compliance & Support
- **Data localization** compliance
- **24/7 Indian support** in local timezone
- **Regulatory compliance** for telecom services
- **Local partnerships** with Indian telecom providers

This Cyfuture deployment strategy positions VoxLink perfectly for the Indian market with significant cost advantages and performance improvements!