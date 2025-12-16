# VoxLink Production Infrastructure

This directory contains all the infrastructure-as-code configurations and deployment scripts for VoxLink's production environment on cyfuture cloud infrastructure.

## 🏗️ Architecture Overview

VoxLink production runs on a modern, cloud-native architecture designed for scalability, reliability, and security:

- **Compute**: AWS ECS Fargate for containerized microservices
- **Database**: Amazon RDS PostgreSQL with read replicas
- **Cache**: Amazon ElastiCache Redis for session management and caching
- **Load Balancing**: Application Load Balancer with SSL termination
- **Storage**: Amazon S3 for file storage and backups
- **Monitoring**: CloudWatch, Prometheus, and Grafana
- **Security**: AWS Secrets Manager, IAM roles, and security groups

## 📁 Directory Structure

```
infrastructure/
├── terraform/              # Infrastructure as Code
│   ├── main.tf             # Main Terraform configuration
│   ├── variables.tf        # Input variables
│   ├── outputs.tf          # Output values
│   ├── vpc.tf              # VPC and networking
│   ├── security-groups.tf  # Security group definitions
│   ├── rds.tf              # Database configuration
│   ├── elasticache.tf      # Redis configuration
│   ├── ecs.tf              # Container orchestration
│   ├── alb.tf              # Load balancer setup
│   ├── s3.tf               # Storage buckets
│   └── cloudwatch.tf       # Monitoring and alerting
├── ecs/                    # ECS task definitions
├── monitoring/             # Monitoring configurations
├── scripts/                # Deployment and setup scripts
└── README.md               # This file
```

## 🚀 Deployment Guide

### Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** v1.6.0 or later
3. **Docker** for building container images
4. **Node.js** v18+ for application builds

### Step 1: Initial Infrastructure Setup

```bash
# Make setup script executable (Linux/Mac)
chmod +x infrastructure/scripts/setup-production.sh

# Run the setup script
./infrastructure/scripts/setup-production.sh
```

This script will:
- Create S3 bucket for Terraform state
- Deploy all infrastructure components
- Register ECS task definitions
- Create ECS services
- Set up monitoring and alerting

### Step 2: Configure Secrets

```bash
# Set up all production secrets
./infrastructure/scripts/setup-secrets.sh
```

This will create secrets in AWS Secrets Manager for:
- Database credentials
- Redis authentication
- API keys (Twilio, Bandwidth, Stripe, SendGrid)
- JWT secrets
- Application configuration

### Step 3: Set Up Backups

```bash
# Configure automated backups
./infrastructure/scripts/backup-setup.sh
```

This sets up:
- AWS Backup for RDS and EBS
- S3 cross-region replication
- Disaster recovery procedures

### Step 4: Deploy Applications

Use the GitHub Actions workflow to deploy applications:

```bash
# Trigger deployment via GitHub Actions
git push origin main
```

Or deploy manually:

```bash
# Build and push container images
docker build -t $ECR_REGISTRY/voxlink/production/api-gateway:latest packages/api-gateway/
docker push $ECR_REGISTRY/voxlink/production/api-gateway:latest

# Update ECS services
aws ecs update-service --cluster voxlink-production-cluster --service api-gateway --force-new-deployment
```

## 🔧 Configuration

### Environment Variables

Key environment variables for production:

```bash
NODE_ENV=production
AWS_REGION=ap-south-1
DATABASE_URL=postgresql://... (from Secrets Manager)
REDIS_URL=redis://... (from Secrets Manager)
JWT_SECRET=... (from Secrets Manager)
```

### Domain Configuration

Update DNS records to point to the load balancer:

```
api.voxlink.com -> voxlink-production-alb-xxxxxxxxx.ap-south-1.elb.amazonaws.com
app.voxlink.com -> voxlink-production-alb-xxxxxxxxx.ap-south-1.elb.amazonaws.com
```

### SSL Certificate

The SSL certificate is automatically provisioned via AWS Certificate Manager. Add the required DNS validation records as shown in the setup script output.

## 📊 Monitoring

### CloudWatch Dashboard

Access the production dashboard:
```
https://ap-south-1.console.aws.amazon.com/cloudwatch/home?region=ap-south-1#dashboards:name=voxlink-production-dashboard
```

### Key Metrics

- **Response Time**: < 1 second average
- **Error Rate**: < 1% 5XX errors
- **CPU Utilization**: < 80% average
- **Memory Utilization**: < 85% average
- **Database Connections**: < 80 concurrent

### Alerts

Alerts are configured for:
- High response times (> 1s)
- High error rates (> 1%)
- Resource utilization thresholds
- Service health checks
- SSL certificate expiration

## 🔒 Security

### Network Security

- Private subnets for application and database tiers
- Security groups with minimal required access
- NAT gateways for outbound internet access
- No direct internet access to databases

### Data Security

- Encryption at rest for RDS and S3
- Encryption in transit with TLS 1.2+
- Secrets stored in AWS Secrets Manager
- Regular security updates and patches

### Access Control

- IAM roles with least privilege principle
- MFA required for administrative access
- CloudTrail logging for audit trails
- VPC Flow Logs for network monitoring

## 💾 Backup & Recovery

### Backup Strategy

- **RDS**: Automated daily backups with 30-day retention
- **EBS**: Daily snapshots via AWS Backup
- **S3**: Cross-region replication to ap-southeast-1
- **Application Data**: Weekly full backups

### Recovery Procedures

See `disaster-recovery-runbook.md` for detailed procedures.

**Recovery Objectives:**
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 1 hour

## 🔄 CI/CD Pipeline

The deployment pipeline includes:

1. **Test Stage**: Unit, integration, and security tests
2. **Build Stage**: Container image builds and pushes to ECR
3. **Deploy Stage**: Infrastructure updates and service deployments
4. **Verify Stage**: Health checks and smoke tests

### Pipeline Triggers

- **Automatic**: Push to `main` branch
- **Manual**: Workflow dispatch with force deploy option

## 📈 Scaling

### Auto Scaling Configuration

- **ECS Services**: 2-10 tasks based on CPU/memory utilization
- **RDS**: Read replicas for read-heavy workloads
- **ALB**: Automatic scaling based on request volume

### Performance Optimization

- Redis caching for frequently accessed data
- CDN for static assets
- Database query optimization
- Connection pooling

## 🛠️ Troubleshooting

### Common Issues

1. **Service Won't Start**
   ```bash
   # Check ECS service events
   aws ecs describe-services --cluster voxlink-production-cluster --services api-gateway
   
   # Check CloudWatch logs
   aws logs tail /aws/ecs/voxlink-production/api-gateway --follow
   ```

2. **Database Connection Issues**
   ```bash
   # Verify security group rules
   aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx
   
   # Test connectivity from ECS task
   aws ecs execute-command --cluster voxlink-production-cluster --task TASK_ID --container api-gateway --interactive --command "/bin/bash"
   ```

3. **High Response Times**
   ```bash
   # Check CloudWatch metrics
   aws cloudwatch get-metric-statistics --namespace AWS/ApplicationELB --metric-name TargetResponseTime
   
   # Scale up services if needed
   aws ecs update-service --cluster voxlink-production-cluster --service api-gateway --desired-count 4
   ```

### Support Contacts

- **Primary On-Call**: [INSERT CONTACT]
- **AWS Support**: [INSERT SUPPORT CASE URL]
- **Infrastructure Team**: [INSERT TEAM CONTACT]

## 📚 Additional Resources

- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [VoxLink Architecture Decision Records](../docs/architecture/)
- [Production Runbooks](../docs/runbooks/)

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintained By**: VoxLink Infrastructure Team