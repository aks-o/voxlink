"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAddress = exports.validateCreatePortingRequest = exports.validatePortingRequest = exports.createPortingRequestSchema = exports.portingRequestSchema = exports.portingStatusUpdateSchema = exports.portingDocumentSchema = exports.addressSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.addressSchema = joi_1.default.object({
    street: joi_1.default.string().min(1).max(200).required(),
    city: joi_1.default.string().min(1).max(100).required(),
    state: joi_1.default.string().min(2).max(50).required(),
    zipCode: joi_1.default.string().min(5).max(10).required(),
    country: joi_1.default.string().length(2).uppercase().required(),
});
exports.portingDocumentSchema = joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
    type: joi_1.default.string().valid('bill', 'authorization', 'identification', 'other').required(),
    filename: joi_1.default.string().min(1).max(255).required(),
    url: joi_1.default.string().uri().required(),
    uploadedAt: joi_1.default.date().required(),
});
exports.portingStatusUpdateSchema = joi_1.default.object({
    status: joi_1.default.string().valid('submitted', 'processing', 'approved', 'completed', 'failed', 'cancelled').required(),
    message: joi_1.default.string().min(1).max(500).required(),
    timestamp: joi_1.default.date().required(),
    updatedBy: joi_1.default.string().min(1).max(100).required(),
});
exports.portingRequestSchema = joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
    userId: joi_1.default.string().uuid().required(),
    currentNumber: joi_1.default.string()
        .pattern(/^\+[1-9]\d{1,14}$/)
        .required(),
    currentCarrier: joi_1.default.string().min(1).max(100).required(),
    accountNumber: joi_1.default.string().min(1).max(50).required(),
    pin: joi_1.default.string().min(4).max(20).required(),
    authorizedName: joi_1.default.string().min(1).max(100).required(),
    billingAddress: exports.addressSchema.required(),
    status: joi_1.default.string().valid('submitted', 'processing', 'approved', 'completed', 'failed', 'cancelled').required(),
    estimatedCompletion: joi_1.default.date().greater('now').required(),
    actualCompletion: joi_1.default.date().optional(),
    documents: joi_1.default.array().items(exports.portingDocumentSchema).min(1).required(),
    statusHistory: joi_1.default.array().items(exports.portingStatusUpdateSchema).required(),
    notes: joi_1.default.string().max(1000).optional(),
    createdAt: joi_1.default.date().required(),
    updatedAt: joi_1.default.date().required(),
});
// Create porting request validation (subset of full schema)
exports.createPortingRequestSchema = joi_1.default.object({
    currentNumber: joi_1.default.string()
        .pattern(/^\+[1-9]\d{1,14}$/)
        .required(),
    currentCarrier: joi_1.default.string().min(1).max(100).required(),
    accountNumber: joi_1.default.string().min(1).max(50).required(),
    pin: joi_1.default.string().min(4).max(20).required(),
    authorizedName: joi_1.default.string().min(1).max(100).required(),
    billingAddress: exports.addressSchema.required(),
    notes: joi_1.default.string().max(1000).optional(),
});
// Validation functions
const validatePortingRequest = (data) => {
    return exports.portingRequestSchema.validate(data, { abortEarly: false });
};
exports.validatePortingRequest = validatePortingRequest;
const validateCreatePortingRequest = (data) => {
    return exports.createPortingRequestSchema.validate(data, { abortEarly: false });
};
exports.validateCreatePortingRequest = validateCreatePortingRequest;
const validateAddress = (data) => {
    return exports.addressSchema.validate(data, { abortEarly: false });
};
exports.validateAddress = validateAddress;
