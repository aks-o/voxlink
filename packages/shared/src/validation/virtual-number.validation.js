"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCallForwardingConfig = exports.validateNumberConfiguration = exports.validateVirtualNumber = exports.virtualNumberSchema = exports.numberConfigurationSchema = exports.notificationConfigSchema = exports.businessHoursConfigSchema = exports.voicemailConfigSchema = exports.callForwardingConfigSchema = exports.phoneNumberSchema = exports.numberFeatureSchema = exports.numberStatusSchema = void 0;
const joi_1 = __importDefault(require("joi"));
exports.numberStatusSchema = joi_1.default.string().valid('available', 'reserved', 'active', 'suspended', 'porting');
exports.numberFeatureSchema = joi_1.default.string().valid('call_forwarding', 'voicemail', 'sms', 'international_calling', 'call_recording', 'analytics');
exports.phoneNumberSchema = joi_1.default.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required()
    .messages({
    'string.pattern.base': 'Phone number must be in E.164 format (e.g., +1234567890)',
});
exports.callForwardingConfigSchema = joi_1.default.object({
    enabled: joi_1.default.boolean().required(),
    primaryDestination: joi_1.default.when('enabled', {
        is: true,
        then: exports.phoneNumberSchema.required(),
        otherwise: joi_1.default.string().optional(),
    }),
    failoverDestination: exports.phoneNumberSchema.optional(),
    businessHoursDestination: exports.phoneNumberSchema.optional(),
    afterHoursDestination: exports.phoneNumberSchema.optional(),
    timeout: joi_1.default.number().integer().min(5).max(120).default(30),
});
exports.voicemailConfigSchema = joi_1.default.object({
    enabled: joi_1.default.boolean().required(),
    customGreeting: joi_1.default.string().max(500).optional(),
    emailNotifications: joi_1.default.boolean().default(true),
    transcriptionEnabled: joi_1.default.boolean().default(false),
    maxDuration: joi_1.default.number().integer().min(30).max(600).default(180),
});
exports.businessHoursConfigSchema = joi_1.default.object({
    timezone: joi_1.default.string().required(),
    schedule: joi_1.default.object().pattern(joi_1.default.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'), joi_1.default.object({
        open: joi_1.default.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        close: joi_1.default.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        enabled: joi_1.default.boolean().required(),
    })).required(),
    holidays: joi_1.default.array().items(joi_1.default.date()).default([]),
});
exports.notificationConfigSchema = joi_1.default.object({
    callNotifications: joi_1.default.boolean().default(true),
    smsNotifications: joi_1.default.boolean().default(true),
    emailNotifications: joi_1.default.boolean().default(true),
    webhookUrl: joi_1.default.string().uri().optional(),
    notificationChannels: joi_1.default.array()
        .items(joi_1.default.string().valid('email', 'sms', 'webhook'))
        .min(1)
        .default(['email']),
});
exports.numberConfigurationSchema = joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
    numberId: joi_1.default.string().uuid().required(),
    callForwarding: exports.callForwardingConfigSchema.required(),
    voicemail: exports.voicemailConfigSchema.required(),
    businessHours: exports.businessHoursConfigSchema.required(),
    notifications: exports.notificationConfigSchema.required(),
    createdAt: joi_1.default.date().required(),
    updatedAt: joi_1.default.date().required(),
});
exports.virtualNumberSchema = joi_1.default.object({
    id: joi_1.default.string().uuid().required(),
    phoneNumber: exports.phoneNumberSchema,
    countryCode: joi_1.default.string().length(2).uppercase().required(),
    areaCode: joi_1.default.string().min(2).max(5).required(),
    city: joi_1.default.string().min(1).max(100).required(),
    region: joi_1.default.string().min(1).max(100).required(),
    status: exports.numberStatusSchema.required(),
    ownerId: joi_1.default.string().uuid().required(),
    purchaseDate: joi_1.default.date().required(),
    activationDate: joi_1.default.date().optional(),
    monthlyRate: joi_1.default.number().integer().min(0).required(),
    setupFee: joi_1.default.number().integer().min(0).required(),
    features: joi_1.default.array().items(exports.numberFeatureSchema).required(),
    configuration: exports.numberConfigurationSchema.required(),
    createdAt: joi_1.default.date().required(),
    updatedAt: joi_1.default.date().required(),
});
// Validation functions
const validateVirtualNumber = (data) => {
    return exports.virtualNumberSchema.validate(data, { abortEarly: false });
};
exports.validateVirtualNumber = validateVirtualNumber;
const validateNumberConfiguration = (data) => {
    return exports.numberConfigurationSchema.validate(data, { abortEarly: false });
};
exports.validateNumberConfiguration = validateNumberConfiguration;
const validateCallForwardingConfig = (data) => {
    return exports.callForwardingConfigSchema.validate(data, { abortEarly: false });
};
exports.validateCallForwardingConfig = validateCallForwardingConfig;
