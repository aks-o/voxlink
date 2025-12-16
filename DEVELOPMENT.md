# VoxLink Development Guide

This guide will help you set up and run the VoxLink Virtual Phone Number Management System locally for development.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose
- **Git**

### One-Command Setup

```bash
npm run start:dev
```

This command will:
1. Install all dependencies
2. Start Docker services (PostgreSQL, Redis)
3. Run database migrations
4. Seed development data
5. Start all microservices and the dashboard

## 📋 Manual Setup

If you prefer to set up step by step:

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Infrastructure Services

```bash
docker-compose up -d postgres postgres-billing redis
```

### 3. Set Up Environment

```bash
cp .env.development .env
```

### 4. Run Database Migrations

```bash
# Number Service
cd packages/number-service
npx prisma generate
npx prisma db push
cd ../..

# Billing Service
cd packages/billing-service
npx prisma generate
npx prisma db push
cd ../..

# Notification Service
cd packages/notification-service
npx prisma generate
npx prisma db push
cd ../..
```

### 5. Seed Development Data

```bash
npm run seed:dev
```

### 6. Start All Services

```bash
npm run dev
```

## 🌐 Service URLs

Once running, you can access:

- **Dashboard**: http://localhost:5173
- **API Gateway**: http://localhost:3000
- **Number Service**: http://localhost:3001
- **Billing Service**: http://localhost:3002
- **Notification Service**: http://localhost:3003

## 🗄️ Database Access

### PostgreSQL

- **Main Database**: `postgresql://voxlink:voxlink_dev_password@localhost:5432/voxlink_dev`
- **Billing Database**: `postgresql://voxlink:voxlink_billing_password@localhost:5434/voxlink_billing`
- **Test Database**: `postgresql://voxlink:voxlink_test_password@localhost:5433/voxlink_test`

### Redis

- **URL**: `redis://localhost:6379`

## 🔧 Development Commands

### Application Commands

```bash
# Start all services in development mode
npm run dev

# Start with full setup (recommended for first time)
npm run start:dev

# Stop all services
npm run stop:dev

# Seed development data
npm run seed:dev
```

### Docker Commands

```bash
# Start infrastructure services
npm run docker:up

# Stop infrastructure services
npm run docker:down

# View logs
npm run docker:logs

# Clean up everything (removes volumes)
npm run docker:clean
```

### Testing Commands

```bash
# Run all tests
npm run test:all

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e

# Run performance tests
npm run test:performance
```

### Code Quality Commands

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Build all packages
npm run build
```

## 🧪 Sample Data

The development environment includes:

### Sample Users
- **Admin**: admin@voxlink.com
- **Demo Business**: demo@business.com  
- **Test Startup**: test@startup.com

### Sample Phone Numbers
- **+1-555-0101** (New York, NY) - Owned by demo@business.com
- **+1-555-0102** (Los Angeles, CA) - Owned by demo@business.com
- **+1-555-0103** (Chicago, IL) - Owned by test@startup.com

### Available Numbers for Purchase
- **+1-555-0201** (Boston, MA) - $15/month
- **+1-555-0202** (Miami, FL) - $15/month
- **+1-555-0203** (Seattle, WA) - $15/month
- **+1-555-0204** (Denver, CO) - $15/month
- **+1-555-0205** (Phoenix, AZ) - $15/month

## 🔍 API Documentation

### Health Check Endpoints

- **API Gateway**: GET http://localhost:3000/health
- **Number Service**: GET http://localhost:3001/health
- **Billing Service**: GET http://localhost:3002/health
- **Notification Service**: GET http://localhost:3003/health

### Key API Endpoints

#### Authentication
- **POST** `/auth/login` - User login
- **POST** `/auth/register` - User registration
- **POST** `/auth/logout` - User logout

#### Number Management
- **GET** `/api/numbers/search` - Search available numbers
- **POST** `/api/numbers/reserve` - Reserve a number
- **POST** `/api/numbers/purchase` - Purchase a reserved number
- **GET** `/api/numbers/my-numbers` - Get user's numbers
- **PUT** `/api/numbers/:id/configure` - Configure number settings

#### Billing
- **GET** `/api/billing/usage` - Get usage statistics
- **GET** `/api/billing/invoices` - Get billing history
- **POST** `/api/billing/payment-method` - Add payment method

#### Notifications
- **GET** `/api/notifications/preferences` - Get notification settings
- **PUT** `/api/notifications/preferences` - Update notification settings

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill processes on specific ports
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

#### Database Connection Issues
```bash
# Restart Docker services
docker-compose restart postgres postgres-billing redis

# Check service status
docker-compose ps
```

#### Missing Dependencies
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

#### Prisma Issues
```bash
# Reset Prisma
cd packages/number-service
npx prisma db push --force-reset
npx prisma generate
```

### Logs and Debugging

#### View Application Logs
```bash
# All services
npm run dev

# Individual service logs are shown in the terminal
```

#### View Docker Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis
```

#### Database Debugging
```bash
# Connect to PostgreSQL
docker exec -it voxlink-postgres psql -U voxlink -d voxlink_dev

# Connect to Redis
docker exec -it voxlink-redis redis-cli
```

## 🔒 Security Notes

### Development Environment
- Uses mock API keys and test credentials
- JWT secret is for development only
- CORS is configured for local development
- Rate limiting is relaxed for testing

### Production Differences
- Real API keys stored in AWS Secrets Manager
- Strong JWT secrets and shorter expiration
- Strict CORS policies
- Production-grade rate limiting
- SSL/TLS encryption

## 📚 Additional Resources

- [Architecture Documentation](./docs/architecture/)
- [API Documentation](./docs/api/)
- [Deployment Guide](./infrastructure/README.md)
- [Testing Guide](./tests/README.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm run test:all`
4. Run linting: `npm run lint:fix`
5. Submit a pull request

## 📞 Support

For development support:
- Check the troubleshooting section above
- Review logs for error messages
- Ensure all prerequisites are installed
- Verify Docker services are running

---

**Happy coding! 🚀**