/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      // Authentication commands
      loginAsUser(credentials?: { email?: string; password?: string }): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      logout(): Chainable<void>;
      
      // Database commands
      seedDatabase(): Chainable<void>;
      cleanDatabase(): Chainable<void>;
      resetDatabase(): Chainable<void>;
      
      // API commands
      createTestUser(userData?: any): Chainable<any>;
      createTestNumber(numberData?: any): Chainable<any>;
      
      // Form commands
      fillForm(formData: Record<string, string>): Chainable<void>;
      submitForm(formSelector?: string): Chainable<void>;
      
      // Viewport commands
      setMobileViewport(): Chainable<void>;
      setTabletViewport(): Chainable<void>;
      setDesktopViewport(): Chainable<void>;
      
      // Performance commands
      measurePageLoad(): Chainable<void>;
      measureFirstContentfulPaint(): Chainable<void>;
      
      // Wait commands
      waitForApiCall(alias: string): Chainable<void>;
      waitForPageLoad(): Chainable<void>;
      
      // Accessibility commands
      checkA11y(context?: any, options?: any): Chainable<void>;
      
      // Visual testing commands
      visualSnapshot(name: string): Chainable<void>;
      
      // Error handling commands
      expectNoConsoleErrors(): Chainable<void>;
      
      // Number management specific commands
      searchNumbers(criteria: {
        countryCode?: string;
        areaCode?: string;
        city?: string;
        features?: string[];
      }): Chainable<void>;
      
      purchaseNumber(numberId: string): Chainable<void>;
      
      configureNumber(numberId: string, config: {
        forwardingEnabled?: boolean;
        forwardingNumber?: string;
        smsEnabled?: boolean;
        voiceEnabled?: boolean;
        recordingEnabled?: boolean;
      }): Chainable<void>;
      
      testNumberConfiguration(numberId: string, testType: 'sms' | 'voice'): Chainable<void>;
      
      // Dashboard specific commands
      checkDashboardMetrics(): Chainable<void>;
      verifyRealtimeUpdates(): Chainable<void>;
      
      // Billing specific commands
      viewInvoices(): Chainable<void>;
      downloadInvoice(invoiceId: string): Chainable<void>;
      updatePaymentMethod(paymentData: any): Chainable<void>;
      
      // Notification specific commands
      checkNotifications(): Chainable<void>;
      markNotificationAsRead(notificationId: string): Chainable<void>;
      updateNotificationPreferences(preferences: any): Chainable<void>;
      
      // Security specific commands
      enableTwoFactor(): Chainable<void>;
      disableTwoFactor(): Chainable<void>;
      changePassword(oldPassword: string, newPassword: string): Chainable<void>;
      
      // Integration specific commands
      configureWebhook(webhookData: any): Chainable<void>;
      testWebhook(webhookId: string): Chainable<void>;
      
      // Mobile specific commands
      swipeLeft(): Chainable<void>;
      swipeRight(): Chainable<void>;
      pinchZoom(scale: number): Chainable<void>;
      
      // Performance testing commands
      measureApiResponseTime(endpoint: string): Chainable<number>;
      checkMemoryUsage(): Chainable<void>;
      monitorNetworkRequests(): Chainable<void>;
    }
  }
}

// Number management commands
Cypress.Commands.add('searchNumbers', (criteria) => {
  cy.visit('/numbers/search');
  cy.waitForPageLoad();
  
  if (criteria.countryCode) {
    cy.get('[data-cy=country-select]').select(criteria.countryCode);
  }
  
  if (criteria.areaCode) {
    cy.get('[data-cy=area-code-input]').type(criteria.areaCode);
  }
  
  if (criteria.city) {
    cy.get('[data-cy=city-input]').type(criteria.city);
  }
  
  if (criteria.features && criteria.features.length > 0) {
    criteria.features.forEach(feature => {
      cy.get(`[data-cy=feature-${feature.toLowerCase()}]`).check();
    });
  }
  
  cy.get('[data-cy=search-button]').click();
  cy.get('[data-cy=search-results]').should('be.visible');
});

Cypress.Commands.add('purchaseNumber', (numberId) => {
  cy.get(`[data-cy=number-${numberId}]`).within(() => {
    cy.get('[data-cy=purchase-button]').click();
  });
  
  // Confirm purchase in modal
  cy.get('[data-cy=confirm-purchase-modal]').should('be.visible');
  cy.get('[data-cy=confirm-purchase-button]').click();
  
  // Wait for success message
  cy.get('[data-cy=success-message]').should('contain', 'Number purchased successfully');
});

Cypress.Commands.add('configureNumber', (numberId, config) => {
  cy.visit(`/numbers/${numberId}/configuration`);
  cy.waitForPageLoad();
  
  if (config.forwardingEnabled !== undefined) {
    const action = config.forwardingEnabled ? 'check' : 'uncheck';
    cy.get('[data-cy=forwarding-enabled]')[action]();
  }
  
  if (config.forwardingNumber) {
    cy.get('[data-cy=forwarding-number]').clear().type(config.forwardingNumber);
  }
  
  if (config.smsEnabled !== undefined) {
    const action = config.smsEnabled ? 'check' : 'uncheck';
    cy.get('[data-cy=sms-enabled]')[action]();
  }
  
  if (config.voiceEnabled !== undefined) {
    const action = config.voiceEnabled ? 'check' : 'uncheck';
    cy.get('[data-cy=voice-enabled]')[action]();
  }
  
  if (config.recordingEnabled !== undefined) {
    const action = config.recordingEnabled ? 'check' : 'uncheck';
    cy.get('[data-cy=recording-enabled]')[action]();
  }
  
  cy.get('[data-cy=save-configuration]').click();
  cy.get('[data-cy=success-message]').should('contain', 'Configuration saved');
});

Cypress.Commands.add('testNumberConfiguration', (numberId, testType) => {
  cy.visit(`/numbers/${numberId}/configuration`);
  cy.waitForPageLoad();
  
  cy.get(`[data-cy=test-${testType}]`).click();
  
  if (testType === 'sms') {
    cy.get('[data-cy=test-sms-modal]').should('be.visible');
    cy.get('[data-cy=test-phone-number]').type('+1234567890');
    cy.get('[data-cy=test-message]').type('This is a test SMS message');
    cy.get('[data-cy=send-test-sms]').click();
  } else if (testType === 'voice') {
    cy.get('[data-cy=test-voice-modal]').should('be.visible');
    cy.get('[data-cy=test-phone-number]').type('+1234567890');
    cy.get('[data-cy=test-message]').type('This is a test voice message');
    cy.get('[data-cy=make-test-call]').click();
  }
  
  cy.get('[data-cy=test-success-message]').should('be.visible');
});

// Dashboard commands
Cypress.Commands.add('checkDashboardMetrics', () => {
  cy.visit('/dashboard');
  cy.waitForPageLoad();
  
  // Check that all metric cards are visible and have values
  cy.get('[data-cy=total-numbers-metric]').should('be.visible').and('contain.text', /\d+/);
  cy.get('[data-cy=active-numbers-metric]').should('be.visible').and('contain.text', /\d+/);
  cy.get('[data-cy=total-calls-metric]').should('be.visible').and('contain.text', /\d+/);
  cy.get('[data-cy=total-sms-metric]').should('be.visible').and('contain.text', /\d+/);
  
  // Check that charts are rendered
  cy.get('[data-cy=usage-chart]').should('be.visible');
  cy.get('[data-cy=performance-chart]').should('be.visible');
});

Cypress.Commands.add('verifyRealtimeUpdates', () => {
  cy.visit('/dashboard');
  cy.waitForPageLoad();
  
  // Get initial metric value
  cy.get('[data-cy=total-calls-metric]').invoke('text').then((initialValue) => {
    // Trigger an action that should update metrics (e.g., make a test call)
    cy.get('[data-cy=make-test-call]').click();
    
    // Wait for realtime update
    cy.get('[data-cy=total-calls-metric]', { timeout: 10000 })
      .should('not.contain.text', initialValue);
  });
});

// Billing commands
Cypress.Commands.add('viewInvoices', () => {
  cy.visit('/billing/invoices');
  cy.waitForPageLoad();
  
  cy.get('[data-cy=invoices-table]').should('be.visible');
  cy.get('[data-cy=invoice-row]').should('have.length.greaterThan', 0);
});

Cypress.Commands.add('downloadInvoice', (invoiceId) => {
  cy.get(`[data-cy=invoice-${invoiceId}]`).within(() => {
    cy.get('[data-cy=download-button]').click();
  });
  
  // Verify download started
  cy.readFile('cypress/downloads/invoice.pdf', { timeout: 10000 }).should('exist');
});

Cypress.Commands.add('updatePaymentMethod', (paymentData) => {
  cy.visit('/billing/payment-methods');
  cy.waitForPageLoad();
  
  cy.get('[data-cy=add-payment-method]').click();
  cy.get('[data-cy=payment-modal]').should('be.visible');
  
  cy.get('[data-cy=card-number]').type(paymentData.cardNumber);
  cy.get('[data-cy=expiry-date]').type(paymentData.expiryDate);
  cy.get('[data-cy=cvv]').type(paymentData.cvv);
  cy.get('[data-cy=cardholder-name]').type(paymentData.cardholderName);
  
  cy.get('[data-cy=save-payment-method]').click();
  cy.get('[data-cy=success-message]').should('contain', 'Payment method added');
});

// Security commands
Cypress.Commands.add('enableTwoFactor', () => {
  cy.visit('/security/settings');
  cy.waitForPageLoad();
  
  cy.get('[data-cy=enable-2fa]').click();
  cy.get('[data-cy=2fa-setup-modal]').should('be.visible');
  
  // Get QR code and setup instructions
  cy.get('[data-cy=qr-code]').should('be.visible');
  cy.get('[data-cy=backup-codes]').should('be.visible');
  
  // Enter verification code (in real test, this would come from authenticator app)
  cy.get('[data-cy=verification-code]').type('123456');
  cy.get('[data-cy=verify-2fa]').click();
  
  cy.get('[data-cy=2fa-enabled-message]').should('be.visible');
});

Cypress.Commands.add('changePassword', (oldPassword, newPassword) => {
  cy.visit('/security/settings');
  cy.waitForPageLoad();
  
  cy.get('[data-cy=change-password-section]').within(() => {
    cy.get('[data-cy=current-password]').type(oldPassword);
    cy.get('[data-cy=new-password]').type(newPassword);
    cy.get('[data-cy=confirm-password]').type(newPassword);
    cy.get('[data-cy=change-password-button]').click();
  });
  
  cy.get('[data-cy=password-changed-message]').should('be.visible');
});

// Mobile specific commands
Cypress.Commands.add('swipeLeft', () => {
  cy.get('body').trigger('touchstart', { touches: [{ clientX: 300, clientY: 300 }] });
  cy.get('body').trigger('touchmove', { touches: [{ clientX: 100, clientY: 300 }] });
  cy.get('body').trigger('touchend');
});

Cypress.Commands.add('swipeRight', () => {
  cy.get('body').trigger('touchstart', { touches: [{ clientX: 100, clientY: 300 }] });
  cy.get('body').trigger('touchmove', { touches: [{ clientX: 300, clientY: 300 }] });
  cy.get('body').trigger('touchend');
});

// Performance testing commands
Cypress.Commands.add('measureApiResponseTime', (endpoint) => {
  const startTime = Date.now();
  
  return cy.request(endpoint).then(() => {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    cy.log(`API response time for ${endpoint}: ${responseTime}ms`);
    return cy.wrap(responseTime);
  });
});

Cypress.Commands.add('checkMemoryUsage', () => {
  cy.window().then((win) => {
    if ('memory' in win.performance) {
      const memory = (win.performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
      
      cy.log(`Memory usage: ${usedMB}MB / ${totalMB}MB`);
      
      // Assert reasonable memory usage (less than 100MB)
      expect(usedMB).to.be.lessThan(100, 'Memory usage should be under 100MB');
    }
  });
});

Cypress.Commands.add('monitorNetworkRequests', () => {
  cy.window().then((win) => {
    const networkLogs = (win as any).networkLogs || [];
    
    // Check for slow requests (over 2 seconds)
    const slowRequests = networkLogs.filter((log: any) => log.duration > 2000);
    if (slowRequests.length > 0) {
      cy.log(`⚠️ Slow network requests detected:`, slowRequests);
    }
    
    // Check for failed requests
    const failedRequests = networkLogs.filter((log: any) => log.status >= 400);
    if (failedRequests.length > 0) {
      cy.log(`❌ Failed network requests:`, failedRequests);
    }
    
    expect(failedRequests).to.have.length(0, 'No failed network requests should occur');
  });
});

export {};