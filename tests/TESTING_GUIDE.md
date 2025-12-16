# VoxLink Testing Guide

This document provides a comprehensive guide to the VoxLink testing infrastructure, covering all types of tests and how to run them.

## Overview

The VoxLink platform uses a multi-layered testing approach to ensure reliability, performance, and security:

- **Unit Tests**: Test individual components and functions in isolation
- **Integration Tests**: Test API endpoints and database operations
- **Contract Tests**: Test API contracts between services
- **End-to-End Tests**: Test complete user journeys using Cypress
- **Performance Tests**: Test system performance under load
- **Security Tests**: Test authentication, authorization, and data protection

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── dashboard/          # React component tests
│   ├── shared/             # Shared service tests
│   └── ...
├── integration/            # Integration tests
│   ├── api/               # API endpoint tests
│   ├── database/          # Database operation tests
│   └── helpers/           # Test helpers
├── contract/              # Contract tests
│   └── api/               # API contract tests
├── e2e/                   # End-to-end tests
│   ├── specs/             # Test specifications
│   ├── support/           # Cypress support files
│   ├── fixtures/          # Test data
│   └── tasks/             # Custom tasks
├── performance/           # Performance tests
│   ├── load/              # Load testing
│   └── helpers/           # Performance utilities
├── security/              # Security tests
└── setup/                 # Global test setup
```

## Running Tests

### Prerequisites

1. **Node.js 18+** installed
2. **PostgreSQL** running on localhost:5432
3. **Redis** running on localhost:6379 (optional for some tests)
4. **Docker** for containerized testing

### Quick Start

```bash
# Install dependencies
npm install

# Run all tests
./scripts/run-tests.sh all

# Run specific test types
./scripts/run-tests.sh unit
./scripts/run-tests.sh integration
./scripts/run-tests.sh e2e
./scripts/run-tests.sh security
./scripts/run-tests.sh performance
```

### Individual Test Commands

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Contract tests
npm run test:contract

# End-to-end tests
npm run test:e2e

# Performance tests
npm run test:performance

# Security tests
npm run test:security

# All tests with coverage
npm run test:all
```

## Test Configuration

### Environment Variables

Tests use the following environment variables:

```bash
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/voxlink_test
REDIS_URL=redis://localhost:6379/1
JWT_SECRET=test-jwt-secret-key-for-testing-only
ENCRYPTION_KEY=test-encryption-key-32-chars-long
VERBOSE_TESTS=false  # Set to true for detailed output
```

### Jest Configuration

The main Jest configuration is in `tests/jest.config.master.js` with project-specific configurations for different test types.

### Cypress Configuration

End-to-end tests use Cypress with configuration in `tests/e2e/cypress.config.ts`.

## Writing Tests

### Unit Tests

Unit tests should be placed in `tests/unit/` and follow this structure:

```typescript
import { renderWithProviders } from '../../setup/test-utils';
import MyComponent from '../../../packages/dashboard/src/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Integration Tests

Integration tests should test API endpoints and database operations:

```typescript
import request from 'supertest';
import { createTestApp } from '../helpers/app-setup';

describe('API Integration', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp('number-service');
  });

  it('should handle API requests', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

### End-to-End Tests

E2E tests use Cypress and should test complete user workflows:

```typescript
describe('User Journey', () => {
  beforeEach(() => {
    cy.seedDatabase();
    cy.loginAsUser();
  });

  it('should complete user workflow', () => {
    cy.visit('/page');
    cy.get('[data-cy=button]').click();
    cy.get('[data-cy=result]').should('be.visible');
  });
});
```

### Performance Tests

Performance tests should measure response times and throughput:

```typescript
describe('Performance Tests', () => {
  it('should handle high load', async () => {
    const loadTest = createLoadTestScenario(app, scenarios, {
      duration: 60,
      concurrency: 50,
    });

    const results = await loadTest();
    expect(results.successRate).toBeGreaterThan(95);
    expect(results.avgDuration).toBeLessThan(500);
  });
});
```

### Security Tests

Security tests should verify authentication, authorization, and data protection:

```typescript
describe('Security Tests', () => {
  it('should prevent unauthorized access', async () => {
    const response = await request(app)
      .get('/api/protected')
      .expect(401);
    
    expect(response.body).toHaveProperty('error');
  });
});
```

## Test Data Management

### Database Seeding

Tests use database seeding for consistent test data:

```typescript
// In beforeEach or beforeAll
await cy.task('db:seed');

// In afterEach or afterAll
await cy.task('db:clean');
```

### Mock Data

Use the test utilities for creating mock data:

```typescript
import { createMockUser, createMockVirtualNumber } from '../../setup/test-utils';

const user = createMockUser({ role: 'admin' });
const number = createMockVirtualNumber({ status: 'ACTIVE' });
```

## Coverage Requirements

The project maintains the following coverage thresholds:

- **Global**: 80% for branches, functions, lines, and statements
- **Critical Services**: 90% for shared services and API gateway
- **API Gateway**: 85% for all metrics

Coverage reports are generated in `tests/coverage/` and uploaded to Codecov in CI.

## Continuous Integration

Tests run automatically on:

- **Pull Requests**: Unit, integration, contract, and security tests
- **Main Branch**: All tests including E2E
- **Scheduled**: Performance tests run daily
- **Manual**: Performance tests can be triggered with `[perf-test]` in commit message

## Performance Benchmarks

The following performance benchmarks should be maintained:

- **API Response Time**: < 500ms average, < 1000ms 95th percentile
- **Database Queries**: < 100ms for simple queries, < 500ms for complex queries
- **Page Load Time**: < 3 seconds for initial load, < 2 seconds for FCP
- **Memory Usage**: < 100MB for client-side applications
- **Throughput**: > 100 requests/second for API endpoints

## Debugging Tests

### Local Debugging

```bash
# Run tests in watch mode
npm run test:unit -- --watch

# Run specific test file
npm run test:unit -- MyComponent.test.tsx

# Run tests with verbose output
VERBOSE_TESTS=true npm run test:unit

# Debug Cypress tests
npm run test:e2e -- --headed
```

### CI Debugging

- Check GitHub Actions logs for detailed error messages
- Download test artifacts (screenshots, videos, reports)
- Review coverage reports for missing test coverage
- Check performance reports for regression analysis

## Best Practices

### General

1. **Test Naming**: Use descriptive test names that explain the expected behavior
2. **Test Structure**: Follow Arrange-Act-Assert pattern
3. **Test Isolation**: Each test should be independent and not rely on other tests
4. **Mock External Services**: Use mocks for external APIs and services
5. **Clean Up**: Always clean up test data and resources

### React Testing

1. **Use Testing Library**: Prefer `@testing-library/react` over Enzyme
2. **Test User Interactions**: Focus on testing user behavior, not implementation
3. **Accessibility**: Include accessibility tests with `jest-axe`
4. **Mock API Calls**: Use MSW or similar for mocking API responses

### API Testing

1. **Test All HTTP Methods**: Cover GET, POST, PUT, DELETE operations
2. **Test Error Cases**: Include tests for 4xx and 5xx responses
3. **Test Authentication**: Verify auth requirements and permissions
4. **Test Validation**: Ensure input validation works correctly

### Performance Testing

1. **Realistic Load**: Use realistic user scenarios and data volumes
2. **Gradual Ramp-up**: Gradually increase load to identify breaking points
3. **Monitor Resources**: Track CPU, memory, and database performance
4. **Set Baselines**: Establish performance baselines and track regressions

### Security Testing

1. **Test Authentication**: Verify login, logout, and session management
2. **Test Authorization**: Check role-based access controls
3. **Test Input Validation**: Prevent injection attacks and XSS
4. **Test Data Protection**: Ensure sensitive data is properly encrypted

## Troubleshooting

### Common Issues

1. **Database Connection Errors**: Ensure PostgreSQL is running and accessible
2. **Port Conflicts**: Check that required ports (3000, 8000, 5432, 6379) are available
3. **Memory Issues**: Increase Node.js memory limit for large test suites
4. **Timeout Errors**: Increase test timeouts for slow operations

### Getting Help

1. Check the test logs for detailed error messages
2. Review the test documentation and examples
3. Ask for help in the team chat or create an issue
4. Consult the testing framework documentation (Jest, Cypress, etc.)

## Contributing

When adding new features:

1. **Write Tests First**: Follow TDD approach when possible
2. **Maintain Coverage**: Ensure new code meets coverage requirements
3. **Update Documentation**: Update this guide when adding new test types
4. **Review Test Performance**: Ensure tests run efficiently

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Cypress Documentation](https://docs.cypress.io/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)