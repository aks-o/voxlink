#!/bin/bash

# VoxLink Development Startup Script
# This script starts all services needed for local development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting VoxLink Development Environment${NC}"
echo "=============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

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

echo -e "${YELLOW}🐳 Starting Docker services...${NC}"
docker-compose up -d postgres postgres-billing redis

echo -e "${YELLOW}⏳ Waiting for databases to be ready...${NC}"
sleep 10

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}🔍 Checking database connectivity...${NC}"
until docker exec voxlink-postgres pg_isready -U voxlink -d voxlink_dev; do
    echo "Waiting for main database..."
    sleep 2
done

until docker exec voxlink-postgres-billing pg_isready -U voxlink -d voxlink_billing; do
    echo "Waiting for billing database..."
    sleep 2
done

# Wait for Redis to be ready
until docker exec voxlink-redis redis-cli ping; do
    echo "Waiting for Redis..."
    sleep 2
done

echo -e "${GREEN}✅ All databases are ready!${NC}"

# Copy development environment file
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file from development template...${NC}"
    cp .env.development .env
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Run database migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"

# Number Service migrations
if [ -d "packages/number-service/prisma" ]; then
    echo "Running Number Service migrations..."
    cd packages/number-service
    npx prisma generate
    npx prisma db push
    cd ../..
fi

# Billing Service migrations
if [ -d "packages/billing-service/prisma" ]; then
    echo "Running Billing Service migrations..."
    cd packages/billing-service
    npx prisma generate
    npx prisma db push
    cd ../..
fi

# Notification Service migrations
if [ -d "packages/notification-service/prisma" ]; then
    echo "Running Notification Service migrations..."
    cd packages/notification-service
    npx prisma generate
    npx prisma db push
    cd ../..
fi

echo -e "${GREEN}✅ Database migrations completed!${NC}"

# Seed development data
echo -e "${YELLOW}🌱 Seeding development data...${NC}"
if [ -f "scripts/seed-dev-data.js" ]; then
    node scripts/seed-dev-data.js
else
    echo -e "${YELLOW}⚠️  No seed script found, skipping...${NC}"
fi

echo -e "${GREEN}🎉 Development environment is ready!${NC}"
echo ""
echo -e "${BLUE}📋 Available Services:${NC}"
echo -e "${GREEN}  • API Gateway:         http://localhost:3000${NC}"
echo -e "${GREEN}  • Number Service:      http://localhost:3001${NC}"
echo -e "${GREEN}  • Billing Service:     http://localhost:3002${NC}"
echo -e "${GREEN}  • Notification Service: http://localhost:3003${NC}"
echo -e "${GREEN}  • Dashboard:           http://localhost:5173${NC}"
echo ""
echo -e "${BLUE}🗄️  Database Connections:${NC}"
echo -e "${GREEN}  • Main DB:    postgresql://voxlink:voxlink_dev_password@localhost:5432/voxlink_dev${NC}"
echo -e "${GREEN}  • Billing DB: postgresql://voxlink:voxlink_billing_password@localhost:5434/voxlink_billing${NC}"
echo -e "${GREEN}  • Redis:      redis://localhost:6379${NC}"
echo ""
echo -e "${YELLOW}🚀 Starting all services...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Start all services
npm run dev