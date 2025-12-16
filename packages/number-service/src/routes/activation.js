"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activationRouter = void 0;
const express_1 = require("express");
const number_activation_service_1 = require("../services/number-activation.service");
const error_handler_1 = require("../middleware/error-handler");
exports.activationRouter = (0, express_1.Router)();
const activationService = new number_activation_service_1.NumberActivationService();
// Activate a single number
exports.activationRouter.post('/activate', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { phoneNumber, userId, paymentInfo, initialConfiguration } = req.body;
    if (!phoneNumber || !userId) {
        throw new error_handler_1.ValidationError('phoneNumber and userId are required');
    }
    const activationRequest = {
        phoneNumber,
        userId,
        paymentInfo,
        initialConfiguration,
    };
    const result = await activationService.activateNumber(activationRequest);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            error: result.error,
            phoneNumber: result.phoneNumber,
        });
    }
    res.json({
        success: true,
        data: result,
        message: 'Number activated successfully',
    });
}));
// Deactivate a number
exports.activationRouter.post('/deactivate', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { phoneNumber, userId } = req.body;
    if (!phoneNumber || !userId) {
        throw new error_handler_1.ValidationError('phoneNumber and userId are required');
    }
    const result = await activationService.deactivateNumber(phoneNumber, userId);
    if (!result.success) {
        return res.status(400).json({
            success: false,
            error: result.error,
            phoneNumber: result.phoneNumber,
        });
    }
    res.json({
        success: true,
        data: result,
        message: 'Number deactivated successfully',
    });
}));
// Get activation status
exports.activationRouter.get('/status/:phoneNumber', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { phoneNumber } = req.params;
    if (!phoneNumber) {
        throw new error_handler_1.ValidationError('phoneNumber is required');
    }
    const status = await activationService.getActivationStatus(phoneNumber);
    res.json({
        success: true,
        data: status,
    });
}));
// Bulk activate numbers
exports.activationRouter.post('/bulk-activate', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { requests } = req.body;
    if (!Array.isArray(requests) || requests.length === 0) {
        throw new error_handler_1.ValidationError('requests array is required and must not be empty');
    }
    if (requests.length > 50) {
        throw new error_handler_1.ValidationError('Maximum 50 numbers can be activated at once');
    }
    // Validate each request
    for (const request of requests) {
        if (!request.phoneNumber || !request.userId) {
            throw new error_handler_1.ValidationError('Each request must have phoneNumber and userId');
        }
    }
    const results = await activationService.bulkActivateNumbers(requests);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    res.json({
        success: true,
        data: results,
        summary: {
            total: requests.length,
            successful,
            failed,
        },
        message: `Bulk activation completed: ${successful} successful, ${failed} failed`,
    });
}));
// Test activation system
exports.activationRouter.post('/test', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        throw new error_handler_1.ValidationError('phoneNumber is required for testing');
    }
    // This is a test endpoint that simulates activation without actually activating
    const testResult = {
        phoneNumber,
        canActivate: true,
        estimatedTime: '30-60 seconds',
        requirements: [
            'Number must be reserved',
            'Valid payment method',
            'User authorization',
        ],
        supportedFeatures: [
            'Call forwarding',
            'Voicemail',
            'SMS',
            'Business hours routing',
        ],
    };
    res.json({
        success: true,
        data: testResult,
        message: 'Activation test completed',
    });
}));
