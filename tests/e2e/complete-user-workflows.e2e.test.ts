import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Page, Browser, chromium } from 'playwright';
import { setupTestEnvironment, teardownTestEnvironment } from './helpers/app-setup';

describe('Complete User Workflows E2E Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    await setupTestEnvironment();
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser.close();
    await teardownTestEnvironment();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
  });

  afterEach(async () => {
    await page.close();
  });

  describe('User Authentication and Dashboard Access', () => {
    it('should complete full login workflow and access dashboard', async () => {
      // Navigate to login page
      await page.click('[data-testid="login-button"]');
      await page.waitForSelector('[data-testid="login-form"]');

      // Fill login form
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="submit-login"]');

      // Wait for dashboard to load
      await page.waitForSelector('[data-testid="dashboard"]');
      
      // Verify dashboard elements are present
      expect(await page.isVisible('[data-testid="metrics-overview"]')).toBe(true);
      expect(await page.isVisible('[data-testid="recent-activity"]')).toBe(true);
      expect(await page.isVisible('[data-testid="live-calls"]')).toBe(true);
      
      // Verify navigation menu is accessible
      expect(await page.isVisible('[data-testid="sidebar-navigation"]')).toBe(true);
    });

    it('should handle multi-factor authentication workflow', async () => {
      // Login with MFA enabled account
      await page.click('[data-testid="login-button"]');
      await page.fill('[data-testid="email-input"]', 'mfa-user@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="submit-login"]');

      // Wait for MFA prompt
      await page.waitForSelector('[data-testid="mfa-form"]');
      
      // Enter MFA code
      await page.fill('[data-testid="mfa-code-input"]', '123456');
      await page.click('[data-testid="submit-mfa"]');

      // Verify successful login
      await page.waitForSelector('[data-testid="dashboard"]');
      expect(await page.isVisible('[data-testid="dashboard"]')).toBe(true);
    });
  });

  describe('Number Management Workflow', () => {
    beforeEach(async () => {
      // Login before each test
      await page.goto('http://localhost:3000/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="submit-login"]');
      await page.waitForSelector('[data-testid="dashboard"]');
    });

    it('should complete number search and purchase workflow', async () => {
      // Navigate to number search
      await page.click('[data-testid="nav-numbers"]');
      await page.click('[data-testid="nav-number-search"]');
      await page.waitForSelector('[data-testid="number-search-form"]');

      // Search for numbers
      await page.fill('[data-testid="area-code-input"]', '555');
      await page.selectOption('[data-testid="quantity-select"]', '5');
      await page.click('[data-testid="search-numbers-button"]');

      // Wait for search results
      await page.waitForSelector('[data-testid="search-results"]');
      
      // Verify search results are displayed
      const numberCards = await page.locator('[data-testid="number-card"]').count();
      expect(numberCards).toBeGreaterThan(0);

      // Select and purchase a number
      await page.click('[data-testid="number-card"]:first-child [data-testid="purchase-button"]');
      await page.waitForSelector('[data-testid="purchase-confirmation"]');
      
      // Confirm purchase
      await page.click('[data-testid="confirm-purchase"]');
      
      // Wait for success message
      await page.waitForSelector('[data-testid="purchase-success"]');
      expect(await page.isVisible('[data-testid="purchase-success"]')).toBe(true);

      // Verify number appears in inventory
      await page.click('[data-testid="nav-number-inventory"]');
      await page.waitForSelector('[data-testid="number-inventory"]');
      
      const inventoryNumbers = await page.locator('[data-testid="inventory-number"]').count();
      expect(inventoryNumbers).toBeGreaterThan(0);
    });

    it('should complete number configuration workflow', async () => {
      // Navigate to number inventory
      await page.click('[data-testid="nav-numbers"]');
      await page.click('[data-testid="nav-number-inventory"]');
      await page.waitForSelector('[data-testid="number-inventory"]');

      // Configure a number
      await page.click('[data-testid="inventory-number"]:first-child [data-testid="configure-button"]');
      await page.waitForSelector('[data-testid="number-configuration"]');

      // Set up call forwarding
      await page.click('[data-testid="enable-forwarding"]');
      await page.fill('[data-testid="forward-to-number"]', '+15559876543');
      
      // Set up voicemail
      await page.click('[data-testid="enable-voicemail"]');
      await page.fill('[data-testid="voicemail-greeting"]', 'Thank you for calling!');

      // Save configuration
      await page.click('[data-testid="save-configuration"]');
      
      // Wait for success message
      await page.waitForSelector('[data-testid="configuration-saved"]');
      expect(await page.isVisible('[data-testid="configuration-saved"]')).toBe(true);
    });

    it('should complete DID group management workflow', async () => {
      // Navigate to DID groups
      await page.click('[data-testid="nav-numbers"]');
      await page.click('[data-testid="nav-did-groups"]');
      await page.waitForSelector('[data-testid="did-groups"]');

      // Create new DID group
      await page.click('[data-testid="create-did-group"]');
      await page.waitForSelector('[data-testid="did-group-form"]');

      // Fill group details
      await page.fill('[data-testid="group-name-input"]', 'Sales Team');
      await page.fill('[data-testid="group-description-input"]', 'Numbers for sales department');
      
      // Add numbers to group
      await page.click('[data-testid="add-numbers-to-group"]');
      await page.waitForSelector('[data-testid="number-selection-modal"]');
      
      // Select numbers
      await page.click('[data-testid="available-number"]:first-child');
      await page.click('[data-testid="available-number"]:nth-child(2)');
      await page.click('[data-testid="confirm-number-selection"]');

      // Save group
      await page.click('[data-testid="save-did-group"]');
      
      // Verify group was created
      await page.waitForSelector('[data-testid="group-created-success"]');
      expect(await page.isVisible('[data-testid="group-created-success"]')).toBe(true);
    });
  });

  describe('AI Agent Management Workflow', () => {
    beforeEach(async () => {
      await page.goto('http://localhost:3000/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="submit-login"]');
      await page.waitForSelector('[data-testid="dashboard"]');
    });

    it('should complete AI agent creation workflow', async () => {
      // Navigate to AI agents
      await page.click('[data-testid="nav-ai-agent"]');
      await page.click('[data-testid="nav-ai-agents"]');
      await page.waitForSelector('[data-testid="ai-agents-list"]');

      // Create new AI agent
      await page.click('[data-testid="create-ai-agent"]');
      await page.waitForSelector('[data-testid="agent-builder"]');

      // Configure agent basics
      await page.fill('[data-testid="agent-name-input"]', 'Customer Service Bot');
      await page.fill('[data-testid="agent-description-input"]', 'Handles customer inquiries');
      
      // Configure voice settings
      await page.selectOption('[data-testid="voice-select"]', 'female-professional');
      await page.fill('[data-testid="speech-rate-input"]', '1.0');
      await page.selectOption('[data-testid="language-select"]', 'en-US');

      // Set up conversation flow
      await page.click('[data-testid="add-conversation-step"]');
      await page.fill('[data-testid="step-prompt-input"]', 'Hello! How can I help you today?');
      
      // Add response options
      await page.click('[data-testid="add-response-option"]');
      await page.fill('[data-testid="response-text-input"]', 'I need help with billing');
      await page.selectOption('[data-testid="response-action-select"]', 'transfer-to-billing');

      // Save agent
      await page.click('[data-testid="save-ai-agent"]');
      
      // Verify agent was created
      await page.waitForSelector('[data-testid="agent-created-success"]');
      expect(await page.isVisible('[data-testid="agent-created-success"]')).toBe(true);
    });

    it('should complete voice workflow design', async () => {
      // Navigate to voice workflows
      await page.click('[data-testid="nav-ai-agent"]');
      await page.click('[data-testid="nav-voice-workflows"]');
      await page.waitForSelector('[data-testid="voice-workflows"]');

      // Create new workflow
      await page.click('[data-testid="create-workflow"]');
      await page.waitForSelector('[data-testid="workflow-designer"]');

      // Add workflow steps using drag and drop
      await page.dragAndDrop('[data-testid="greeting-step"]', '[data-testid="workflow-canvas"]');
      await page.dragAndDrop('[data-testid="menu-step"]', '[data-testid="workflow-canvas"]');
      await page.dragAndDrop('[data-testid="transfer-step"]', '[data-testid="workflow-canvas"]');

      // Connect workflow steps
      await page.click('[data-testid="greeting-step"] [data-testid="output-connector"]');
      await page.click('[data-testid="menu-step"] [data-testid="input-connector"]');

      // Configure workflow properties
      await page.fill('[data-testid="workflow-name-input"]', 'Customer Support Flow');
      await page.fill('[data-testid="workflow-description-input"]', 'Main customer support workflow');

      // Save workflow
      await page.click('[data-testid="save-workflow"]');
      
      // Verify workflow was saved
      await page.waitForSelector('[data-testid="workflow-saved-success"]');
      expect(await page.isVisible('[data-testid="workflow-saved-success"]')).toBe(true);
    });

    it('should test AI agent call simulation', async () => {
      // Navigate to AI agent testing
      await page.click('[data-testid="nav-ai-agent"]');
      await page.click('[data-testid="nav-ai-agents"]');
      await page.waitForSelector('[data-testid="ai-agents-list"]');

      // Select an agent to test
      await page.click('[data-testid="agent-card"]:first-child [data-testid="test-agent"]');
      await page.waitForSelector('[data-testid="agent-simulator"]');

      // Start call simulation
      await page.click('[data-testid="start-simulation"]');
      await page.waitForSelector('[data-testid="simulation-active"]');

      // Interact with the agent
      await page.fill('[data-testid="user-input"]', 'I need help with my account');
      await page.click('[data-testid="send-message"]');

      // Wait for agent response
      await page.waitForSelector('[data-testid="agent-response"]');
      
      // Verify agent responded
      const responseText = await page.textContent('[data-testid="agent-response"]');
      expect(responseText).toBeTruthy();
      expect(responseText.length).toBeGreaterThan(0);

      // End simulation
      await page.click('[data-testid="end-simulation"]');
      await page.waitForSelector('[data-testid="simulation-ended"]');
    });
  });

  describe('Unified Inbox and Messaging Workflow', () => {
    beforeEach(async () => {
      await page.goto('http://localhost:3000/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="submit-login"]');
      await page.waitForSelector('[data-testid="dashboard"]');
    });

    it('should complete message template creation workflow', async () => {
      // Navigate to templates
      await page.click('[data-testid="nav-inbox"]');
      await page.click('[data-testid="nav-templates"]');
      await page.waitForSelector('[data-testid="message-templates"]');

      // Create new template
      await page.click('[data-testid="create-template"]');
      await page.waitForSelector('[data-testid="template-editor"]');

      // Fill template details
      await page.fill('[data-testid="template-name-input"]', 'Welcome Message');
      await page.fill('[data-testid="template-subject-input"]', 'Welcome to VoxLink!');
      
      // Use rich text editor
      await page.click('[data-testid="template-content-editor"]');
      await page.type('[data-testid="template-content-editor"]', 'Hello {{customerName}}, welcome to VoxLink!');

      // Add variables
      await page.click('[data-testid="add-variable"]');
      await page.selectOption('[data-testid="variable-select"]', 'customerName');
      await page.fill('[data-testid="variable-default"]', 'Valued Customer');

      // Save template
      await page.click('[data-testid="save-template"]');
      
      // Verify template was saved
      await page.waitForSelector('[data-testid="template-saved-success"]');
      expect(await page.isVisible('[data-testid="template-saved-success"]')).toBe(true);
    });

    it('should complete messaging campaign workflow', async () => {
      // Navigate to campaigns
      await page.click('[data-testid="nav-inbox"]');
      await page.click('[data-testid="nav-campaign"]');
      await page.waitForSelector('[data-testid="campaigns"]');

      // Create new campaign
      await page.click('[data-testid="create-campaign"]');
      await page.waitForSelector('[data-testid="campaign-builder"]');

      // Configure campaign
      await page.fill('[data-testid="campaign-name-input"]', 'Product Launch');
      await page.selectOption('[data-testid="campaign-type-select"]', 'sms');
      await page.selectOption('[data-testid="template-select"]', 'Welcome Message');

      // Select recipients
      await page.click('[data-testid="select-recipients"]');
      await page.waitForSelector('[data-testid="recipient-selector"]');
      
      // Upload contact list
      const fileInput = await page.locator('[data-testid="contact-file-input"]');
      await fileInput.setInputFiles('test-contacts.csv');
      
      // Schedule campaign
      await page.click('[data-testid="schedule-campaign"]');
      await page.fill('[data-testid="schedule-date-input"]', '2024-12-25');
      await page.fill('[data-testid="schedule-time-input"]', '10:00');

      // Launch campaign
      await page.click('[data-testid="launch-campaign"]');
      
      // Verify campaign was launched
      await page.waitForSelector('[data-testid="campaign-launched-success"]');
      expect(await page.isVisible('[data-testid="campaign-launched-success"]')).toBe(true);
    });

    it('should complete unified inbox message handling', async () => {
      // Navigate to SMS chats
      await page.click('[data-testid="nav-inbox"]');
      await page.click('[data-testid="nav-sms-chats"]');
      await page.waitForSelector('[data-testid="unified-inbox"]');

      // Select a conversation
      await page.click('[data-testid="conversation-item"]:first-child');
      await page.waitForSelector('[data-testid="message-thread"]');

      // Send a reply
      await page.fill('[data-testid="message-input"]', 'Thank you for contacting us!');
      await page.click('[data-testid="send-message"]');

      // Verify message was sent
      await page.waitForSelector('[data-testid="message-sent"]');
      expect(await page.isVisible('[data-testid="message-sent"]')).toBe(true);

      // Apply message tags
      await page.click('[data-testid="message-actions"]');
      await page.click('[data-testid="add-tag"]');
      await page.selectOption('[data-testid="tag-select"]', 'resolved');
      await page.click('[data-testid="apply-tag"]');

      // Mark conversation as resolved
      await page.click('[data-testid="resolve-conversation"]');
      
      // Verify conversation status changed
      await page.waitForSelector('[data-testid="conversation-resolved"]');
      expect(await page.isVisible('[data-testid="conversation-resolved"]')).toBe(true);
    });
  });

  describe('Auto Dialer Workflow', () => {
    beforeEach(async () => {
      await page.goto('http://localhost:3000/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="submit-login"]');
      await page.waitForSelector('[data-testid="dashboard"]');
    });

    it('should complete power dialer campaign setup', async () => {
      // Navigate to power dialer
      await page.click('[data-testid="nav-auto-dialer"]');
      await page.click('[data-testid="nav-power-dialer"]');
      await page.waitForSelector('[data-testid="power-dialer"]');

      // Create new campaign
      await page.click('[data-testid="create-dialer-campaign"]');
      await page.waitForSelector('[data-testid="campaign-setup"]');

      // Configure campaign
      await page.fill('[data-testid="campaign-name-input"]', 'Sales Outreach');
      await page.selectOption('[data-testid="dialer-mode-select"]', 'power');
      
      // Upload contact list
      const fileInput = await page.locator('[data-testid="contact-list-input"]');
      await fileInput.setInputFiles('sales-contacts.csv');

      // Configure dialer settings
      await page.fill('[data-testid="calls-per-agent-input"]', '3');
      await page.fill('[data-testid="ring-timeout-input"]', '30');
      await page.check('[data-testid="enable-voicemail-detection"]');

      // Assign agents
      await page.click('[data-testid="assign-agents"]');
      await page.check('[data-testid="agent-checkbox"]:first-child');
      await page.check('[data-testid="agent-checkbox"]:nth-child(2)');

      // Start campaign
      await page.click('[data-testid="start-campaign"]');
      
      // Verify campaign started
      await page.waitForSelector('[data-testid="campaign-active"]');
      expect(await page.isVisible('[data-testid="campaign-active"]')).toBe(true);
    });

    it('should complete parallel dialer workflow', async () => {
      // Navigate to parallel dialer
      await page.click('[data-testid="nav-auto-dialer"]');
      await page.click('[data-testid="nav-parallel-dialer"]');
      await page.waitForSelector('[data-testid="parallel-dialer"]');

      // Configure parallel dialing
      await page.fill('[data-testid="simultaneous-calls-input"]', '5');
      await page.fill('[data-testid="agent-ratio-input"]', '3:1');
      
      // Set compliance rules
      await page.check('[data-testid="enable-dnc-checking"]');
      await page.selectOption('[data-testid="timezone-select"]', 'America/New_York');
      await page.fill('[data-testid="calling-hours-start"]', '09:00');
      await page.fill('[data-testid="calling-hours-end"]', '17:00');

      // Start parallel dialing
      await page.click('[data-testid="start-parallel-dialing"]');
      
      // Monitor dialing progress
      await page.waitForSelector('[data-testid="dialing-statistics"]');
      expect(await page.isVisible('[data-testid="calls-in-progress"]')).toBe(true);
      expect(await page.isVisible('[data-testid="connection-rate"]')).toBe(true);
    });

    it('should complete speed dial management', async () => {
      // Navigate to speed dial
      await page.click('[data-testid="nav-auto-dialer"]');
      await page.click('[data-testid="nav-speed-dial"]');
      await page.waitForSelector('[data-testid="speed-dial"]');

      // Add new speed dial entry
      await page.click('[data-testid="add-speed-dial"]');
      await page.waitForSelector('[data-testid="speed-dial-form"]');

      // Fill speed dial details
      await page.fill('[data-testid="contact-name-input"]', 'John Smith');
      await page.fill('[data-testid="phone-number-input"]', '+15551234567');
      await page.selectOption('[data-testid="speed-dial-key"]', '1');
      await page.fill('[data-testid="contact-notes-input"]', 'Important client');

      // Save speed dial entry
      await page.click('[data-testid="save-speed-dial"]');
      
      // Test speed dial functionality
      await page.click('[data-testid="speed-dial-key-1"]');
      await page.waitForSelector('[data-testid="call-initiated"]');
      expect(await page.isVisible('[data-testid="call-initiated"]')).toBe(true);
    });
  });

  describe('Reports and Analytics Workflow', () => {
    beforeEach(async () => {
      await page.goto('http://localhost:3000/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="submit-login"]');
      await page.waitForSelector('[data-testid="dashboard"]');
    });

    it('should complete comprehensive report generation', async () => {
      // Navigate to reports
      await page.click('[data-testid="nav-reports"]');
      await page.click('[data-testid="nav-call-status-report"]');
      await page.waitForSelector('[data-testid="call-status-report"]');

      // Configure report parameters
      await page.fill('[data-testid="date-from-input"]', '2024-01-01');
      await page.fill('[data-testid="date-to-input"]', '2024-12-31');
      await page.selectOption('[data-testid="report-granularity"]', 'daily');
      
      // Select metrics
      await page.check('[data-testid="metric-total-calls"]');
      await page.check('[data-testid="metric-answered-calls"]');
      await page.check('[data-testid="metric-abandoned-calls"]');
      await page.check('[data-testid="metric-average-duration"]');

      // Generate report
      await page.click('[data-testid="generate-report"]');
      await page.waitForSelector('[data-testid="report-generated"]');

      // Verify report data
      expect(await page.isVisible('[data-testid="report-chart"]')).toBe(true);
      expect(await page.isVisible('[data-testid="report-table"]')).toBe(true);
      expect(await page.isVisible('[data-testid="report-summary"]')).toBe(true);

      // Export report
      await page.click('[data-testid="export-report"]');
      await page.selectOption('[data-testid="export-format"]', 'pdf');
      await page.click('[data-testid="confirm-export"]');
      
      // Verify export initiated
      await page.waitForSelector('[data-testid="export-started"]');
      expect(await page.isVisible('[data-testid="export-started"]')).toBe(true);
    });

    it('should complete user performance analysis', async () => {
      // Navigate to user status report
      await page.click('[data-testid="nav-reports"]');
      await page.click('[data-testid="nav-user-status-report"]');
      await page.waitForSelector('[data-testid="user-status-report"]');

      // Select users to analyze
      await page.click('[data-testid="select-users"]');
      await page.check('[data-testid="user-checkbox"]:first-child');
      await page.check('[data-testid="user-checkbox"]:nth-child(2)');
      await page.click('[data-testid="apply-user-selection"]');

      // Configure analysis period
      await page.selectOption('[data-testid="analysis-period"]', 'last-30-days');
      
      // Generate performance analysis
      await page.click('[data-testid="analyze-performance"]');
      await page.waitForSelector('[data-testid="performance-analysis"]');

      // Verify analysis results
      expect(await page.isVisible('[data-testid="performance-metrics"]')).toBe(true);
      expect(await page.isVisible('[data-testid="performance-trends"]')).toBe(true);
      expect(await page.isVisible('[data-testid="performance-recommendations"]')).toBe(true);
    });

    it('should complete leaderboard and ranking workflow', async () => {
      // Navigate to leaderboard
      await page.click('[data-testid="nav-reports"]');
      await page.click('[data-testid="nav-leader-board"]');
      await page.waitForSelector('[data-testid="leader-board"]');

      // Configure leaderboard
      await page.selectOption('[data-testid="ranking-metric"]', 'calls-handled');
      await page.selectOption('[data-testid="ranking-period"]', 'this-month');
      await page.selectOption('[data-testid="team-filter"]', 'sales-team');

      // Generate leaderboard
      await page.click('[data-testid="generate-leaderboard"]');
      await page.waitForSelector('[data-testid="leaderboard-results"]');

      // Verify leaderboard display
      const leaderboardEntries = await page.locator('[data-testid="leaderboard-entry"]').count();
      expect(leaderboardEntries).toBeGreaterThan(0);

      // Check top performer details
      await page.click('[data-testid="leaderboard-entry"]:first-child');
      await page.waitForSelector('[data-testid="performer-details"]');
      expect(await page.isVisible('[data-testid="performer-stats"]')).toBe(true);
    });
  });

  describe('Real-time Monitoring Workflow', () => {
    beforeEach(async () => {
      await page.goto('http://localhost:3000/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="submit-login"]');
      await page.waitForSelector('[data-testid="dashboard"]');
    });

    it('should verify real-time dashboard updates', async () => {
      // Navigate to dashboard
      await page.click('[data-testid="nav-dashboard"]');
      await page.waitForSelector('[data-testid="dashboard"]');

      // Verify real-time metrics are updating
      const initialCallCount = await page.textContent('[data-testid="active-calls-count"]');
      
      // Wait for potential updates
      await page.waitForTimeout(5000);
      
      // Check if metrics are responsive
      expect(await page.isVisible('[data-testid="real-time-indicator"]')).toBe(true);
      expect(await page.isVisible('[data-testid="last-updated-timestamp"]')).toBe(true);
    });

    it('should complete live call monitoring workflow', async () => {
      // Navigate to live call monitoring
      await page.click('[data-testid="nav-dashboard"]');
      await page.click('[data-testid="live-calls-widget"]');
      await page.waitForSelector('[data-testid="live-call-monitoring"]');

      // Verify active calls are displayed
      expect(await page.isVisible('[data-testid="active-calls-list"]')).toBe(true);
      
      // Monitor a specific call
      if (await page.locator('[data-testid="active-call-item"]').count() > 0) {
        await page.click('[data-testid="active-call-item"]:first-child [data-testid="monitor-call"]');
        await page.waitForSelector('[data-testid="call-monitoring-panel"]');
        
        // Verify monitoring controls
        expect(await page.isVisible('[data-testid="whisper-button"]')).toBe(true);
        expect(await page.isVisible('[data-testid="barge-in-button"]')).toBe(true);
        expect(await page.isVisible('[data-testid="call-details"]')).toBe(true);
      }
    });

    it('should verify real-time notifications', async () => {
      // Enable notifications
      await page.click('[data-testid="notification-settings"]');
      await page.check('[data-testid="enable-real-time-notifications"]');
      await page.click('[data-testid="save-notification-settings"]');

      // Wait for real-time notifications
      await page.waitForSelector('[data-testid="notification-center"]');
      
      // Verify notification system is active
      expect(await page.isVisible('[data-testid="notification-indicator"]')).toBe(true);
    });
  });

  describe('Mobile Responsiveness Workflow', () => {
    beforeEach(async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="submit-login"]');
      await page.waitForSelector('[data-testid="dashboard"]');
    });

    it('should complete mobile navigation workflow', async () => {
      // Verify mobile layout
      expect(await page.isVisible('[data-testid="mobile-menu-button"]')).toBe(true);
      expect(await page.isVisible('[data-testid="desktop-sidebar"]')).toBe(false);

      // Open mobile menu
      await page.click('[data-testid="mobile-menu-button"]');
      await page.waitForSelector('[data-testid="mobile-sidebar"]');
      
      // Navigate using mobile menu
      await page.click('[data-testid="mobile-nav-numbers"]');
      await page.waitForSelector('[data-testid="numbers-page"]');
      
      // Verify mobile-optimized layout
      expect(await page.isVisible('[data-testid="mobile-number-cards"]')).toBe(true);
    });

    it('should complete mobile number search workflow', async () => {
      // Navigate to number search on mobile
      await page.click('[data-testid="mobile-menu-button"]');
      await page.click('[data-testid="mobile-nav-numbers"]');
      await page.click('[data-testid="mobile-nav-number-search"]');
      await page.waitForSelector('[data-testid="mobile-number-search"]');

      // Use mobile-optimized search
      await page.fill('[data-testid="mobile-area-code-input"]', '555');
      await page.click('[data-testid="mobile-search-button"]');
      
      // Verify mobile search results
      await page.waitForSelector('[data-testid="mobile-search-results"]');
      expect(await page.isVisible('[data-testid="mobile-number-card"]')).toBe(true);
    });

    it('should verify offline functionality', async () => {
      // Go offline
      await page.context().setOffline(true);
      
      // Try to navigate
      await page.click('[data-testid="mobile-menu-button"]');
      await page.click('[data-testid="mobile-nav-numbers"]');
      
      // Verify offline message
      await page.waitForSelector('[data-testid="offline-indicator"]');
      expect(await page.isVisible('[data-testid="offline-indicator"]')).toBe(true);
      
      // Verify cached data is still accessible
      expect(await page.isVisible('[data-testid="cached-data"]')).toBe(true);
      
      // Go back online
      await page.context().setOffline(false);
      
      // Verify online functionality restored
      await page.waitForSelector('[data-testid="online-indicator"]');
      expect(await page.isVisible('[data-testid="online-indicator"]')).toBe(true);
    });
  });

  describe('Integration Workflow', () => {
    beforeEach(async () => {
      await page.goto('http://localhost:3000/login');
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword');
      await page.click('[data-testid="submit-login"]');
      await page.waitForSelector('[data-testid="dashboard"]');
    });

    it('should complete third-party integration setup', async () => {
      // Navigate to integrations
      await page.click('[data-testid="nav-integrations"]');
      await page.waitForSelector('[data-testid="integrations-page"]');

      // Set up CRM integration
      await page.click('[data-testid="setup-crm-integration"]');
      await page.waitForSelector('[data-testid="crm-integration-form"]');
      
      // Configure CRM connection
      await page.fill('[data-testid="crm-api-key-input"]', 'test-api-key');
      await page.fill('[data-testid="crm-endpoint-input"]', 'https://api.crm.example.com');
      await page.click('[data-testid="test-connection"]');
      
      // Verify connection
      await page.waitForSelector('[data-testid="connection-success"]');
      expect(await page.isVisible('[data-testid="connection-success"]')).toBe(true);
      
      // Save integration
      await page.click('[data-testid="save-integration"]');
      await page.waitForSelector('[data-testid="integration-saved"]');
    });

    it('should complete webhook configuration', async () => {
      // Navigate to webhook management
      await page.click('[data-testid="nav-integrations"]');
      await page.click('[data-testid="webhook-management"]');
      await page.waitForSelector('[data-testid="webhook-manager"]');

      // Create new webhook
      await page.click('[data-testid="create-webhook"]');
      await page.waitForSelector('[data-testid="webhook-form"]');
      
      // Configure webhook
      await page.fill('[data-testid="webhook-url-input"]', 'https://example.com/webhook');
      await page.selectOption('[data-testid="webhook-event-select"]', 'call.completed');
      await page.check('[data-testid="webhook-active"]');
      
      // Test webhook
      await page.click('[data-testid="test-webhook"]');
      await page.waitForSelector('[data-testid="webhook-test-result"]');
      
      // Save webhook
      await page.click('[data-testid="save-webhook"]');
      await page.waitForSelector('[data-testid="webhook-saved"]');
    });
  });

  describe('System Performance Workflow', () => {
    it('should handle high load scenarios', async () => {
      // Simulate multiple concurrent users
      const pages = [];
      for (let i = 0; i < 5; i++) {
        const newPage = await browser.newPage();
        pages.push(newPage);
        
        // Login each user
        await newPage.goto('http://localhost:3000/login');
        await newPage.fill('[data-testid="email-input"]', `user${i}@example.com`);
        await newPage.fill('[data-testid="password-input"]', 'testpassword');
        await newPage.click('[data-testid="submit-login"]');
        await newPage.waitForSelector('[data-testid="dashboard"]');
      }

      // Perform concurrent operations
      const operations = pages.map(async (userPage, index) => {
        // Each user performs different operations
        switch (index % 3) {
          case 0:
            await userPage.click('[data-testid="nav-numbers"]');
            await userPage.waitForSelector('[data-testid="numbers-page"]');
            break;
          case 1:
            await userPage.click('[data-testid="nav-reports"]');
            await userPage.waitForSelector('[data-testid="reports-page"]');
            break;
          case 2:
            await userPage.click('[data-testid="nav-ai-agent"]');
            await userPage.waitForSelector('[data-testid="ai-agent-page"]');
            break;
        }
      });

      // Wait for all operations to complete
      await Promise.all(operations);

      // Verify system remained responsive
      for (const userPage of pages) {
        expect(await userPage.isVisible('[data-testid="dashboard"]')).toBe(true);
        await userPage.close();
      }
    });

    it('should verify system recovery after errors', async () => {
      // Simulate network error
      await page.route('**/api/**', route => {
        route.abort('failed');
      });

      // Try to perform an operation
      await page.click('[data-testid="nav-numbers"]');
      
      // Verify error handling
      await page.waitForSelector('[data-testid="error-message"]');
      expect(await page.isVisible('[data-testid="error-message"]')).toBe(true);
      
      // Restore network
      await page.unroute('**/api/**');
      
      // Retry operation
      await page.click('[data-testid="retry-button"]');
      
      // Verify recovery
      await page.waitForSelector('[data-testid="numbers-page"]');
      expect(await page.isVisible('[data-testid="numbers-page"]')).toBe(true);
    });
  });
});