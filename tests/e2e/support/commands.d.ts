declare global {
    namespace Cypress {
        interface Chainable {
            loginAsUser(credentials?: {
                email?: string;
                password?: string;
            }): Chainable<void>;
            loginAsAdmin(): Chainable<void>;
            logout(): Chainable<void>;
            seedDatabase(): Chainable<void>;
            cleanDatabase(): Chainable<void>;
            resetDatabase(): Chainable<void>;
            createTestUser(userData?: any): Chainable<any>;
            createTestNumber(numberData?: any): Chainable<any>;
            fillForm(formData: Record<string, string>): Chainable<void>;
            submitForm(formSelector?: string): Chainable<void>;
            setMobileViewport(): Chainable<void>;
            setTabletViewport(): Chainable<void>;
            setDesktopViewport(): Chainable<void>;
            measurePageLoad(): Chainable<void>;
            measureFirstContentfulPaint(): Chainable<void>;
            waitForApiCall(alias: string): Chainable<void>;
            waitForPageLoad(): Chainable<void>;
            checkA11y(context?: any, options?: any): Chainable<void>;
            visualSnapshot(name: string): Chainable<void>;
            expectNoConsoleErrors(): Chainable<void>;
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
            checkDashboardMetrics(): Chainable<void>;
            verifyRealtimeUpdates(): Chainable<void>;
            viewInvoices(): Chainable<void>;
            downloadInvoice(invoiceId: string): Chainable<void>;
            updatePaymentMethod(paymentData: any): Chainable<void>;
            checkNotifications(): Chainable<void>;
            markNotificationAsRead(notificationId: string): Chainable<void>;
            updateNotificationPreferences(preferences: any): Chainable<void>;
            enableTwoFactor(): Chainable<void>;
            disableTwoFactor(): Chainable<void>;
            changePassword(oldPassword: string, newPassword: string): Chainable<void>;
            configureWebhook(webhookData: any): Chainable<void>;
            testWebhook(webhookId: string): Chainable<void>;
            swipeLeft(): Chainable<void>;
            swipeRight(): Chainable<void>;
            pinchZoom(scale: number): Chainable<void>;
            measureApiResponseTime(endpoint: string): Chainable<number>;
            checkMemoryUsage(): Chainable<void>;
            monitorNetworkRequests(): Chainable<void>;
        }
    }
}
export {};
