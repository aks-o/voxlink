"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvalidToken = exports.createExpiredToken = exports.createAdminUser = exports.generateAuthToken = exports.createTestUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const createTestUser = async (overrides = {}) => {
    const userId = (0, uuid_1.v4)();
    const user = {
        id: userId,
        email: `test-${userId}@example.com`,
        name: `Test User ${userId.slice(0, 8)}`,
        role: 'user',
        accountId: userId,
        ...overrides,
    };
    // In a real implementation, this would create the user in the database
    // For tests, we'll just return the user object
    return user;
};
exports.createTestUser = createTestUser;
const generateAuthToken = (user) => {
    const secret = process.env.JWT_SECRET || 'test-jwt-secret';
    return jsonwebtoken_1.default.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        accountId: user.accountId,
    }, secret, {
        expiresIn: '1h',
        issuer: 'voxlink-test',
    });
};
exports.generateAuthToken = generateAuthToken;
const createAdminUser = async () => {
    return (0, exports.createTestUser)({ role: 'admin' });
};
exports.createAdminUser = createAdminUser;
const createExpiredToken = (user) => {
    const secret = process.env.JWT_SECRET || 'test-jwt-secret';
    return jsonwebtoken_1.default.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
        accountId: user.accountId,
    }, secret, {
        expiresIn: '-1h', // Expired 1 hour ago
        issuer: 'voxlink-test',
    });
};
exports.createExpiredToken = createExpiredToken;
const createInvalidToken = () => {
    return 'invalid.jwt.token';
};
exports.createInvalidToken = createInvalidToken;
