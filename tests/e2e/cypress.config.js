"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cypress_1 = require("cypress");
exports.default = (0, cypress_1.defineConfig)({
    e2e: {
        baseUrl: 'http://localhost:3000',
        supportFile: 'tests/e2e/support/e2e.ts',
        specPattern: 'tests/e2e/specs/**/*.cy.{js,jsx,ts,tsx}',
        fixturesFolder: 'tests/e2e/fixtures',
        screenshotsFolder: 'tests/e2e/screenshots',
        videosFolder: 'tests/e2e/videos',
        downloadsFolder: 'tests/e2e/downloads',
        // Viewport settings
        viewportWidth: 1280,
        viewportHeight: 720,
        // Test settings
        defaultCommandTimeout: 10000,
        requestTimeout: 10000,
        responseTimeout: 10000,
        pageLoadTimeout: 30000,
        // Video and screenshot settings
        video: true,
        videoCompression: 32,
        screenshotOnRunFailure: true,
        // Retry settings
        retries: {
            runMode: 2,
            openMode: 0,
        },
        // Environment variables
        env: {
            apiUrl: 'http://localhost:8000',
            testUser: {
                email: 'test@example.com',
                password: 'testpassword123',
            },
            adminUser: {
                email: 'admin@example.com',
                password: 'adminpassword123',
            },
        },
        setupNodeEvents(on, config) {
            // Task definitions
            on('task', {
                // Database tasks
                'db:seed': () => {
                    return require('./tasks/database').seedTestData();
                },
                'db:clean': () => {
                    return require('./tasks/database').cleanTestData();
                },
                'db:reset': () => {
                    return require('./tasks/database').resetDatabase();
                },
                // API tasks
                'api:createUser': (userData) => {
                    return require('./tasks/api').createUser(userData);
                },
                'api:createNumber': (numberData) => {
                    return require('./tasks/api').createVirtualNumber(numberData);
                },
                'api:deleteUser': (userId) => {
                    return require('./tasks/api').deleteUser(userId);
                },
                // File system tasks
                'fs:readFile': (filePath) => {
                    return require('fs').readFileSync(filePath, 'utf8');
                },
                'fs:writeFile': ({ filePath, content }) => {
                    require('fs').writeFileSync(filePath, content);
                    return null;
                },
                // Email tasks (for testing notifications)
                'email:getLastEmail': () => {
                    return require('./tasks/email').getLastEmail();
                },
                'email:clearInbox': () => {
                    return require('./tasks/email').clearInbox();
                },
                // Performance tasks
                'perf:startMonitoring': () => {
                    return require('./tasks/performance').startMonitoring();
                },
                'perf:stopMonitoring': () => {
                    return require('./tasks/performance').stopMonitoring();
                },
                'perf:getMetrics': () => {
                    return require('./tasks/performance').getMetrics();
                },
            });
            // Plugin configurations
            on('before:browser:launch', (browser, launchOptions) => {
                if (browser.name === 'chrome') {
                    // Add Chrome flags for better testing
                    launchOptions.args.push('--disable-dev-shm-usage');
                    launchOptions.args.push('--no-sandbox');
                    launchOptions.args.push('--disable-gpu');
                    // Enable performance monitoring
                    launchOptions.args.push('--enable-precise-memory-info');
                }
                return launchOptions;
            });
            // Code coverage (if using)
            require('@cypress/code-coverage/task')(on, config);
            return config;
        },
    },
    component: {
        devServer: {
            framework: 'react',
            bundler: 'vite',
        },
        supportFile: 'tests/e2e/support/component.ts',
        specPattern: 'packages/dashboard/src/**/*.cy.{js,jsx,ts,tsx}',
        indexHtmlFile: 'tests/e2e/support/component-index.html',
    },
    // Global configuration
    chromeWebSecurity: false,
    modifyObstructiveCode: false,
    experimentalStudio: true,
    experimentalWebKitSupport: true,
    // Reporter configuration
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
        configFile: 'tests/e2e/reporter-config.json',
    },
});
