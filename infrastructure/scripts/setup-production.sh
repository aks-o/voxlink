#!/bin/bash

# VoxLink Production Environment Setup Script
# This script sets up the production environment on cyfuture infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="ap-south-1"
PROJECT_NAME="voxlink"
ENVIRONMENT="production"

echo -e "${GREEN}🚀 Setting up VoxLink Production Environment${NC}"
echo "=================================================="

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed${NC}"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Verify AWS credentials
echo -e "${YELLOW}Verifying AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account ID: ${AWS_ACCOUNT_ID}${NC}"

# Create S3 bucket for Terraform state if it doesn't exist
TERRAFORM_BUCKET="${PROJECT_NAME}-terraform-state"
echo -e "${YELLOW}Setting up Terraform state bucket...${NC}"

if ! aws s3 ls "s3://${TERRAFORM_BUCKET}" 2>&1 | grep -q 'NoSuchBucket'; then
    echo -e "${GREEN}✅ Terraform state bucket already exists${NC}"
else
    aws s3 mb "s3://${TERRAFORM_BUCKET}" --region ${AWS_REGION}
    aws s3api put-bucket-versioning --bucket ${TERRAFORM_BUCKET} --versioning-configuration Status=Enabled
    aws s3api put-bucket-encryption --bucket ${TERRAFORM_BUCKET} --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'
    echo -e "${GREEN}✅ Created Terraform state bucket${NC}"
fi

# Initialize Terraform
echo -e "${YELLOW}Initializing Terraform...${NC}"
cd infrastructure/terraform
terraform init

# Create terraform.tfvars file
echo -e "${YELLOW}Creating terraform.tfvars...${NC}"
cat > terraform.tfvars <<EOF
aws_region = "${AWS_REGION}"
environment = "${ENVIRONMENT}"
project_name = "${PROJECT_NAME}"
domain_name = "voxlink.com"
api_domain = "api.voxlink.com"
dashboard_domain = "app.voxlink.com"

# Database configuration
db_instance_class = "db.t3.medium"
db_allocated_storage = 100
db_max_allocated_storage = 1000

# ECS configuration
ecs_task_cpu = 512
ecs_task_memory = 1024
min_capacity = 2
max_capacity = 10

# Redis configuration
redis_node_type = "cache.t3.micro"
redis_num_cache_nodes = 1
EOF

# Plan and apply Terraform
echo -e "${YELLOW}Planning Terraform deployment...${NC}"
terraform plan -out=tfplan

echo -e "${YELLOW}Do you want to apply the Terraform plan? (y/N)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${YELLOW}Applying Terraform configuration...${NC}"
    terraform apply tfplan
    echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Terraform apply skipped${NC}"
    exit 0
fi

# Get Terraform outputs
echo -e "${YELLOW}Getting infrastructure details...${NC}"
VPC_ID=$(terraform output -raw vpc_id)
PRIVATE_SUBNETS=$(terraform output -json private_subnet_ids | jq -r '.[]' | tr '\n' ',' | sed 's/,$//')
ECS_SECURITY_GROUP=$(terraform output -json security_group_ids | jq -r '.ecs')
ECS_CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)

echo -e "${GREEN}✅ VPC ID: ${VPC_ID}${NC}"
echo -e "${GREEN}✅ ECS Cluster: ${ECS_CLUSTER_NAME}${NC}"

# Update ECS task definitions with actual values
echo -e "${YELLOW}Updating ECS task definitions...${NC}"
cd ../ecs

for task_def in *.json; do
    sed -i "s/ACCOUNT_ID/${AWS_ACCOUNT_ID}/g" "$task_def"
    echo -e "${GREEN}✅ Updated ${task_def}${NC}"
done

# Register ECS task definitions
echo -e "${YELLOW}Registering ECS task definitions...${NC}"
for task_def in *.json; do
    aws ecs register-task-definition --cli-input-json file://"$task_def" --region ${AWS_REGION}
    echo -e "${GREEN}✅ Registered ${task_def}${NC}"
done

# Create ECS services
echo -e "${YELLOW}Creating ECS services...${NC}"

# API Gateway service
aws ecs create-service \
    --cluster ${ECS_CLUSTER_NAME} \
    --service-name api-gateway \
    --task-definition voxlink-production-api-gateway \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${PRIVATE_SUBNETS}],securityGroups=[${ECS_SECURITY_GROUP}],assignPublicIp=DISABLED}" \
    --load-balancers targetGroupArn=$(terraform output -json target_group_arns | jq -r '.api_gateway'),containerName=api-gateway,containerPort=3000 \
    --region ${AWS_REGION}

# Number Service
aws ecs create-service \
    --cluster ${ECS_CLUSTER_NAME} \
    --service-name number-service \
    --task-definition voxlink-production-number-service \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${PRIVATE_SUBNETS}],securityGroups=[${ECS_SECURITY_GROUP}],assignPublicIp=DISABLED}" \
    --region ${AWS_REGION}

# Billing Service
aws ecs create-service \
    --cluster ${ECS_CLUSTER_NAME} \
    --service-name billing-service \
    --task-definition voxlink-production-billing-service \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${PRIVATE_SUBNETS}],securityGroups=[${ECS_SECURITY_GROUP}],assignPublicIp=DISABLED}" \
    --region ${AWS_REGION}

# Notification Service
aws ecs create-service \
    --cluster ${ECS_CLUSTER_NAME} \
    --service-name notification-service \
    --task-definition voxlink-production-notification-service \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${PRIVATE_SUBNETS}],securityGroups=[${ECS_SECURITY_GROUP}],assignPublicIp=DISABLED}" \
    --region ${AWS_REGION}

# Dashboard Service
aws ecs create-service \
    --cluster ${ECS_CLUSTER_NAME} \
    --service-name dashboard \
    --task-definition voxlink-production-dashboard \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${PRIVATE_SUBNETS}],securityGroups=[${ECS_SECURITY_GROUP}],assignPublicIp=DISABLED}" \
    --load-balancers targetGroupArn=$(terraform output -json target_group_arns | jq -r '.dashboard'),containerName=dashboard,containerPort=80 \
    --region ${AWS_REGION}

echo -e "${GREEN}✅ ECS services created successfully${NC}"

# Setup SSL certificate validation
echo -e "${YELLOW}Setting up SSL certificate validation...${NC}"
echo -e "${YELLOW}⚠️  Please add the following DNS records to validate your SSL certificate:${NC}"

aws acm describe-certificate --certificate-arn $(terraform output -raw ssl_certificate_arn) --region ${AWS_REGION} \
    --query 'Certificate.DomainValidationOptions[*].[DomainName,ResourceRecord.Name,ResourceRecord.Value]' \
    --output table

echo -e "${YELLOW}After adding DNS records, the certificate will be automatically validated.${NC}"

# Setup monitoring alerts
echo -e "${YELLOW}Setting up monitoring and alerts...${NC}"
echo -e "${GREEN}✅ CloudWatch dashboard: $(terraform output -raw cloudwatch_dashboard_url)${NC}"
echo -e "${GREEN}✅ SNS topic for alerts: $(terraform output -raw sns_topic_arn)${NC}"

# Final summary
echo ""
echo -e "${GREEN}🎉 Production environment setup completed!${NC}"
echo "=================================================="
echo -e "${GREEN}✅ Infrastructure deployed${NC}"
echo -e "${GREEN}✅ ECS services created${NC}"
echo -e "${GREEN}✅ Monitoring configured${NC}"
echo -e "${GREEN}✅ SSL certificate requested${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Add DNS records for SSL certificate validation"
echo "2. Configure domain DNS to point to ALB: $(terraform output -raw alb_dns_name)"
echo "3. Set up secrets in AWS Secrets Manager for API keys"
echo "4. Run database migrations"
echo "5. Deploy application code using CI/CD pipeline"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"