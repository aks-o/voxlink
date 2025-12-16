"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setup_1 = require("../e2e/setup");
// Reuse the same database setup for performance tests
beforeAll(async () => {
    await (0, setup_1.setupTestDatabase)();
});
// Performance test specific setup
global.performance = global.performance || {
    now: () => Date.now(),
    mark: () => { },
    measure: () => { },
};
