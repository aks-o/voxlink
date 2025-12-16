#!/bin/bash

# VoxLink Development Stop Script
# This script stops all development services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping VoxLink Development Environment${NC}"
echo "=============================================="

echo -e "${YELLOW}🐳 Stopping Docker services...${NC}"
docker-compose down

echo -e "${YELLOW}🧹 Cleaning up...${NC}"

# Kill any remaining Node.js processes on our ports
echo -e "${YELLOW}🔍 Checking for remaining processes...${NC}"

PORTS=(3000 3001 3002 3003 5173)
for port in "${PORTS[@]}"; do
    PID=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$PID" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $PID)${NC}"
        kill -9 $PID 2>/dev/null || true
    fi
done

echo -e "${GREEN}✅ All services stopped successfully!${NC}"
echo ""
echo -e "${BLUE}💡 To start again, run: npm run start:dev${NC}"