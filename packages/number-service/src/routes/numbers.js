"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numbersRouter = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const virtual_number_repository_1 = require("../repositories/virtual-number.repository");
const number_configuration_repository_1 = require("../repositories/number-configuration.repository");
const number_search_service_1 = require("../services/number-search.service");
const error_handler_1 = require("../middleware/error-handler");
exports.numbersRouter = (0, express_1.Router)();
const virtualNumberRepo = new virtual_number_repository_1.VirtualNumberRepository();
const configRepo = new number_configuration_repository_1.NumberConfigurationRepository();
const searchService = new number_search_service_1.NumberSearchService();
// Get all numbers for a user (placeholder - will add auth later)
exports.numbersRouter.get('/', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { ownerId, limit = '50', offset = '0' } = req.query;
    if (!ownerId) {
        throw new error_handler_1.ValidationError('ownerId query parameter is required');
    }
    const numbers = await virtualNumberRepo.findByOwner(ownerId, parseInt(limit, 10), parseInt(offset, 10));
    const total = await virtualNumberRepo.countByOwner(ownerId);
    res.json({
        data: numbers,
        pagination: {
            total,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
        },
    });
}));
// Get number by ID
exports.numbersRouter.get('/:id', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const number = await virtualNumberRepo.findById(id);
    if (!number) {
        throw new error_handler_1.NotFoundError('Virtual number not found');
    }
    res.json({ data: number });
}));
// Search available numbers
exports.numbersRouter.get('/search/available', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { countryCode, areaCode, city, region, pattern, features, maxMonthlyRate, maxSetupFee, limit = '10', sortBy, preferredFeatures, preferredAreaCodes } = req.query;
    // Build search criteria
    const searchCriteria = {
        countryCode: countryCode,
        areaCode: areaCode,
        city: city,
        region: region,
        pattern: pattern,
        features: features ? features.split(',') : undefined,
        maxMonthlyRate: maxMonthlyRate ? parseInt(maxMonthlyRate, 10) : undefined,
        maxSetupFee: maxSetupFee ? parseInt(maxSetupFee, 10) : undefined,
        limit: parseInt(limit, 10),
        preferences: {
            sortBy: sortBy,
            preferredFeatures: preferredFeatures ? preferredFeatures.split(',') : undefined,
            preferredAreaCodes: preferredAreaCodes ? preferredAreaCodes.split(',') : undefined,
        },
    };
    // Validate required fields
    if (!searchCriteria.countryCode) {
        throw new error_handler_1.ValidationError('countryCode is required');
    }
    const searchResult = await searchService.searchNumbers(searchCriteria);
    res.json({
        success: true,
        data: searchResult,
        searchCriteria: {
            countryCode: searchCriteria.countryCode,
            areaCode: searchCriteria.areaCode,
            city: searchCriteria.city,
            region: searchCriteria.region,
            pattern: searchCriteria.pattern,
            features: searchCriteria.features,
            limit: searchCriteria.limit,
        },
    });
}));
// Get number configuration
exports.numbersRouter.get('/:id/configuration', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Verify number exists
    const number = await virtualNumberRepo.findById(id);
    if (!number) {
        throw new error_handler_1.NotFoundError('Virtual number not found');
    }
    const configuration = await configRepo.findByNumberId(id);
    if (!configuration) {
        throw new error_handler_1.NotFoundError('Number configuration not found');
    }
    res.json({ data: configuration });
}));
// Update number configuration
exports.numbersRouter.put('/:id/configuration', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    // Verify number exists
    const number = await virtualNumberRepo.findById(id);
    if (!number) {
        throw new error_handler_1.NotFoundError('Virtual number not found');
    }
    // Check if configuration exists, create if not
    let configuration = await configRepo.findByNumberId(id);
    if (!configuration) {
        configuration = await configRepo.createDefaultConfiguration(id);
    }
    // Update configuration
    const updatedConfig = await configRepo.update(id, updateData);
    res.json({ data: updatedConfig });
}));
// Reserve a number (placeholder for purchase flow)
exports.numbersRouter.post('/:phoneNumber/reserve', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { phoneNumber } = req.params;
    const { userId } = req.body;
    if (!userId) {
        throw new error_handler_1.ValidationError('userId is required');
    }
    // Check if number exists and is available
    const number = await virtualNumberRepo.findByPhoneNumber(phoneNumber);
    if (!number) {
        throw new error_handler_1.NotFoundError('Phone number not found');
    }
    if (number.status !== client_1.NumberStatus.AVAILABLE) {
        throw new error_handler_1.ValidationError('Phone number is not available for reservation');
    }
    // Create reservation (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await virtualNumberRepo.reserveNumber(phoneNumber, userId, expiresAt);
    res.json({
        message: 'Number reserved successfully',
        phoneNumber,
        expiresAt,
    });
}));
// Release a reservation
exports.numbersRouter.delete('/:phoneNumber/reserve', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { phoneNumber } = req.params;
    await virtualNumberRepo.releaseReservation(phoneNumber);
    res.json({
        message: 'Reservation released successfully',
        phoneNumber,
    });
}));
// Get number details and availability
exports.numbersRouter.get('/details/:phoneNumber', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { phoneNumber } = req.params;
    const numberDetails = await searchService.getNumberDetails(phoneNumber);
    if (!numberDetails) {
        throw new error_handler_1.NotFoundError('Number not available or not found');
    }
    res.json({
        success: true,
        data: numberDetails,
    });
}));
// Check bulk availability
exports.numbersRouter.post('/availability/bulk', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { phoneNumbers } = req.body;
    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        throw new error_handler_1.ValidationError('phoneNumbers array is required');
    }
    if (phoneNumbers.length > 100) {
        throw new error_handler_1.ValidationError('Maximum 100 phone numbers allowed per request');
    }
    const availability = await searchService.checkBulkAvailability(phoneNumbers);
    res.json({
        success: true,
        data: availability,
        summary: {
            total: phoneNumbers.length,
            available: Object.values(availability).filter(Boolean).length,
            unavailable: Object.values(availability).filter(a => !a).length,
        },
    });
}));
// Get search suggestions
exports.numbersRouter.get('/search/suggestions', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const { countryCode, areaCode, city } = req.query;
    const partialCriteria = {
        countryCode: countryCode,
        areaCode: areaCode,
        city: city,
    };
    const suggestions = await searchService.getSearchSuggestions(partialCriteria);
    res.json({
        success: true,
        data: suggestions,
    });
}));
// Advanced search with filters and sorting
exports.numbersRouter.post('/search/advanced', (0, error_handler_1.asyncHandler)(async (req, res) => {
    const searchCriteria = req.body;
    if (!searchCriteria.countryCode) {
        throw new error_handler_1.ValidationError('countryCode is required');
    }
    const searchResult = await searchService.searchNumbers(searchCriteria);
    res.json({
        success: true,
        data: searchResult,
        searchCriteria,
    });
}));
