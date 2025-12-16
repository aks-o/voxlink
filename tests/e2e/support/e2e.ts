// Import Cypress commands
import './commands';

// Import third-party plugins
import '@cypress/code-coverage/support';
import 'cypress-axe';
import 'cypress-real-events';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // that are expected in our application
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});

// Global hooks
beforeEach(() => {
  // Clear local storage and cookies before each test
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Set up viewport
  cy.viewport(1280, 720);
  
  // Intercept common API calls
  cy.intercept('GET', '/api/health', { fixture: 'health-check.json' }).as('healthCheck');
  cy.intercept('GET', '/api/user/profile', { fixture: 'user-profile.json' }).as('userProfile');
  
  // Set up performance monitoring
  cy.window().then((win) => {
    win.performance.mark('test-start');
  });
});

afterEach(() => {
  // Capture performance metrics
  cy.window().then((win) => {
    win.performance.mark('test-end');
    win.performance.measure('test-duration', 'test-start', 'test-end');
    
    const measures = win.performance.getEntriesByType('measure');
    const testDuration = measures.find(m => m.name === 'test-duration');
    
    if (testDuration && testDuration.duration > 5000) {
      cy.log(`⚠️ Slow test detected: ${testDuration.duration}ms`);
    }
  });
  
  // Clean up any test data
  cy.task('db:clean', null, { failOnStatusCode: false });
});

// Custom error handling
Cypress.on('fail', (error, runnable) => {
  // Log additional context on test failure
  cy.log('Test failed:', error.message);
  cy.screenshot('failure-screenshot');
  
  // Capture network logs
  cy.window().then((win) => {
    const networkLogs = (win as any).networkLogs || [];
    if (networkLogs.length > 0) {
      cy.writeFile('tests/e2e/logs/network-failure.json', networkLogs);
    }
  });
  
  throw error;
});

// Performance monitoring setup
Cypress.on('window:before:load', (win) => {
  // Capture network requests for debugging
  (win as any).networkLogs = [];
  
  const originalFetch = win.fetch;
  win.fetch = function(...args) {
    const startTime = Date.now();
    return originalFetch.apply(this, args).then((response) => {
      const endTime = Date.now();
      (win as any).networkLogs.push({
        url: args[0],
        method: args[1]?.method || 'GET',
        status: response.status,
        duration: endTime - startTime,
        timestamp: new Date().toISOString(),
      });
      return response;
    });
  };
});

// Accessibility testing setup
beforeEach(() => {
  cy.injectAxe();
});

// Mobile testing helpers
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667); // iPhone SE dimensions
});

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024); // iPad dimensions
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720); // Desktop dimensions
});

// Performance testing helpers
Cypress.Commands.add('measurePageLoad', () => {
  cy.window().then((win) => {
    const navigation = win.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigation.loadEventEnd - navigation.navigationStart;
    
    cy.log(`Page load time: ${loadTime}ms`);
    
    // Assert reasonable load time
    expect(loadTime).to.be.lessThan(3000, 'Page should load within 3 seconds');
  });
});

Cypress.Commands.add('measureFirstContentfulPaint', () => {
  cy.window().then((win) => {
    const paintEntries = win.performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    
    if (fcp) {
      cy.log(`First Contentful Paint: ${fcp.startTime}ms`);
      expect(fcp.startTime).to.be.lessThan(2000, 'FCP should be under 2 seconds');
    }
  });
});

// Database helpers
Cypress.Commands.add('seedDatabase', () => {
  cy.task('db:seed');
});

Cypress.Commands.add('cleanDatabase', () => {
  cy.task('db:clean');
});

Cypress.Commands.add('resetDatabase', () => {
  cy.task('db:reset');
});

// API helpers
Cypress.Commands.add('createTestUser', (userData = {}) => {
  const defaultUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
    name: 'Test User',
    role: 'user',
  };
  
  return cy.task('api:createUser', { ...defaultUser, ...userData });
});

Cypress.Commands.add('createTestNumber', (numberData = {}) => {
  const defaultNumber = {
    phoneNumber: `+1555${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
    countryCode: 'US',
    areaCode: '555',
    city: 'Test City',
    state: 'TX',
    status: 'AVAILABLE',
    features: ['SMS', 'VOICE'],
    monthlyPrice: 5.00,
    setupPrice: 0.00,
    provider: 'twilio',
  };
  
  return cy.task('api:createNumber', { ...defaultNumber, ...numberData });
});

// Authentication helpers
Cypress.Commands.add('loginAsUser', (credentials = {}) => {
  const defaultCredentials = {
    email: Cypress.env('testUser').email,
    password: Cypress.env('testUser').password,
  };
  
  const creds = { ...defaultCredentials, ...credentials };
  
  cy.visit('/login');
  cy.get('[data-cy=email-input]').type(creds.email);
  cy.get('[data-cy=password-input]').type(creds.password);
  cy.get('[data-cy=login-button]').click();
  
  // Wait for successful login
  cy.url().should('not.include', '/login');
  cy.get('[data-cy=user-menu]').should('be.visible');
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.loginAsUser(Cypress.env('adminUser'));
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-cy=user-menu]').click();
  cy.get('[data-cy=logout-button]').click();
  cy.url().should('include', '/login');
});

// Form helpers
Cypress.Commands.add('fillForm', (formData) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[data-cy=${field}-input]`).clear().type(value as string);
  });
});

Cypress.Commands.add('submitForm', (formSelector = 'form') => {
  cy.get(formSelector).submit();
});

// Wait helpers
Cypress.Commands.add('waitForApiCall', (alias) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response?.statusCode).to.be.oneOf([200, 201, 204]);
  });
});

Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-cy=loading-spinner]').should('not.exist');
  cy.get('[data-cy=page-content]').should('be.visible');
});

// Accessibility helpers
Cypress.Commands.add('checkA11y', (context?, options?) => {
  cy.checkA11y(context, options, (violations) => {
    violations.forEach((violation) => {
      cy.log(`A11y violation: ${violation.description}`);
      violation.nodes.forEach((node) => {
        cy.log(`Element: ${node.target.join(', ')}`);
      });
    });
  });
});

// Visual regression helpers (if using Percy or similar)
Cypress.Commands.add('visualSnapshot', (name) => {
  // This would integrate with visual testing tools
  cy.screenshot(name);
});

// Error handling helpers
Cypress.Commands.add('expectNoConsoleErrors', () => {
  cy.window().then((win) => {
    const errors = (win as any).consoleErrors || [];
    expect(errors).to.have.length(0, `Console errors found: ${errors.join(', ')}`);
  });
});

// Setup console error tracking
Cypress.on('window:before:load', (win) => {
  (win as any).consoleErrors = [];
  
  const originalError = win.console.error;
  win.console.error = function(...args) {
    (win as any).consoleErrors.push(args.join(' '));
    return originalError.apply(this, args);
  };
});