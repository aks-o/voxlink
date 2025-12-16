#!/bin/bash

# VoxLink Development Startup Script (No Docker)
# This script starts all services for local development without Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting VoxLink Development Environment (No Docker)${NC}"
echo "======================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Create development environment file for no-docker setup
echo -e "${YELLOW}📝 Creating .env file for no-docker setup...${NC}"
cat > .env <<EOF
# VoxLink Development Environment Configuration (No Docker)

# Environment
NODE_ENV=development
LOG_LEVEL=debug

# In-Memory Database Configuration (SQLite for development)
DATABASE_URL=file:./dev.db
BILLING_DATABASE_URL=file:./billing.db
TEST_DATABASE_URL=file:./test.db

# In-Memory Redis (using memory store)
REDIS_URL=memory://localhost

# API Gateway Configuration
API_GATEWAY_PORT=3000
API_GATEWAY_HOST=localhost

# Service Ports
NUMBER_SERVICE_PORT=3001
BILLING_SERVICE_PORT=3002
NOTIFICATION_SERVICE_PORT=3003

# Service URLs
NUMBER_SERVICE_URL=http://localhost:3001
BILLING_SERVICE_URL=http://localhost:3002
NOTIFICATION_SERVICE_URL=http://localhost:3003

# JWT Configuration
JWT_SECRET=dev_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# File Upload
MAX_FILE_SIZE_MB=10

# Development API Keys (Mock/Test)
TWILIO_ACCOUNT_SID=dev_twilio_account_sid
TWILIO_AUTH_TOKEN=dev_twilio_auth_token
BANDWIDTH_USER_ID=dev_bandwidth_user_id
BANDWIDTH_API_TOKEN=dev_bandwidth_api_token
STRIPE_SECRET_KEY=sk_test_dev_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_dev_stripe_webhook_secret
SENDGRID_API_KEY=SG.dev_sendgrid_api_key

# Dashboard Configuration
VITE_API_URL=http://localhost:3000
VITE_ENVIRONMENT=development
VITE_LOG_LEVEL=debug

# Mock/Development Settings
USE_MOCK_PROVIDERS=true
MOCK_PAYMENT_PROCESSING=true
MOCK_SMS_DELIVERY=true
MOCK_EMAIL_DELIVERY=true
USE_MEMORY_STORE=true
USE_SQLITE=true

# Development Features
ENABLE_API_DOCS=true
ENABLE_DEBUG_ROUTES=true
ENABLE_MOCK_DATA=true
EOF

echo -e "${GREEN}✅ Environment configured for no-docker setup!${NC}"

echo -e "${YELLOW}🗄️  Setting up in-memory databases...${NC}"
# The services will create SQLite databases automatically

echo -e "${GREEN}🎉 Development environment is ready!${NC}"
echo ""
echo -e "${BLUE}📋 Available Services:${NC}"
echo -e "${GREEN}  • API Gateway:         http://localhost:3000${NC}"
echo -e "${GREEN}  • Number Service:      http://localhost:3001${NC}"
echo -e "${GREEN}  • Billing Service:     http://localhost:3002${NC}"
echo -e "${GREEN}  • Notification Service: http://localhost:3003${NC}"
echo -e "${GREEN}  • Dashboard:           http://localhost:5173${NC}"
echo ""
echo -e "${BLUE}💾 Data Storage:${NC}"
echo -e "${GREEN}  • Main DB:    SQLite (./dev.db)${NC}"
echo -e "${GREEN}  • Billing DB: SQLite (./billing.db)${NC}"
echo -e "${GREEN}  • Cache:      In-Memory${NC}"
echo ""
echo -e "${YELLOW}🚀 Starting all services...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Start all services
npm run dev