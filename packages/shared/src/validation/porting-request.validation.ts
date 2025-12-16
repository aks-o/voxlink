import Joi from 'joi';

export const addressSchema = Joi.object({
  street: Joi.string().min(1).max(200).required(),
  city: Joi.string().min(1).max(100).required(),
  state: Joi.string().min(2).max(50).required(),
  zipCode: Joi.string().min(5).max(10).required(),
  country: Joi.string().length(2).uppercase().required(),
});

export const portingDocumentSchema = Joi.object({
  id: Joi.string().uuid().required(),
  type: Joi.string().valid('bill', 'authorization', 'identification', 'other').required(),
  filename: Joi.string().min(1).max(255).required(),
  url: Joi.string().uri().required(),
  uploadedAt: Joi.date().required(),
});

export const portingStatusUpdateSchema = Joi.object({
  status: Joi.string().valid(
    'submitted',
    'processing',
    'approved',
    'completed',
    'failed',
    'cancelled'
  ).required(),
  message: Joi.string().min(1).max(500).required(),
  timestamp: Joi.date().required(),
  updatedBy: Joi.string().min(1).max(100).required(),
});

export const portingRequestSchema = Joi.object({
  id: Joi.string().uuid().required(),
  userId: Joi.string().uuid().required(),
  currentNumber: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required(),
  currentCarrier: Joi.string().min(1).max(100).required(),
  accountNumber: Joi.string().min(1).max(50).required(),
  pin: Joi.string().min(4).max(20).required(),
  authorizedName: Joi.string().min(1).max(100).required(),
  billingAddress: addressSchema.required(),
  status: Joi.string().valid(
    'submitted',
    'processing',
    'approved',
    'completed',
    'failed',
    'cancelled'
  ).required(),
  estimatedCompletion: Joi.date().greater('now').required(),
  actualCompletion: Joi.date().optional(),
  documents: Joi.array().items(portingDocumentSchema).min(1).required(),
  statusHistory: Joi.array().items(portingStatusUpdateSchema).required(),
  notes: Joi.string().max(1000).optional(),
  createdAt: Joi.date().required(),
  updatedAt: Joi.date().required(),
});

// Create porting request validation (subset of full schema)
export const createPortingRequestSchema = Joi.object({
  currentNumber: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required(),
  currentCarrier: Joi.string().min(1).max(100).required(),
  accountNumber: Joi.string().min(1).max(50).required(),
  pin: Joi.string().min(4).max(20).required(),
  authorizedName: Joi.string().min(1).max(100).required(),
  billingAddress: addressSchema.required(),
  notes: Joi.string().max(1000).optional(),
});

// Validation functions
export const validatePortingRequest = (data: unknown) => {
  return portingRequestSchema.validate(data, { abortEarly: false });
};

export const validateCreatePortingRequest = (data: unknown) => {
  return createPortingRequestSchema.validate(data, { abortEarly: false });
};

export const validateAddress = (data: unknown) => {
  return addressSchema.validate(data, { abortEarly: false });
};