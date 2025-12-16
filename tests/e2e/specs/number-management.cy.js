"use strict";
describe('Number Management E2E Tests', () => {
    beforeEach(() => {
        cy.seedDatabase();
        cy.loginAsUser();
    });
    afterEach(() => {
        cy.cleanDatabase();
    });
    describe('Number Search and Purchase', () => {
        it('should search for available numbers and purchase one', () => {
            // Search for numbers
            cy.searchNumbers({
                countryCode: 'US',
                areaCode: '555',
                features: ['SMS', 'VOICE']
            });
            // Verify search results
            cy.get('[data-cy=search-results]').should('be.visible');
            cy.get('[data-cy=number-card]').should('have.length.greaterThan', 0);
            // Check number details
            cy.get('[data-cy=number-card]').first().within(() => {
                cy.get('[data-cy=phone-number]').should('contain', '+1555');
                cy.get('[data-cy=monthly-price]').should('contain', '$');
                cy.get('[data-cy=features-list]').should('contain', 'SMS');
                cy.get('[data-cy=features-list]').should('contain', 'VOICE');
                cy.get('[data-cy=purchase-button]').should('be.visible');
            });
            // Purchase the first available number
            cy.get('[data-cy=number-card]').first().within(() => {
                cy.get('[data-cy=phone-number]').invoke('text').as('purchasedNumber');
                cy.get('[data-cy=purchase-button]').click();
            });
            // Confirm purchase
            cy.get('[data-cy=purchase-confirmation-modal]').should('be.visible');
            cy.get('[data-cy=purchase-details]').should('be.visible');
            cy.get('[data-cy=confirm-purchase-button]').click();
            // Verify purchase success
            cy.get('[data-cy=success-message]').should('contain', 'Number purchased successfully');
            cy.get('[data-cy=purchase-confirmation-modal]').should('not.exist');
            // Verify number appears in inventory
            cy.visit('/numbers/inventory');
            cy.waitForPageLoad();
            cy.get('@purchasedNumber').then((phoneNumber) => {
                cy.get('[data-cy=owned-numbers-table]').should('contain', phoneNumber);
                cy.get(`[data-cy=number-row-${phoneNumber}]`).within(() => {
                    cy.get('[data-cy=status]').should('contain', 'Active');
                    cy.get('[data-cy=configure-button]').should('be.visible');
                });
            });
        });
        it('should filter search results by different criteria', () => {
            // Test area code filter
            cy.searchNumbers({ countryCode: 'US', areaCode: '212' });
            cy.get('[data-cy=number-card]').each(($card) => {
                cy.wrap($card).find('[data-cy=phone-number]').should('contain', '+1212');
            });
            // Test city filter
            cy.get('[data-cy=clear-filters]').click();
            cy.searchNumbers({ countryCode: 'US', city: 'New York' });
            cy.get('[data-cy=number-card]').each(($card) => {
                cy.wrap($card).find('[data-cy=location]').should('contain', 'New York');
            });
            // Test feature filter
            cy.get('[data-cy=clear-filters]').click();
            cy.searchNumbers({ countryCode: 'US', features: ['MMS'] });
            cy.get('[data-cy=number-card]').each(($card) => {
                cy.wrap($card).find('[data-cy=features-list]').should('contain', 'MMS');
            });
        });
        it('should handle search with no results', () => {
            cy.searchNumbers({
                countryCode: 'US',
                areaCode: '999', // Non-existent area code
            });
            cy.get('[data-cy=no-results-message]').should('be.visible');
            cy.get('[data-cy=no-results-message]').should('contain', 'No numbers found');
            cy.get('[data-cy=search-suggestions]').should('be.visible');
        });
        it('should show loading states during search', () => {
            cy.intercept('GET', '/api/numbers/search*', { delay: 2000 }).as('slowSearch');
            cy.visit('/numbers/search');
            cy.get('[data-cy=country-select]').select('US');
            cy.get('[data-cy=search-button]').click();
            cy.get('[data-cy=search-loading]').should('be.visible');
            cy.get('[data-cy=search-button]').should('be.disabled');
            cy.wait('@slowSearch');
            cy.get('[data-cy=search-loading]').should('not.exist');
            cy.get('[data-cy=search-button]').should('not.be.disabled');
        });
    });
    describe('Number Configuration', () => {
        let testNumber;
        beforeEach(() => {
            cy.createTestNumber({ ownerId: '1', status: 'ACTIVE' }).then((number) => {
                testNumber = number;
            });
        });
        it('should configure number settings successfully', () => {
            cy.configureNumber(testNumber.id, {
                forwardingEnabled: true,
                forwardingNumber: '+1987654321',
                smsEnabled: true,
                voiceEnabled: true,
                recordingEnabled: false,
            });
            // Verify configuration was saved
            cy.visit(`/numbers/${testNumber.id}/configuration`);
            cy.waitForPageLoad();
            cy.get('[data-cy=forwarding-enabled]').should('be.checked');
            cy.get('[data-cy=forwarding-number]').should('have.value', '+1987654321');
            cy.get('[data-cy=sms-enabled]').should('be.checked');
            cy.get('[data-cy=voice-enabled]').should('be.checked');
            cy.get('[data-cy=recording-enabled]').should('not.be.checked');
        });
        it('should test SMS functionality', () => {
            cy.testNumberConfiguration(testNumber.id, 'sms');
            // Verify test was successful
            cy.get('[data-cy=test-results]').should('be.visible');
            cy.get('[data-cy=test-status]').should('contain', 'Success');
            cy.get('[data-cy=test-details]').should('contain', 'SMS sent successfully');
        });
        it('should test voice functionality', () => {
            cy.testNumberConfiguration(testNumber.id, 'voice');
            // Verify test was successful
            cy.get('[data-cy=test-results]').should('be.visible');
            cy.get('[data-cy=test-status]').should('contain', 'Success');
            cy.get('[data-cy=test-details]').should('contain', 'Call initiated successfully');
        });
        it('should validate configuration inputs', () => {
            cy.visit(`/numbers/${testNumber.id}/configuration`);
            cy.waitForPageLoad();
            // Test invalid forwarding number
            cy.get('[data-cy=forwarding-enabled]').check();
            cy.get('[data-cy=forwarding-number]').clear().type('invalid-phone');
            cy.get('[data-cy=save-configuration]').click();
            cy.get('[data-cy=validation-error]').should('contain', 'Invalid phone number');
            cy.get('[data-cy=forwarding-number]').should('have.class', 'error');
        });
        it('should show configuration history', () => {
            // Make multiple configuration changes
            cy.configureNumber(testNumber.id, { smsEnabled: false });
            cy.configureNumber(testNumber.id, { voiceEnabled: false });
            cy.configureNumber(testNumber.id, { recordingEnabled: true });
            // Check configuration history
            cy.visit(`/numbers/${testNumber.id}/configuration`);
            cy.get('[data-cy=configuration-history]').click();
            cy.get('[data-cy=history-modal]').should('be.visible');
            cy.get('[data-cy=history-entry]').should('have.length', 3);
            cy.get('[data-cy=history-entry]').first().within(() => {
                cy.get('[data-cy=change-description]').should('contain', 'Recording enabled');
                cy.get('[data-cy=change-timestamp]').should('be.visible');
            });
        });
    });
    describe('Number Inventory Management', () => {
        beforeEach(() => {
            // Create multiple test numbers
            cy.createTestNumber({ ownerId: '1', status: 'ACTIVE', phoneNumber: '+15551234567' });
            cy.createTestNumber({ ownerId: '1', status: 'ACTIVE', phoneNumber: '+15551234568' });
            cy.createTestNumber({ ownerId: '1', status: 'SUSPENDED', phoneNumber: '+15551234569' });
        });
        it('should display all owned numbers', () => {
            cy.visit('/numbers/inventory');
            cy.waitForPageLoad();
            cy.get('[data-cy=owned-numbers-table]').should('be.visible');
            cy.get('[data-cy=number-row]').should('have.length', 3);
            // Check table headers
            cy.get('[data-cy=table-header]').should('contain', 'Phone Number');
            cy.get('[data-cy=table-header]').should('contain', 'Status');
            cy.get('[data-cy=table-header]').should('contain', 'Features');
            cy.get('[data-cy=table-header]').should('contain', 'Monthly Cost');
            cy.get('[data-cy=table-header]').should('contain', 'Actions');
        });
        it('should filter numbers by status', () => {
            cy.visit('/numbers/inventory');
            cy.waitForPageLoad();
            // Filter by active status
            cy.get('[data-cy=status-filter]').select('ACTIVE');
            cy.get('[data-cy=number-row]').should('have.length', 2);
            cy.get('[data-cy=number-row]').each(($row) => {
                cy.wrap($row).find('[data-cy=status]').should('contain', 'Active');
            });
            // Filter by suspended status
            cy.get('[data-cy=status-filter]').select('SUSPENDED');
            cy.get('[data-cy=number-row]').should('have.length', 1);
            cy.get('[data-cy=number-row]').first().find('[data-cy=status]').should('contain', 'Suspended');
        });
        it('should sort numbers by different columns', () => {
            cy.visit('/numbers/inventory');
            cy.waitForPageLoad();
            // Sort by phone number
            cy.get('[data-cy=sort-phone-number]').click();
            cy.get('[data-cy=number-row]').first().should('contain', '+15551234567');
            // Sort by phone number descending
            cy.get('[data-cy=sort-phone-number]').click();
            cy.get('[data-cy=number-row]').first().should('contain', '+15551234569');
            // Sort by status
            cy.get('[data-cy=sort-status]').click();
            cy.get('[data-cy=number-row]').first().find('[data-cy=status]').should('contain', 'Active');
        });
        it('should perform bulk actions on numbers', () => {
            cy.visit('/numbers/inventory');
            cy.waitForPageLoad();
            // Select multiple numbers
            cy.get('[data-cy=select-all]').check();
            cy.get('[data-cy=number-checkbox]').should('be.checked');
            // Perform bulk action
            cy.get('[data-cy=bulk-actions]').select('suspend');
            cy.get('[data-cy=apply-bulk-action]').click();
            // Confirm bulk action
            cy.get('[data-cy=bulk-action-modal]').should('be.visible');
            cy.get('[data-cy=confirm-bulk-action]').click();
            // Verify action was applied
            cy.get('[data-cy=success-message]').should('contain', 'Numbers updated successfully');
        });
    });
    describe('Usage Analytics', () => {
        let testNumber;
        beforeEach(() => {
            cy.createTestNumber({ ownerId: '1', status: 'ACTIVE' }).then((number) => {
                testNumber = number;
                // Create usage records
                cy.task('api:createUsageRecords', {
                    numberId: number.id,
                    records: [
                        { type: 'SMS_OUTBOUND', quantity: 50, cost: 5.00 },
                        { type: 'SMS_INBOUND', quantity: 30, cost: 3.00 },
                        { type: 'VOICE_OUTBOUND', quantity: 120, cost: 2.40 },
                        { type: 'VOICE_INBOUND', quantity: 90, cost: 1.80 },
                    ],
                });
            });
        });
        it('should display usage statistics', () => {
            cy.visit(`/numbers/${testNumber.id}/usage`);
            cy.waitForPageLoad();
            // Check summary statistics
            cy.get('[data-cy=usage-summary]').should('be.visible');
            cy.get('[data-cy=total-cost]').should('contain', '$12.20');
            cy.get('[data-cy=sms-count]').should('contain', '80');
            cy.get('[data-cy=voice-minutes]').should('contain', '3.5');
            // Check usage chart
            cy.get('[data-cy=usage-chart]').should('be.visible');
            cy.get('[data-cy=chart-legend]').should('contain', 'SMS');
            cy.get('[data-cy=chart-legend]').should('contain', 'Voice');
        });
        it('should filter usage by date range', () => {
            cy.visit(`/numbers/${testNumber.id}/usage`);
            cy.waitForPageLoad();
            // Set date range
            cy.get('[data-cy=date-range-picker]').click();
            cy.get('[data-cy=start-date]').type('2023-01-01');
            cy.get('[data-cy=end-date]').type('2023-01-31');
            cy.get('[data-cy=apply-date-range]').click();
            // Verify filtered results
            cy.get('[data-cy=usage-records]').should('be.visible');
            cy.get('[data-cy=date-range-display]').should('contain', 'Jan 1 - Jan 31, 2023');
        });
        it('should export usage data', () => {
            cy.visit(`/numbers/${testNumber.id}/usage`);
            cy.waitForPageLoad();
            cy.get('[data-cy=export-usage]').click();
            cy.get('[data-cy=export-format]').select('CSV');
            cy.get('[data-cy=confirm-export]').click();
            // Verify download
            cy.readFile('cypress/downloads/usage-report.csv', { timeout: 10000 }).should('exist');
        });
    });
    describe('Mobile Responsiveness', () => {
        beforeEach(() => {
            cy.setMobileViewport();
        });
        it('should display mobile-friendly number search', () => {
            cy.visit('/numbers/search');
            cy.waitForPageLoad();
            // Check mobile layout
            cy.get('[data-cy=mobile-search-form]').should('be.visible');
            cy.get('[data-cy=desktop-search-form]').should('not.be.visible');
            // Test mobile search
            cy.get('[data-cy=mobile-country-select]').select('US');
            cy.get('[data-cy=mobile-search-button]').click();
            // Check mobile results
            cy.get('[data-cy=mobile-number-cards]').should('be.visible');
            cy.get('[data-cy=mobile-number-card]').should('have.length.greaterThan', 0);
        });
        it('should support mobile gestures', () => {
            cy.visit('/numbers/inventory');
            cy.waitForPageLoad();
            // Test swipe to reveal actions
            cy.get('[data-cy=mobile-number-item]').first().as('numberItem');
            cy.get('@numberItem').swipeLeft();
            cy.get('@numberItem').find('[data-cy=mobile-actions]').should('be.visible');
            // Test pull to refresh
            cy.get('body').trigger('touchstart', { touches: [{ clientX: 200, clientY: 100 }] });
            cy.get('body').trigger('touchmove', { touches: [{ clientX: 200, clientY: 300 }] });
            cy.get('body').trigger('touchend');
            cy.get('[data-cy=pull-to-refresh]').should('be.visible');
        });
    });
    describe('Performance and Accessibility', () => {
        it('should load pages within acceptable time limits', () => {
            cy.visit('/numbers/search');
            cy.measurePageLoad();
            cy.measureFirstContentfulPaint();
        });
        it('should be accessible to screen readers', () => {
            cy.visit('/numbers/search');
            cy.waitForPageLoad();
            cy.checkA11y();
            cy.visit('/numbers/inventory');
            cy.waitForPageLoad();
            cy.checkA11y();
        });
        it('should handle network failures gracefully', () => {
            // Simulate network failure
            cy.intercept('GET', '/api/numbers/search*', { forceNetworkError: true }).as('networkError');
            cy.visit('/numbers/search');
            cy.get('[data-cy=country-select]').select('US');
            cy.get('[data-cy=search-button]').click();
            cy.get('[data-cy=error-message]').should('be.visible');
            cy.get('[data-cy=error-message]').should('contain', 'Network error');
            cy.get('[data-cy=retry-button]').should('be.visible');
        });
        it('should maintain performance under load', () => {
            // Create many numbers for performance testing
            const numbers = Array.from({ length: 100 }, (_, i) => ({
                phoneNumber: `+1555${String(i).padStart(7, '0')}`,
                ownerId: '1',
                status: 'ACTIVE',
            }));
            cy.task('api:createManyNumbers', numbers);
            cy.visit('/numbers/inventory');
            cy.measurePageLoad();
            // Check memory usage
            cy.checkMemoryUsage();
            // Monitor network requests
            cy.monitorNetworkRequests();
        });
    });
    describe('Error Handling', () => {
        it('should handle API errors gracefully', () => {
            cy.intercept('POST', '/api/numbers/purchase', { statusCode: 500 }).as('purchaseError');
            cy.visit('/numbers/search');
            cy.searchNumbers({ countryCode: 'US' });
            cy.get('[data-cy=number-card]').first().within(() => {
                cy.get('[data-cy=purchase-button]').click();
            });
            cy.get('[data-cy=confirm-purchase-button]').click();
            cy.wait('@purchaseError');
            cy.get('[data-cy=error-message]').should('be.visible');
            cy.get('[data-cy=error-message]').should('contain', 'Purchase failed');
        });
        it('should validate form inputs', () => {
            cy.visit('/numbers/search');
            // Test invalid area code
            cy.get('[data-cy=area-code-input]').type('invalid');
            cy.get('[data-cy=search-button]').click();
            cy.get('[data-cy=validation-error]').should('contain', 'Invalid area code');
            cy.get('[data-cy=area-code-input]').should('have.class', 'error');
        });
        it('should handle session expiration', () => {
            // Simulate expired session
            cy.intercept('GET', '/api/numbers/search*', { statusCode: 401 }).as('unauthorized');
            cy.visit('/numbers/search');
            cy.get('[data-cy=country-select]').select('US');
            cy.get('[data-cy=search-button]').click();
            cy.wait('@unauthorized');
            // Should redirect to login
            cy.url().should('include', '/login');
            cy.get('[data-cy=session-expired-message]').should('be.visible');
        });
    });
});
