# VoxLink Production Deployment Guide

This guide provides comprehensive instructions for deploying VoxLink to production with optimized Docker containers, auto-scaling ECS services, comprehensive monitoring, and disaster recovery capabilities.

## 🏗️ Architecture Overview

VoxLink production runs on a modern, cloud-native architecture:

- **Compute**: AWS ECS Fargate with auto-scaling
- **Load Balancing**: Application Load Balancer with SSL termination
- **Database**: Amazon RDS PostgreSQL with read replicas
- **Cache**: Amazon ElastiCache Redis
- **Storage**: Amazon S3 with cross-region replication
- **Monitoring**: Prometheus, Grafana, and CloudWatch
- **Backup**: AWS Backup with cross-region replication

## 📋 Prerequisites

### Required Tools
- AWS CLI v2.x
- Terraform v1.6.0+
- Docker v20.x+
- Node.js v18+
- Git

### AWS Permissions
Your AWS user/role needs the following permissions:
- ECS Full Access
- EC2 Full Access
- RDS Full Access
- ElastiCache Full Access
- S3 Full Access
- IAM Full Access
- CloudWatch Full Access
- Secrets Manager Full Access
- AWS Backup Full Access

### Environment Setup
```bash
# Configure AWS CLI
aws configure

# Set environment variables
export AWS_REGION=ap-south-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export PROJECT_NAME=voxlink
export ENVIRONMENT=production
```

## 🚀 Deployment Steps

### Step 1: Infrastructure Deployment

```bash
# Navigate to Terraform directory
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Create or select workspace
terraform workspace new production
# or
terraform workspace select production

# Plan deployment
terraform plan -var="environment=production" -var="project_name=voxlink" -out=tfplan

# Apply infrastructure
terraform apply tfplan
```

### Step 2: Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com

# Build and push API Gateway
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/voxlink/production/api-gateway:latest -f packages/api-gateway/Dockerfile .
docker push $AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/voxlink/production/api-gateway:latest

# Build and push Number Service
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/voxlink/production/number-service:latest -f packages/number-service/Dockerfile .
docker push $AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/voxlink/production/number-service:latest

# Build and push Billing Service
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/voxlink/production/billing-service:latest -f packages/billing-service/Dockerfile .
docker push $AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/voxlink/production/billing-service:latest

# Build and push Notification Service
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/voxlink/production/notification-service:latest -f packages/notification-service/Dockerfile .
docker push $AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/voxlink/production/notification-service:latest

# Build and push AI Agent Service
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/voxlink/production/ai-agent-service:latest -f packages/ai-agent-service/Dockerfile .
docker push $AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/voxlink/production/ai-agent-service:latest

# Build and push Dashboard
cd packages/dashboard
npm ci
npm run build
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/voxlink/production/dashboard:latest -f Dockerfile.prod .
docker push $AWS_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/voxlink/production/dashboard:latest
cd ../..
```

### Step 3: Register ECS Task Definitions

```bash
# Update task definitions with your account ID
sed -i "s/ACCOUNT_ID/$AWS_ACCOUNT_ID/g" infrastructure/ecs/*-task-definition.json

# Register task definitions
aws ecs register-task-definition --cli-input-json file://infrastructure/ecs/api-gateway-task-definition.json
aws ecs register-task-definition --cli-input-json file://infrastructure/ecs/number-service-task-definition.json
aws ecs register-task-definition --cli-input-json file://infrastructure/ecs/billing-service-task-definition.json
aws ecs register-task-definition --cli-input-json file://infrastructure/ecs/notification-service-task-definition.json
aws ecs register-task-definition --cli-input-json file://infrastructure/ecs/ai-agent-service-task-definition.json
aws ecs register-task-definition --cli-input-json file://infrastructure/ecs/dashboard-task-definition.json
```

### Step 4: Deploy ECS Services

```bash
# Get cluster name and subnet IDs from Terraform outputs
export ECS_CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
export PRIVATE_SUBNET_IDS=$(terraform output -raw private_subnet_ids)
export ECS_SECURITY_GROUP_ID=$(terraform output -raw ecs_security_group_id)

# Create or update services
aws ecs update-service --cluster $ECS_CLUSTER_NAME --service api-gateway --force-new-deployment
aws ecs update-service --cluster $ECS_CLUSTER_NAME --service number-service --force-new-deployment
aws ecs update-service --cluster $ECS_CLUSTER_NAME --service billing-service --force-new-deployment
aws ecs update-service --cluster $ECS_CLUSTER_NAME --service notification-service --force-new-deployment
aws ecs update-service --cluster $ECS_CLUSTER_NAME --service ai-agent-service --force-new-deployment
aws ecs update-service --cluster $ECS_CLUSTER_NAME --service dashboard --force-new-deployment
```

### Step 5: Run Database Migrations

```bash
# Run migrations for each service
for service in number-service billing-service notification-service; do
  aws ecs run-task \
    --cluster $ECS_CLUSTER_NAME \
    --task-definition voxlink-production-$service \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$PRIVATE_SUBNET_IDS],securityGroups=[$ECS_SECURITY_GROUP_ID],assignPublicIp=DISABLED}" \
    --overrides '{"containerOverrides":[{"name":"'$service'","command":["npm","run","migrate"]}]}'
done
```

### Step 6: Setup Monitoring

```bash
# Deploy monitoring configurations
aws s3 cp infrastructure/monitoring/prometheus.yml s3://voxlink-production-config/monitoring/
aws s3 cp infrastructure/monitoring/grafana-dashboard.json s3://voxlink-production-config/monitoring/
aws s3 cp infrastructure/monitoring/alert_rules.yml s3://voxlink-production-config/monitoring/
aws s3 cp infrastructure/monitoring/business_rules.yml s3://voxlink-production-config/monitoring/
aws s3 cp infrastructure/monitoring/alertmanager.yml s3://voxlink-production-config/monitoring/
```

### Step 7: Setup Backups

```bash
# Run backup setup script
chmod +x infrastructure/scripts/backup-setup.sh  # On Linux/Mac
./infrastructure/scripts/backup-setup.sh

# On Windows, run the commands manually from the script
```

### Step 8: Health Checks

```bash
# Wait for services to be stable
aws ecs wait services-stable --cluster $ECS_CLUSTER_NAME --services api-gateway number-service billing-service notification-service ai-agent-service dashboard

# Get load balancer DNS name
export ALB_DNS_NAME=$(terraform output -raw alb_dns_name)

# Test endpoints
curl -f https://$ALB_DNS_NAME/health
curl -f https://$ALB_DNS_NAME/
```

## 🔧 Configuration

### Environment Variables

Key environment variables for production services:

```bash
NODE_ENV=production
AWS_REGION=ap-south-1
DATABASE_URL=postgresql://... (from Secrets Manager)
REDIS_URL=redis://... (from Secrets Manager)
JWT_SECRET=... (from Secrets Manager)
TWILIO_ACCOUNT_SID=... (from Secrets Manager)
TWILIO_AUTH_TOKEN=... (from Secrets Manager)
OPENAI_API_KEY=... (from Secrets Manager)
```

### Secrets Management

All sensitive configuration is stored in AWS Secrets Manager:

```bash
# Database credentials
aws secretsmanager create-secret --name voxlink-production-db-password --secret-string '{"database_url":"postgresql://..."}'

# Redis credentials
aws secretsmanager create-secret --name voxlink-production-redis-auth-token --secret-string '{"redis_url":"redis://..."}'

# JWT secret
aws secretsmanager create-secret --name voxlink-production-jwt-secret --secret-string '{"jwt_secret":"..."}'

# Twilio credentials
aws secretsmanager create-secret --name voxlink-production-twilio-credentials --secret-string '{"account_sid":"...","auth_token":"..."}'

# OpenAI credentials
aws secretsmanager create-secret --name voxlink-production-openai-credentials --secret-string '{"api_key":"..."}'
```

## 📊 Monitoring & Alerting

### Prometheus Metrics

The system exposes the following custom metrics:

- `voxlink_numbers_purchased_total` - Total numbers purchased
- `voxlink_calls_total` - Total calls processed
- `voxlink_calls_successful_total` - Successful calls
- `voxlink_calls_failed_total` - Failed calls
- `voxlink_ai_agent_requests_total` - AI agent requests
- `voxlink_ai_agent_errors_total` - AI agent errors
- `voxlink_revenue_total` - Total revenue
- `voxlink_active_numbers_total` - Active numbers count

### Grafana Dashboards

Access Grafana at: `https://monitoring.voxlink.com`

Key dashboards:
- VoxLink Production Monitoring (main dashboard)
- Service Performance
- Business Metrics
- Security & Alerts

### Alert Rules

Alerts are configured for:
- High response times (>1s)
- High error rates (>1%)
- Resource utilization thresholds
- Business metric anomalies
- Security events

## 💾 Backup & Disaster Recovery

### Backup Strategy

- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour

### Backup Components

1. **AWS Backup**
   - Daily RDS snapshots (365-day retention)
   - Weekly full backups (7-year retention)
   - Cross-region replication to ap-southeast-1

2. **S3 Cross-Region Replication**
   - Real-time replication of critical data
   - Versioning enabled on all buckets

3. **Application Data Backups**
   - Configuration files
   - Uploaded content
   - Log archives

### Recovery Procedures

See `infrastructure/scripts/disaster-recovery-runbook.md` for detailed procedures.

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

## 🔄 CI/CD Pipeline

The deployment pipeline includes:

1. **Test Stage**: Unit, integration, and security tests
2. **Build Stage**: Container image builds and pushes to ECR
3. **Deploy Stage**: Infrastructure updates and service deployments
4. **Verify Stage**: Health checks and smoke tests

### GitHub Actions Workflow

The `.github/workflows/deploy-production.yml` workflow handles:
- Automated testing
- Image building and pushing
- Infrastructure deployment
- Service updates
- Health verification

## 📈 Auto Scaling

### ECS Service Auto Scaling

Services are configured with auto scaling based on:
- CPU utilization (target: 70%)
- Memory utilization (target: 80%)
- Custom metrics (request rate, queue depth)

### Scaling Limits

- **API Gateway**: 2-10 tasks
- **Number Service**: 2-8 tasks
- **Billing Service**: 2-6 tasks
- **Notification Service**: 2-6 tasks
- **AI Agent Service**: 2-8 tasks
- **Dashboard**: 2-6 tasks

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

### Monitoring URLs

- **CloudWatch Dashboard**: https://ap-south-1.console.aws.amazon.com/cloudwatch/home?region=ap-south-1#dashboards:name=voxlink-production-dashboard
- **ECS Console**: https://ap-south-1.console.aws.amazon.com/ecs/home?region=ap-south-1#/clusters/voxlink-production-cluster
- **RDS Console**: https://ap-south-1.console.aws.amazon.com/rds/home?region=ap-south-1

## 📞 Support Contacts

- **Primary On-Call**: [INSERT CONTACT]
- **Secondary On-Call**: [INSERT CONTACT]
- **AWS Support**: [INSERT SUPPORT CASE URL]
- **Infrastructure Team**: [INSERT TEAM CONTACT]

## � Codmplete System Integration Testing

### Integration Testing Overview

After deployment, comprehensive integration testing ensures all components work together seamlessly. The integration process validates:

- Service-to-service communication
- Database and cache connectivity
- Real-time WebSocket connections
- External API integrations
- End-to-end user workflows
- Performance under load
- Data consistency across services

### Running Integration Tests

#### Automated Integration Script

Use the comprehensive integration script:

```bash
# Make script executable (Linux/Mac)
chmod +x scripts/complete-system-integration.sh

# Run complete integration testing
./scripts/complete-system-integration.sh

# Run with specific environment
ENVIRONMENT=production ./scripts/complete-system-integration.sh
```

#### Manual Integration Testing

**1. Service Health Verification**
```bash
# Check all service health endpoints
curl -f https://api.voxlink.com/health
curl -f https://api.voxlink.com/api/v1/numbers/health
curl -f https://api.voxlink.com/api/v1/ai-agents/health
curl -f https://api.voxlink.com/api/v1/billing/health
curl -f https://api.voxlink.com/api/v1/notifications/health

# Verify detailed health information
curl -f https://api.voxlink.com/health/detailed
```

**2. Database Integration Testing**
```bash
# Test database connectivity from each service
for service in api-gateway number-service ai-agent-service billing-service notification-service; do
  aws ecs run-task \
    --cluster voxlink-production-cluster \
    --task-definition voxlink-production-$service \
    --launch-type FARGATE \
    --overrides '{"containerOverrides":[{"name":"'$service'","command":["npm","run","test:db-connection"]}]}'
done
```

**3. Real-time Communication Testing**
```bash
# Test WebSocket connections
wscat -c wss://api.voxlink.com/ws
# Send test message: {"type":"ping","data":"integration-test"}

# Test real-time metrics
curl -f https://api.voxlink.com/api/v1/realtime/metrics

# Test live call monitoring
curl -f https://api.voxlink.com/api/v1/realtime/calls
```

**4. External Integration Testing**
```bash
# Test Twilio integration
curl -X POST https://api.voxlink.com/api/v1/numbers/search \
  -H "Content-Type: application/json" \
  -d '{"areaCode":"555","quantity":1,"provider":"twilio"}'

# Test Bandwidth integration
curl -X POST https://api.voxlink.com/api/v1/numbers/search \
  -H "Content-Type: application/json" \
  -d '{"areaCode":"555","quantity":1,"provider":"bandwidth"}'

# Test AI integration
curl -X POST https://api.voxlink.com/api/v1/ai-agents/test \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, this is a test"}'
```

**5. End-to-End Workflow Testing**
```bash
# Run comprehensive E2E tests
npm run test:e2e:complete-workflows

# Test specific workflows
npm run test:e2e:number-purchase
npm run test:e2e:ai-agent-call
npm run test:e2e:messaging-campaign
npm run test:e2e:billing-cycle
```

### Performance Integration Testing

**Load Testing**
```bash
# Run load tests for all services
npm run test:load:comprehensive

# Test concurrent user scenarios (1000+ users)
npm run test:load:concurrent-users

# Test high-volume call processing (100+ calls/minute)
npm run test:load:call-volume

# Test message throughput (1000+ messages/minute)
npm run test:load:message-throughput
```

**Performance Benchmarks**
```bash
# API response time benchmarks
npm run benchmark:api-response-times

# Database query performance
npm run benchmark:database-queries

# WebSocket message latency
npm run benchmark:websocket-latency

# Cache performance
npm run benchmark:cache-performance
```

### Data Consistency Validation

**Cross-Service Data Validation**
```bash
# Validate data consistency across all services
npm run validate:cross-service-consistency

# Check referential integrity
npm run validate:referential-integrity

# Validate real-time data synchronization
npm run validate:realtime-sync

# Check audit trail consistency
npm run validate:audit-trails
```

**Data Migration Validation**
```bash
# Verify all migrations applied correctly
for service in number-service billing-service notification-service ai-agent-service; do
  npm run migrate:status --workspace=packages/$service
done

# Validate data integrity post-migration
npm run validate:data-integrity
```

### Security Integration Testing

**Authentication and Authorization**
```bash
# Test JWT token validation across services
npm run test:security:jwt-validation

# Test role-based access control
npm run test:security:rbac

# Test API rate limiting
npm run test:security:rate-limiting

# Test input validation and sanitization
npm run test:security:input-validation
```

**Encryption and Data Protection**
```bash
# Test data encryption at rest
npm run test:security:encryption-at-rest

# Test data encryption in transit
npm run test:security:encryption-in-transit

# Test sensitive data masking
npm run test:security:data-masking
```

### Monitoring Integration Validation

**Metrics Collection**
```bash
# Verify Prometheus metrics collection
curl -f https://api.voxlink.com/metrics

# Check custom business metrics
curl -f https://api.voxlink.com/metrics | grep voxlink_

# Validate metric accuracy
npm run validate:metrics-accuracy
```

**Alerting System**
```bash
# Test alert rule evaluation
npm run test:alerting:rule-evaluation

# Test alert notification delivery
npm run test:alerting:notification-delivery

# Validate alert escalation
npm run test:alerting:escalation
```

### Integration Test Results Analysis

**Automated Reporting**
```bash
# Generate comprehensive integration report
npm run report:integration-results

# Generate performance analysis report
npm run report:performance-analysis

# Generate security assessment report
npm run report:security-assessment
```

**Key Metrics to Monitor**
- Service response times (< 200ms for 95th percentile)
- Error rates (< 0.1% for critical endpoints)
- Database query performance (< 50ms average)
- WebSocket message latency (< 100ms)
- Cache hit rates (> 90% for frequently accessed data)
- External API success rates (> 99.9%)

### Troubleshooting Integration Issues

**Common Integration Problems**

1. **Service Discovery Issues**
   ```bash
   # Check ECS service discovery
   aws servicediscovery list-services
   aws servicediscovery get-service --id srv-xxxxxxxxx
   
   # Verify DNS resolution
   nslookup api-gateway.voxlink.local
   ```

2. **Database Connection Pool Exhaustion**
   ```bash
   # Monitor active connections
   psql -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"
   
   # Check connection pool configuration
   grep -r "pool" packages/*/src/config/
   ```

3. **Redis Connection Issues**
   ```bash
   # Check Redis connectivity
   redis-cli -h production-redis.xxxxx.cache.amazonaws.com ping
   
   # Monitor Redis connections
   redis-cli info clients
   ```

4. **WebSocket Connection Problems**
   ```bash
   # Check WebSocket server status
   curl -f https://api.voxlink.com/ws/health
   
   # Monitor WebSocket connections
   ss -tuln | grep :3000
   ```

### Integration Testing Checklist

**Pre-Integration**
- [ ] All services deployed and healthy
- [ ] Database migrations completed
- [ ] External API credentials configured
- [ ] Monitoring systems active
- [ ] Load balancers configured

**During Integration**
- [ ] Service health checks passing
- [ ] Inter-service communication verified
- [ ] Database connectivity confirmed
- [ ] Real-time features operational
- [ ] External integrations working
- [ ] Performance benchmarks met

**Post-Integration**
- [ ] End-to-end workflows tested
- [ ] Load testing completed
- [ ] Security testing passed
- [ ] Data consistency validated
- [ ] Monitoring alerts configured
- [ ] Documentation updated

### Continuous Integration Testing

**Automated Testing Pipeline**
```yaml
# .github/workflows/integration-testing.yml
name: Integration Testing
on:
  deployment_status:
    types: [success]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run integration tests
        run: ./scripts/complete-system-integration.sh
        env:
          ENVIRONMENT: production
          API_GATEWAY_URL: ${{ secrets.API_GATEWAY_URL }}
      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: integration-report-*.json
```

**Scheduled Integration Monitoring**
```bash
# Cron job for continuous integration monitoring
# Run every hour
0 * * * * /path/to/scripts/complete-system-integration.sh >> /var/log/integration-monitor.log 2>&1
```

## 📚 Additional Resources

- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [VoxLink Architecture Decision Records](../docs/architecture/)
- [Production Runbooks](../docs/runbooks/)
- [Integration Testing Guide](../tests/TESTING_GUIDE.md)
- [Performance Optimization Guide](../docs/performance/)
- [Security Best Practices](../docs/security/)

---

**Last Updated**: December 2024  
**Version**: 2.1.0  
**Maintained By**: VoxLink Infrastructure Team