# VoxLink Automated Testing Suite

This directory contains the comprehensive automated testing suite for the VoxLink Virtual Phone Number Management System. The testing suite is designed to ensure quality, performance, and reliability across all system components.

## 📋 Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── workflows/          # Complete user workflow tests
│   ├── helpers/           # Test utilities and mocks
│   └── setup.ts           # E2E test environment setup
├── integration/           # Database and service integration tests
│   ├── database/          # Database integration tests
│   └── setup.ts           # Integration test environment setup
├── contract/              # API contract tests between services
│   ├── api/               # Service-to-service contract tests
│   └── setup.ts           # Contract test setup
├── performance/           # Performance and load tests
│   ├── load/              # Load testing scenarios
│   ├── helpers/           # Performance measurement utilities
│   └── setup.ts           # Performance test setup
└── README.md              # This file
```

## 🧪 Test Types

### 1. Unit Tests
- **Location**: `packages/*/src/**/__tests__/*.test.ts`
- **Purpose**: Test individual functions, classes, and components in isolation
- **Coverage Target**: 90%
- **Run Command**: `npm run test:unit`

### 2. Integration Tests
- **Location**: `tests/integration/`
- **Purpose**: Test database operations, service integrations, and data flow
- **Features**: 
  - Real PostgreSQL and Redis containers using Testcontainers
  - Database transaction testing
  - Cache integration testing
  - Repository pattern testing
- **Run Command**: `npm run test:integration`

### 3. End-to-End Tests
- **Location**: `tests/e2e/`
- **Purpose**: Test complete user workflows from API to database
- **Scenarios**:
  - Number search and acquisition
  - Number configuration and management
  - Number porting process
  - User dashboard interactions
- **Run Command**: `npm run test:e2e`

### 4. Contract Tests
- **Location**: `tests/contract/`
- **Purpose**: Ensure API contracts between services are maintained
- **Coverage**:
  - Number Service ↔ Billing Service
  - Number Service ↔ Notification Service
  - API Gateway ↔ All Services
- **Run Command**: `npm run test:contract`

### 5. Performance Tests
- **Location**: `tests/performance/`
- **Purpose**: Validate system performance under load
- **Scenarios**:
  - Concurrent number searches (100+ requests)
  - Sustained load testing (30 seconds)
  - API Gateway rate limiting
  - Database query performance
- **Run Command**: `npm run test:performance`

## 🚀 Running Tests

### Prerequisites
- Node.js 18+
- Docker (for integration tests)
- PostgreSQL 15+ (for local development)
- Redis 7+ (for local development)

### Quick Start
```bash
# Install dependencies
npm ci

# Run all tests (except performance)
npm run test:all

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:contract
npm run test:performance

# Run tests for CI/CD
npm run test:ci
```

### Environment Variables
```bash
# Test Database
DATABASE_URL=postgresql://test:test@localhost:5432/voxlink_test

# Test Redis
REDIS_URL=redis://localhost:6379

# JWT Secret for tests
JWT_SECRET=test-jwt-secret

# Test Environment
NODE_ENV=test
```

## 📊 Test Reports and Coverage

### Coverage Reports
- **Unit Tests**: `coverage/lcov.info`
- **Integration Tests**: `coverage/integration/lcov.info`
- **E2E Tests**: `coverage/e2e/lcov.info`
- **Contract Tests**: `coverage/contract/lcov.info`

### Performance Reports
- **JSON Reports**: `coverage/performance-reports/*.json`
- **HTML Reports**: `coverage/performance-reports/*.html`
- **Metrics Tracked**:
  - Response times (average, min, max)
  - Throughput (requests per second)
  - Success rates
  - Performance grades (A-F)

## 🔧 Test Configuration

### Jest Configuration
Each test type has its own Jest configuration:
- `jest.config.js` - Unit tests
- `tests/e2e/jest.config.js` - E2E tests
- `tests/integration/jest.config.js` - Integration tests
- `tests/contract/jest.config.js` - Contract tests
- `tests/performance/jest.config.js` - Performance tests

### Test Containers
Integration tests use Testcontainers to spin up real database instances:
- PostgreSQL 15 container for database tests
- Redis 7 container for cache tests
- Automatic cleanup after test completion

## 🎯 Test Scenarios

### Number Acquisition Workflow
1. **Search Numbers**: Test search with various filters
2. **Reserve Number**: Test reservation with timeout
3. **Purchase Number**: Test payment processing
4. **Activate Number**: Test number activation
5. **Configure Number**: Test call forwarding setup

### Number Configuration Workflow
1. **Call Forwarding**: Test routing configuration
2. **Business Hours**: Test time-based routing
3. **Voicemail**: Test voicemail setup
4. **Configuration Testing**: Test configuration validation

### Number Porting Workflow
1. **Submit Request**: Test porting request submission
2. **Document Upload**: Test document handling
3. **Status Tracking**: Test real-time status updates
4. **Completion**: Test successful porting

### Performance Scenarios
1. **Concurrent Searches**: 100+ simultaneous number searches
2. **Sustained Load**: 10 requests/second for 30 seconds
3. **Rate Limiting**: Test API gateway limits
4. **Database Performance**: High-volume usage tracking

## 🔍 Test Helpers and Utilities

### Authentication Helpers
- `createTestUser()`: Create test user accounts
- `generateAuthToken()`: Generate JWT tokens
- `createAdminUser()`: Create admin test accounts

### Number Helpers
- `createTestNumber()`: Create test virtual numbers
- `createAvailableNumbers()`: Create multiple available numbers
- `generatePhoneNumber()`: Generate realistic phone numbers

### Mock Services
- **Telecom Provider Mock**: Simulates telecom provider APIs
- **Carrier API Mock**: Simulates number porting carriers
- **Performance Metrics**: Tracks and reports performance data

## 🚨 Continuous Integration

### GitHub Actions Workflow
The automated testing pipeline includes:

1. **Unit Tests**: Run on every push/PR
2. **Integration Tests**: Run with real database containers
3. **E2E Tests**: Run complete workflow tests
4. **Contract Tests**: Validate service contracts
5. **Performance Tests**: Run on schedule or manual trigger
6. **Security Tests**: Dependency scanning and SAST

### Test Matrix
- **Node.js**: 18.x
- **PostgreSQL**: 15.x
- **Redis**: 7.x
- **OS**: Ubuntu Latest

### Quality Gates
- **Unit Test Coverage**: ≥ 90%
- **Integration Test Coverage**: ≥ 80%
- **E2E Test Success Rate**: 100%
- **Performance Grade**: B or better
- **Security Scan**: No high/critical vulnerabilities

## 📈 Performance Benchmarks

### Response Time Targets
- **Number Search**: < 3 seconds
- **Number Purchase**: < 5 seconds
- **Configuration Update**: < 30 seconds
- **API Gateway**: < 1 second

### Load Targets
- **Concurrent Users**: 100+
- **Requests per Second**: 50+
- **Success Rate**: > 95%
- **Uptime**: > 99.9%

## 🐛 Debugging Tests

### Common Issues
1. **Container Startup**: Ensure Docker is running
2. **Database Connections**: Check connection strings
3. **Port Conflicts**: Ensure test ports are available
4. **Memory Issues**: Increase Node.js memory limit

### Debug Commands
```bash
# Run tests with verbose output
npm run test:e2e -- --verbose

# Run specific test file
npm run test:e2e -- number-acquisition.e2e.test.ts

# Run tests with debugging
node --inspect-brk node_modules/.bin/jest --config=tests/e2e/jest.config.js

# Check test containers
docker ps | grep test
```

## 📝 Writing New Tests

### Test Naming Convention
- Unit tests: `*.test.ts`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`
- Contract tests: `*.contract.test.ts`
- Performance tests: `*.perf.test.ts`

### Test Structure
```typescript
describe('Feature Name', () => {
  beforeAll(async () => {
    // Setup test environment
  });

  beforeEach(async () => {
    // Setup each test
  });

  describe('Specific Functionality', () => {
    it('should do something specific', async () => {
      // Test implementation
      expect(result).toMatchObject({
        // Expected result
      });
    });
  });

  afterEach(async () => {
    // Cleanup after each test
  });

  afterAll(async () => {
    // Cleanup test environment
  });
});
```

## 🤝 Contributing

When adding new features:
1. Write unit tests for new functions/classes
2. Add integration tests for database operations
3. Include E2E tests for user-facing features
4. Update contract tests for API changes
5. Consider performance impact and add perf tests if needed

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testcontainers Documentation](https://testcontainers.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)