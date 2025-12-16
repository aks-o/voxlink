"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAvailableNumber = exports.validateNumberReservation = exports.validateSearchCriteria = exports.availableNumberSchema = exports.numberReservationSchema = exports.searchCriteriaSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.searchCriteriaSchema = joi_1.default.object({
    countryCode: joi_1.default.string().length(2).uppercase().required(),
    areaCode: joi_1.default.string().min(2).max(5).optional(),
    city: joi_1.default.string().min(1).max(100).optional(),
    region: joi_1.default.string().min(1).max(100).optional(),
    pattern: joi_1.default.string().max(50).optional(),
    features: joi_1.default.array().items(joi_1.default.string()).optional(),
    maxSetupFee: joi_1.default.number().integer().min(0).optional(),
    maxMonthlyRate: joi_1.default.number().integer().min(0).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
});
exports.numberReservationSchema = joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
    phoneNumber: joi_1.default.string()
        .pattern(/^\+[1-9]\d{1,14}$/)
        .required(),
    userId: joi_1.default.string().uuid().required(),
    expiresAt: joi_1.default.date().greater('now').required(),
    createdAt: joi_1.default.date().required(),
});
exports.availableNumberSchema = joi_1.default.object({
    phoneNumber: joi_1.default.string()
        .pattern(/^\+[1-9]\d{1,14}$/)
        .required(),
    countryCode: joi_1.default.string().length(2).uppercase().required(),
    areaCode: joi_1.default.string().min(2).max(5).required(),
    city: joi_1.default.string().min(1).max(100).required(),
    region: joi_1.default.string().min(1).max(100).required(),
    monthlyRate: joi_1.default.number().integer().min(0).required(),
    setupFee: joi_1.default.number().integer().min(0).required(),
    features: joi_1.default.array().items(joi_1.default.string()).required(),
    provider: joi_1.default.string().min(1).max(100).required(),
    reservationId: joi_1.default.string().uuid().optional(),
    reservationExpiry: joi_1.default.date().optional(),
});
// Validation functions
const validateSearchCriteria = (data) => {
    return exports.searchCriteriaSchema.validate(data, { abortEarly: false });
};
exports.validateSearchCriteria = validateSearchCriteria;
const validateNumberReservation = (data) => {
    return exports.numberReservationSchema.validate(data, { abortEarly: false });
};
exports.validateNumberReservation = validateNumberReservation;
const validateAvailableNumber = (data) => {
    return exports.availableNumberSchema.validate(data, { abortEarly: false });
};
exports.validateAvailableNumber = validateAvailableNumber;
