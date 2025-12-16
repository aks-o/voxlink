"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const setup_1 = require("../e2e/setup");
beforeAll(async () => {
    await (0, setup_1.setupTestDatabase)();
});
