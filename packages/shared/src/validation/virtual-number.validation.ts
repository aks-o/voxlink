import Joi from 'joi';
import { NumberStatus, NumberFeature } from '../types/virtual-number';

export const numberStatusSchema = Joi.string().valid(
  'available',
  'reserved', 
  'active',
  'suspended',
  'porting'
);

export const numberFeatureSchema = Joi.string().valid(
  'call_forwarding',
  'voicemail',
  'sms',
  'international_calling',
  'call_recording',
  'analytics'
);

export const phoneNumberSchema = Joi.string()
  .pattern(/^\+[1-9]\d{1,14}$/)
  .required()
  .messages({
    'string.pattern.base': 'Phone number must be in E.164 format (e.g., +1234567890)',
  });

export const callForwardingConfigSchema = Joi.object({
  enabled: Joi.boolean().required(),
  primaryDestination: Joi.when('enabled', {
    is: true,
    then: phoneNumberSchema.required(),
    otherwise: Joi.string().optional(),
  }),
  failoverDestination: phoneNumberSchema.optional(),
  businessHoursDestination: phoneNumberSchema.optional(),
  afterHoursDestination: phoneNumberSchema.optional(),
  timeout: Joi.number().integer().min(5).max(120).default(30),
});

export const voicemailConfigSchema = Joi.object({
  enabled: Joi.boolean().required(),
  customGreeting: Joi.string().max(500).optional(),
  emailNotifications: Joi.boolean().default(true),
  transcriptionEnabled: Joi.boolean().default(false),
  maxDuration: Joi.number().integer().min(30).max(600).default(180),
});

export const businessHoursConfigSchema = Joi.object({
  timezone: Joi.string().required(),
  schedule: Joi.object().pattern(
    Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
    Joi.object({
      open: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      close: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      enabled: Joi.boolean().required(),
    })
  ).required(),
  holidays: Joi.array().items(Joi.date()).default([]),
});

export const notificationConfigSchema = Joi.object({
  callNotifications: Joi.boolean().default(true),
  smsNotifications: Joi.boolean().default(true),
  emailNotifications: Joi.boolean().default(true),
  webhookUrl: Joi.string().uri().optional(),
  notificationChannels: Joi.array()
    .items(Joi.string().valid('email', 'sms', 'webhook'))
    .min(1)
    .default(['email']),
});

export const numberConfigurationSchema = Joi.object({
  id: Joi.string().uuid().required(),
  numberId: Joi.string().uuid().required(),
  callForwarding: callForwardingConfigSchema.required(),
  voicemail: voicemailConfigSchema.required(),
  businessHours: businessHoursConfigSchema.required(),
  notifications: notificationConfigSchema.required(),
  createdAt: Joi.date().required(),
  updatedAt: Joi.date().required(),
});

export const virtualNumberSchema = Joi.object({
  id: Joi.string().uuid().required(),
  phoneNumber: phoneNumberSchema,
  countryCode: Joi.string().length(2).uppercase().required(),
  areaCode: Joi.string().min(2).max(5).required(),
  city: Joi.string().min(1).max(100).required(),
  region: Joi.string().min(1).max(100).required(),
  status: numberStatusSchema.required(),
  ownerId: Joi.string().uuid().required(),
  purchaseDate: Joi.date().required(),
  activationDate: Joi.date().optional(),
  monthlyRate: Joi.number().integer().min(0).required(),
  setupFee: Joi.number().integer().min(0).required(),
  features: Joi.array().items(numberFeatureSchema).required(),
  configuration: numberConfigurationSchema.required(),
  createdAt: Joi.date().required(),
  updatedAt: Joi.date().required(),
});

// Validation functions
export const validateVirtualNumber = (data: unknown) => {
  return virtualNumberSchema.validate(data, { abortEarly: false });
};

export const validateNumberConfiguration = (data: unknown) => {
  return numberConfigurationSchema.validate(data, { abortEarly: false });
};

export const validateCallForwardingConfig = (data: unknown) => {
  return callForwardingConfigSchema.validate(data, { abortEarly: false });
};