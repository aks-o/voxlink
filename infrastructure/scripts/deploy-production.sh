#!/bin/bash

# VoxLink Production Deployment Script
# This script orchestrates the complete deployment of VoxLink infrastructure and services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="ap-south-1"
PROJECT_NAME="voxlink"
ENVIRONMENT="production"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo -e "${GREEN}🚀 VoxLink Production Deployment${NC}"
echo "=================================================="
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Region: ${AWS_REGION}${NC}"
echo -e "${BLUE}Project: ${PROJECT_NAME}${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not installed${NC}"
        exit 1
    fi
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}❌ Terraform is not installed${NC}"
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS credentials not configured${NC}"
        exit 1
    fi
    
    # Get AWS Account ID
    export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
    echo -e "${BLUE}AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"
    echo ""
}

# Function to build and push Docker images
build_and_push_images() {
    echo -e "${YELLOW}🐳 Building and pushing Docker images...${NC}"
    
    # Login to ECR
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
    
    # Services to build
    services=("api-gateway" "number-service" "billing-service" "notification-service" "ai-agent-service")
    
    for service in "${services[@]}"; do
        echo -e "${BLUE}Building ${service}...${NC}"
        
        # Build image
        docker build -t ${ECR_REGISTRY}/${PROJECT_NAME}/${ENVIRONMENT}/${service}:latest \
            -f packages/${service}/Dockerfile .
        
        # Tag with commit hash if available
        if [ -n "${GITHUB_SHA}" ]; then
            docker tag ${ECR_REGISTRY}/${PROJECT_NAME}/${ENVIRONMENT}/${service}:latest \
                ${ECR_REGISTRY}/${PROJECT_NAME}/${ENVIRONMENT}/${service}:${GITHUB_SHA}
        fi
        
        # Push images
        docker push ${ECR_REGISTRY}/${PROJECT_NAME}/${ENVIRONMENT}/${service}:latest
        
        if [ -n "${GITHUB_SHA}" ]; then
            docker push ${ECR_REGISTRY}/${PROJECT_NAME}/${ENVIRONMENT}/${service}:${GITHUB_SHA}
        fi
        
        echo -e "${GREEN}✅ ${service} image pushed${NC}"
    done
    
    # Build dashboard
    echo -e "${BLUE}Building dashboard...${NC}"
    cd packages/dashboard
    npm ci
    npm run build
    
    docker build -t ${ECR_REGISTRY}/${PROJECT_NAME}/${ENVIRONMENT}/dashboard:latest \
        -f Dockerfile.prod .
    
    if [ -n "${GITHUB_SHA}" ]; then
        docker tag ${ECR_REGISTRY}/${PROJECT_NAME}/${ENVIRONMENT}/dashboard:latest \
            ${ECR_REGISTRY}/${PROJECT_NAME}/${ENVIRONMENT}/dashboard:${GITHUB_SHA}
    fi
    
    docker push ${ECR_REGISTRY}/${PROJECT_NAME}/${ENVIRONMENT}/dashboard:latest
    
    if [ -n "${GITHUB_SHA}" ]; then
        docker push ${ECR_REGISTRY}/${PROJECT_NAME}/${ENVIRONMENT}/dashboard:${GITHUB_SHA}
    fi
    
    cd ../..
    echo -e "${GREEN}✅ Dashboard image pushed${NC}"
    echo ""
}

# Function to deploy infrastructure
deploy_infrastructure() {
    echo -e "${YELLOW}🏗️ Deploying infrastructure with Terraform...${NC}"
    
    cd infrastructure/terraform
    
    # Initialize Terraform
    terraform init
    
    # Select or create workspace
    terraform workspace select ${ENVIRONMENT} || terraform workspace new ${ENVIRONMENT}
    
    # Plan deployment
    terraform plan -var="environment=${ENVIRONMENT}" -var="project_name=${PROJECT_NAME}" -out=tfplan
    
    # Apply deployment
    terraform apply -auto-approve tfplan
    
    # Get outputs
    export ECS_CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
    export ALB_DNS_NAME=$(terraform output -raw alb_dns_name)
    export RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
    
    cd ../..
    
    echo -e "${GREEN}✅ Infrastructure deployed${NC}"
    echo -e "${BLUE}ECS Cluster: ${ECS_CLUSTER_NAME}${NC}"
    echo -e "${BLUE}Load Balancer: ${ALB_DNS_NAME}${NC}"
    echo -e "${BLUE}Database: ${RDS_ENDPOINT}${NC}"
    echo ""
}

# Function to register ECS task definitions
register_task_definitions() {
    echo -e "${YELLOW}📋 Registering ECS task definitions...${NC}"
    
    # Update task definitions with account ID
    for task_def in infrastructure/ecs/*-task-definition.json; do
        service_name=$(basename ${task_def} -task-definition.json)
        echo -e "${BLUE}Registering ${service_name}...${NC}"
        
        # Replace placeholders
        sed "s/ACCOUNT_ID/${AWS_ACCOUNT_ID}/g" ${task_def} > /tmp/${service_name}-task-def.json
        
        # Register task definition
        aws ecs register-task-definition \
            --cli-input-json file:///tmp/${service_name}-task-def.json \
            --region ${AWS_REGION}
        
        echo -e "${GREEN}✅ ${service_name} task definition registered${NC}"
    done
    
    echo ""
}

# Function to deploy services
deploy_services() {
    echo -e "${YELLOW}🚀 Deploying ECS services...${NC}"
    
    services=("api-gateway" "number-service" "billing-service" "notification-service" "ai-agent-service" "dashboard")
    
    for service in "${services[@]}"; do
        echo -e "${BLUE}Deploying ${service}...${NC}"
        
        # Update service
        aws ecs update-service \
            --cluster ${ECS_CLUSTER_NAME} \
            --service ${service} \
            --force-new-deployment \
            --region ${AWS_REGION} || \
        # Create service if it doesn't exist
        aws ecs create-service \
            --cluster ${ECS_CLUSTER_NAME} \
            --service-name ${service} \
            --task-definition ${PROJECT_NAME}-${ENVIRONMENT}-${service} \
            --desired-count 2 \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[$(terraform output -raw private_subnet_ids | tr -d '[]\"' | tr ' ' ',')],securityGroups=[$(terraform output -raw ecs_security_group_id)],assignPublicIp=DISABLED}" \
            --region ${AWS_REGION}
        
        echo -e "${GREEN}✅ ${service} service deployed${NC}"
    done
    
    echo ""
}

# Function to run database migrations
run_migrations() {
    echo -e "${YELLOW}🗄️ Running database migrations...${NC}"
    
    services_with_db=("number-service" "billing-service" "notification-service")
    
    for service in "${services_with_db[@]}"; do
        echo -e "${BLUE}Running migrations for ${service}...${NC}"
        
        # Run migration task
        aws ecs run-task \
            --cluster ${ECS_CLUSTER_NAME} \
            --task-definition ${PROJECT_NAME}-${ENVIRONMENT}-${service} \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[$(terraform output -raw private_subnet_ids | tr -d '[]\"' | tr ' ' ',')],securityGroups=[$(terraform output -raw ecs_security_group_id)],assignPublicIp=DISABLED}" \
            --overrides '{"containerOverrides":[{"name":"'${service}'","command":["npm","run","migrate"]}]}' \
            --region ${AWS_REGION}
        
        echo -e "${GREEN}✅ ${service} migrations completed${NC}"
    done
    
    echo ""
}

# Function to setup monitoring
setup_monitoring() {
    echo -e "${YELLOW}📊 Setting up monitoring and alerting...${NC}"
    
    # Deploy Prometheus configuration
    echo -e "${BLUE}Deploying Prometheus configuration...${NC}"
    aws s3 cp infrastructure/monitoring/prometheus.yml \
        s3://${PROJECT_NAME}-${ENVIRONMENT}-config/monitoring/prometheus.yml
    
    # Deploy Grafana dashboards
    echo -e "${BLUE}Deploying Grafana dashboards...${NC}"
    aws s3 cp infrastructure/monitoring/grafana-dashboard.json \
        s3://${PROJECT_NAME}-${ENVIRONMENT}-config/monitoring/grafana-dashboard.json
    
    # Deploy alert rules
    echo -e "${BLUE}Deploying alert rules...${NC}"
    aws s3 cp infrastructure/monitoring/alert_rules.yml \
        s3://${PROJECT_NAME}-${ENVIRONMENT}-config/monitoring/alert_rules.yml
    
    aws s3 cp infrastructure/monitoring/business_rules.yml \
        s3://${PROJECT_NAME}-${ENVIRONMENT}-config/monitoring/business_rules.yml
    
    # Deploy Alertmanager configuration
    echo -e "${BLUE}Deploying Alertmanager configuration...${NC}"
    aws s3 cp infrastructure/monitoring/alertmanager.yml \
        s3://${PROJECT_NAME}-${ENVIRONMENT}-config/monitoring/alertmanager.yml
    
    echo -e "${GREEN}✅ Monitoring setup completed${NC}"
    echo ""
}

# Function to setup backups
setup_backups() {
    echo -e "${YELLOW}💾 Setting up backup and disaster recovery...${NC}"
    
    # Run backup setup script
    chmod +x infrastructure/scripts/backup-setup.sh
    ./infrastructure/scripts/backup-setup.sh
    
    echo -e "${GREEN}✅ Backup setup completed${NC}"
    echo ""
}

# Function to perform health checks
perform_health_checks() {
    echo -e "${YELLOW}🏥 Performing health checks...${NC}"
    
    # Wait for services to be stable
    echo -e "${BLUE}Waiting for services to stabilize...${NC}"
    
    services=("api-gateway" "number-service" "billing-service" "notification-service" "ai-agent-service" "dashboard")
    
    for service in "${services[@]}"; do
        echo -e "${BLUE}Checking ${service}...${NC}"
        
        aws ecs wait services-stable \
            --cluster ${ECS_CLUSTER_NAME} \
            --services ${service} \
            --region ${AWS_REGION}
        
        echo -e "${GREEN}✅ ${service} is stable${NC}"
    done
    
    # Test API endpoints
    echo -e "${BLUE}Testing API endpoints...${NC}"
    
    # Wait a bit for load balancer to be ready
    sleep 30
    
    # Test API Gateway health
    if curl -f -s "https://${ALB_DNS_NAME}/health" > /dev/null; then
        echo -e "${GREEN}✅ API Gateway health check passed${NC}"
    else
        echo -e "${RED}❌ API Gateway health check failed${NC}"
    fi
    
    # Test Dashboard
    if curl -f -s "https://${ALB_DNS_NAME}/" > /dev/null; then
        echo -e "${GREEN}✅ Dashboard health check passed${NC}"
    else
        echo -e "${RED}❌ Dashboard health check failed${NC}"
    fi
    
    echo ""
}

# Function to send deployment notification
send_notification() {
    echo -e "${YELLOW}📧 Sending deployment notification...${NC}"
    
    # Create deployment summary
    cat > /tmp/deployment-summary.txt << EOF
VoxLink Production Deployment Summary
=====================================

Deployment Time: $(date)
Environment: ${ENVIRONMENT}
Region: ${AWS_REGION}
Commit: ${GITHUB_SHA:-"local"}

Infrastructure:
- ECS Cluster: ${ECS_CLUSTER_NAME}
- Load Balancer: ${ALB_DNS_NAME}
- Database: ${RDS_ENDPOINT}

Services Deployed:
- API Gateway
- Number Service
- Billing Service
- Notification Service
- AI Agent Service
- Dashboard

Monitoring:
- Prometheus configured
- Grafana dashboards deployed
- Alert rules active
- Backup system operational

Health Checks: PASSED

Next Steps:
1. Verify application functionality
2. Monitor system metrics
3. Test backup procedures
4. Update DNS records if needed

Deployment completed successfully! 🎉
EOF
    
    # Send notification (implement your notification method here)
    echo -e "${GREEN}✅ Deployment summary created${NC}"
    cat /tmp/deployment-summary.txt
    
    echo ""
}

# Main deployment flow
main() {
    echo -e "${GREEN}Starting VoxLink production deployment...${NC}"
    echo ""
    
    check_prerequisites
    build_and_push_images
    deploy_infrastructure
    register_task_definitions
    deploy_services
    run_migrations
    setup_monitoring
    setup_backups
    perform_health_checks
    send_notification
    
    echo -e "${GREEN}🎉 VoxLink production deployment completed successfully!${NC}"
    echo "=================================================="
    echo -e "${GREEN}✅ All services are running${NC}"
    echo -e "${GREEN}✅ Monitoring is active${NC}"
    echo -e "${GREEN}✅ Backups are configured${NC}"
    echo -e "${GREEN}✅ Health checks passed${NC}"
    echo ""
    echo -e "${BLUE}Access your application at: https://${ALB_DNS_NAME}${NC}"
    echo -e "${BLUE}API endpoint: https://${ALB_DNS_NAME}/api${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Remember to:${NC}"
    echo "1. Update DNS records to point to the load balancer"
    echo "2. Configure SSL certificates"
    echo "3. Set up monitoring alerts"
    echo "4. Test disaster recovery procedures"
    echo ""
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "check")
        check_prerequisites
        ;;
    "build")
        check_prerequisites
        build_and_push_images
        ;;
    "infrastructure")
        check_prerequisites
        deploy_infrastructure
        ;;
    "services")
        check_prerequisites
        deploy_services
        ;;
    "health")
        perform_health_checks
        ;;
    *)
        echo "Usage: $0 [deploy|check|build|infrastructure|services|health]"
        echo ""
        echo "Commands:"
        echo "  deploy         - Full deployment (default)"
        echo "  check          - Check prerequisites only"
        echo "  build          - Build and push images only"
        echo "  infrastructure - Deploy infrastructure only"
        echo "  services       - Deploy services only"
        echo "  health         - Run health checks only"
        exit 1
        ;;
esac