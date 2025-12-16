"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.portingRouter = void 0;
const express_1 = require("express");
const porting_request_repository_1 = require("../repositories/porting-request.repository");
const virtual_number_repository_1 = require("../repositories/virtual-number.repository");
const number_configuration_repository_1 = require("../repositories/number-configuration.repository");
const porting_service_1 = require("../services/porting.service");
const error_handler_1 = require("../middleware/error-handler");
exports.portingRouter = (0, express_1.Router)();
const portingRepo = new porting_request_repository_1.PortingRequestRepository();
const numberRepo = new virtual_number_repository_1.VirtualNumberRepository();
const configRepo = new number_configuration_repository_1.NumberConfigurationRepository();
const portingService = new porting_service_1.PortingService(portingRepo, numberRepo, configRepo);
// Create new porting request
exports.portingRouter.post('/', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { userId, currentNumber, currentCarrier, accountNumber, pin, authorizedName, billingAddress, notes, } = req.body;
    // Validate required fields
    if (!userId || !currentNumber || !currentCarrier || !accountNumber || !pin || !authorizedName) {
        throw new error_handler_1.ValidationError('Missing required fields: userId, currentNumber, currentCarrier, accountNumber, pin, authorizedName');
    }
    if (!billingAddress || !billingAddress.street || !billingAddress.city || !billingAddress.state || !billingAddress.zipCode) {
        throw new error_handler_1.ValidationError('Complete billing address is required');
    }
    const portingRequest = await portingService.initiatePorting({
        userId,
        currentNumber,
        currentCarrier,
        accountNumber,
        pin,
        authorizedName,
        billingAddress,
        notes,
    });
    res.status(201).json({
        success: true,
        data: portingRequest,
        message: 'Porting request submitted successfully',
    });
}));
// Get porting request by ID
exports.portingRouter.get('/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const portingRequest = await portingRepo.findByIdWithDetails(id);
    if (!portingRequest) {
        throw new error_handler_1.NotFoundError('Porting request not found');
    }
    res.json({
        success: true,
        data: portingRequest,
    });
}));
// Get user's porting requests
exports.portingRouter.get('/user/:userId', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.params;
    const { limit = '50', offset = '0' } = req.query;
    const result = await portingService.getUserPortingRequests(userId, parseInt(limit, 10), parseInt(offset, 10));
    res.json({
        success: true,
        data: result.requests,
        pagination: {
            total: result.total,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
        },
    });
}));
// Get porting progress
exports.portingRouter.get('/:id/progress', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const progress = await portingService.getPortingProgress(id);
    res.json({
        success: true,
        data: progress,
    });
}));
// Update porting status (admin endpoint)
exports.portingRouter.put('/:id/status', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status, message, updatedBy } = req.body;
    if (!status || !message || !updatedBy) {
        throw new error_handler_1.ValidationError('status, message, and updatedBy are required');
    }
    const validStatuses = ['SUBMITTED', 'PROCESSING', 'APPROVED', 'COMPLETED', 'FAILED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
        throw new error_handler_1.ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    const portingRequest = await portingService.updatePortingStatus(id, status, message, updatedBy);
    res.json({
        success: true,
        data: portingRequest,
        message: 'Porting status updated successfully',
    });
}));
// Cancel porting request
exports.portingRouter.post('/:id/cancel', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { reason, cancelledBy } = req.body;
    if (!reason || !cancelledBy) {
        throw new error_handler_1.ValidationError('reason and cancelledBy are required');
    }
    const portingRequest = await portingService.cancelPortingRequest(id, reason, cancelledBy);
    res.json({
        success: true,
        data: portingRequest,
        message: 'Porting request cancelled successfully',
    });
}));
// Upload document for porting request
exports.portingRouter.post('/:id/documents', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { type, filename, url } = req.body;
    if (!type || !filename || !url) {
        throw new error_handler_1.ValidationError('type, filename, and url are required');
    }
    const validTypes = ['BILL', 'AUTHORIZATION', 'IDENTIFICATION', 'OTHER'];
    if (!validTypes.includes(type)) {
        throw new error_handler_1.ValidationError(`Invalid document type. Must be one of: ${validTypes.join(', ')}`);
    }
    // Verify porting request exists
    const portingRequest = await portingRepo.findById(id);
    if (!portingRequest) {
        throw new error_handler_1.NotFoundError('Porting request not found');
    }
    const document = await portingRepo.addDocument({
        portingRequestId: id,
        type,
        filename,
        url,
    });
    res.status(201).json({
        success: true,
        data: document,
        message: 'Document uploaded successfully',
    });
}));
// Get documents for porting request
exports.portingRouter.get('/:id/documents', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Verify porting request exists
    const portingRequest = await portingRepo.findById(id);
    if (!portingRequest) {
        throw new error_handler_1.NotFoundError('Porting request not found');
    }
    const documents = await portingRepo.getDocuments(id);
    res.json({
        success: true,
        data: documents,
    });
}));
// Delete document
exports.portingRouter.delete('/documents/:documentId', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { documentId } = req.params;
    await portingRepo.deleteDocument(documentId);
    res.json({
        success: true,
        message: 'Document deleted successfully',
    });
}));
// Get status history for porting request
exports.portingRouter.get('/:id/history', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Verify porting request exists
    const portingRequest = await portingRepo.findById(id);
    if (!portingRequest) {
        throw new error_handler_1.NotFoundError('Porting request not found');
    }
    const history = await portingRepo.getStatusHistory(id);
    res.json({
        success: true,
        data: history,
    });
}));
// Validate porting request data (preview)
exports.portingRouter.post('/validate', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const portingData = req.body;
    const validation = await portingService.validatePortingRequest(portingData);
    res.json({
        success: true,
        data: validation,
    });
}));
// Search porting requests (admin endpoint)
exports.portingRouter.get('/search/:query', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { query } = req.params;
    const { userId, status, carrier, limit = '50', offset = '0' } = req.query;
    const filters = {};
    if (userId)
        filters.userId = userId;
    if (status)
        filters.status = status;
    if (carrier)
        filters.carrier = carrier;
    const results = await portingRepo.search(query, filters, parseInt(limit, 10), parseInt(offset, 10));
    res.json({
        success: true,
        data: results,
        searchQuery: query,
        filters,
    });
}));
// Get porting requests by status (admin endpoint)
exports.portingRouter.get('/status/:status', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { status } = req.params;
    const { limit = '50', offset = '0' } = req.query;
    const validStatuses = ['SUBMITTED', 'PROCESSING', 'APPROVED', 'COMPLETED', 'FAILED', 'CANCELLED'];
    if (!validStatuses.includes(status.toUpperCase())) {
        throw new error_handler_1.ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    const [requests, total] = await Promise.all([
        portingRepo.findByStatus(status.toUpperCase(), parseInt(limit, 10), parseInt(offset, 10)),
        portingRepo.countByStatus(status.toUpperCase()),
    ]);
    res.json({
        success: true,
        data: requests,
        pagination: {
            total,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
        },
    });
}));
// Get porting requests requiring attention (admin endpoint)
exports.portingRouter.get('/admin/attention', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const requests = await portingRepo.getRequestsRequiringAttention();
    res.json({
        success: true,
        data: requests,
        count: requests.length,
    });
}));
