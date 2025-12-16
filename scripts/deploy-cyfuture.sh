#!/bin/bash
# ===========================================
# VoxLink Deployment Script for Cyfuture
# ===========================================

set -e

echo "🚀 VoxLink Deployment Script"
echo "============================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    npm install -g pm2
fi

echo -e "${GREEN}✓ PM2 installed${NC}"

# Create logs directory
mkdir -p logs

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci --production

# Build all packages
echo -e "${YELLOW}Building packages...${NC}"
npm run build

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from .env.production...${NC}"
    cp .env.production .env
    echo -e "${RED}⚠️  Please edit .env with your production values!${NC}"
    exit 1
fi

# Stop existing services
echo -e "${YELLOW}Stopping existing services...${NC}"
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 delete ecosystem.config.js 2>/dev/null || true

# Start services
echo -e "${YELLOW}Starting VoxLink services...${NC}"
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Show status
echo ""
echo -e "${GREEN}✅ VoxLink deployed successfully!${NC}"
echo ""
pm2 status

echo ""
echo "📋 Useful commands:"
echo "   pm2 status        - Check service status"
echo "   pm2 logs          - View all logs"
echo "   pm2 monit         - Monitor dashboard"
echo "   pm2 restart all   - Restart all services"
echo ""
echo "🌐 Application URLs:"
echo "   API Gateway:    http://localhost:3000"
echo "   Health Check:   http://localhost:3000/health"
echo ""
