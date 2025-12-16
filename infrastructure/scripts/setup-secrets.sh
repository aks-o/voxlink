#!/bin/bash

# VoxLink Production Secrets Setup Script
# This script creates all necessary secrets in AWS Secrets Manager

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

echo -e "${GREEN}🔐 Setting up VoxLink Production Secrets${NC}"
echo "=================================================="

# Function to create secret if it doesn't exist
create_secret() {
    local secret_name=$1
    local secret_description=$2
    local secret_value=$3
    
    if aws secretsmanager describe-secret --secret-id "$secret_name" --region ${AWS_REGION} &> /dev/null; then
        echo -e "${YELLOW}⚠️  Secret ${secret_name} already exists, updating...${NC}"
        aws secretsmanager update-secret \
            --secret-id "$secret_name" \
            --secret-string "$secret_value" \
            --region ${AWS_REGION} > /dev/null
    else
        echo -e "${GREEN}✅ Creating secret ${secret_name}${NC}"
        aws secretsmanager create-secret \
            --name "$secret_name" \
            --description "$secret_description" \
            --secret-string "$secret_value" \
            --region ${AWS_REGION} > /dev/null
    fi
}

# JWT Secret
echo -e "${YELLOW}Creating JWT secret...${NC}"
JWT_SECRET=$(openssl rand -base64 64)
create_secret \
    "${PROJECT_NAME}-${ENVIRONMENT}-jwt-secret" \
    "JWT secret for VoxLink production authentication" \
    "{\"jwt_secret\":\"${JWT_SECRET}\"}"

# Twilio Credentials
echo -e "${YELLOW}Creating Twilio credentials secret...${NC}"
echo "Please enter your Twilio Account SID:"
read -r TWILIO_ACCOUNT_SID
echo "Please enter your Twilio Auth Token:"
read -s TWILIO_AUTH_TOKEN
echo

create_secret \
    "${PROJECT_NAME}-${ENVIRONMENT}-twilio-credentials" \
    "Twilio API credentials for VoxLink production" \
    "{\"account_sid\":\"${TWILIO_ACCOUNT_SID}\",\"auth_token\":\"${TWILIO_AUTH_TOKEN}\"}"

# Bandwidth Credentials
echo -e "${YELLOW}Creating Bandwidth credentials secret...${NC}"
echo "Please enter your Bandwidth User ID:"
read -r BANDWIDTH_USER_ID
echo "Please enter your Bandwidth API Token:"
read -s BANDWIDTH_API_TOKEN
echo

create_secret \
    "${PROJECT_NAME}-${ENVIRONMENT}-bandwidth-credentials" \
    "Bandwidth API credentials for VoxLink production" \
    "{\"user_id\":\"${BANDWIDTH_USER_ID}\",\"api_token\":\"${BANDWIDTH_API_TOKEN}\"}"

# Stripe Credentials
echo -e "${YELLOW}Creating Stripe credentials secret...${NC}"
echo "Please enter your Stripe Secret Key:"
read -s STRIPE_SECRET_KEY
echo
echo "Please enter your Stripe Webhook Secret:"
read -s STRIPE_WEBHOOK_SECRET
echo

create_secret \
    "${PROJECT_NAME}-${ENVIRONMENT}-stripe-credentials" \
    "Stripe payment processing credentials for VoxLink production" \
    "{\"secret_key\":\"${STRIPE_SECRET_KEY}\",\"webhook_secret\":\"${STRIPE_WEBHOOK_SECRET}\"}"

# SendGrid Credentials
echo -e "${YELLOW}Creating SendGrid credentials secret...${NC}"
echo "Please enter your SendGrid API Key:"
read -s SENDGRID_API_KEY
echo

create_secret \
    "${PROJECT_NAME}-${ENVIRONMENT}-sendgrid-credentials" \
    "SendGrid email service credentials for VoxLink production" \
    "{\"api_key\":\"${SENDGRID_API_KEY}\"}"

# Database URL (constructed from RDS endpoint)
echo -e "${YELLOW}Creating database URL secret...${NC}"
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier "${PROJECT_NAME}-${ENVIRONMENT}-db" \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text \
    --region ${AWS_REGION})

DB_PASSWORD=$(aws secretsmanager get-secret-value \
    --secret-id "${PROJECT_NAME}-${ENVIRONMENT}-db-password" \
    --query 'SecretString' \
    --output text \
    --region ${AWS_REGION} | jq -r '.password')

DATABASE_URL="postgresql://voxlink_admin:${DB_PASSWORD}@${RDS_ENDPOINT}:5432/voxlink_production"

create_secret \
    "${PROJECT_NAME}-${ENVIRONMENT}-database-url" \
    "Database connection URL for VoxLink production" \
    "{\"database_url\":\"${DATABASE_URL}\"}"

# Redis URL (constructed from ElastiCache endpoint)
echo -e "${YELLOW}Creating Redis URL secret...${NC}"
REDIS_ENDPOINT=$(aws elasticache describe-replication-groups \
    --replication-group-id "${PROJECT_NAME}-${ENVIRONMENT}-redis" \
    --query 'ReplicationGroups[0].NodeGroups[0].PrimaryEndpoint.Address' \
    --output text \
    --region ${AWS_REGION})

REDIS_AUTH_TOKEN=$(aws secretsmanager get-secret-value \
    --secret-id "${PROJECT_NAME}-${ENVIRONMENT}-redis-auth-token" \
    --query 'SecretString' \
    --output text \
    --region ${AWS_REGION} | jq -r '.auth_token')

REDIS_URL="redis://:${REDIS_AUTH_TOKEN}@${REDIS_ENDPOINT}:6379"

create_secret \
    "${PROJECT_NAME}-${ENVIRONMENT}-redis-url" \
    "Redis connection URL for VoxLink production" \
    "{\"redis_url\":\"${REDIS_URL}\"}"

# Application Configuration
echo -e "${YELLOW}Creating application configuration secret...${NC}"
APP_CONFIG="{
    \"environment\": \"production\",
    \"log_level\": \"info\",
    \"cors_origins\": [\"https://app.voxlink.com\", \"https://voxlink.com\"],
    \"rate_limit_window_ms\": 900000,
    \"rate_limit_max_requests\": 100,
    \"session_timeout_hours\": 24,
    \"file_upload_max_size_mb\": 10,
    \"webhook_timeout_ms\": 30000
}"

create_secret \
    "${PROJECT_NAME}-${ENVIRONMENT}-app-config" \
    "Application configuration for VoxLink production" \
    "$APP_CONFIG"

echo ""
echo -e "${GREEN}🎉 All secrets created successfully!${NC}"
echo "=================================================="
echo -e "${GREEN}✅ JWT secret${NC}"
echo -e "${GREEN}✅ Twilio credentials${NC}"
echo -e "${GREEN}✅ Bandwidth credentials${NC}"
echo -e "${GREEN}✅ Stripe credentials${NC}"
echo -e "${GREEN}✅ SendGrid credentials${NC}"
echo -e "${GREEN}✅ Database URL${NC}"
echo -e "${GREEN}✅ Redis URL${NC}"
echo -e "${GREEN}✅ Application configuration${NC}"
echo ""
echo -e "${YELLOW}⚠️  Important Security Notes:${NC}"
echo "1. All secrets are encrypted at rest in AWS Secrets Manager"
echo "2. Access is controlled via IAM roles and policies"
echo "3. Secrets are automatically rotated where supported"
echo "4. Monitor secret access via CloudTrail logs"
echo ""
echo -e "${GREEN}Secrets setup completed! 🔐${NC}"