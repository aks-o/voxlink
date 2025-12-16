import Joi from 'joi';

export const searchCriteriaSchema = Joi.object({
  countryCode: Joi.string().length(2).uppercase().required(),
  areaCode: Joi.string().min(2).max(5).optional(),
  city: Joi.string().min(1).max(100).optional(),
  region: Joi.string().min(1).max(100).optional(),
  pattern: Joi.string().max(50).optional(),
  features: Joi.array().items(Joi.string()).optional(),
  maxSetupFee: Joi.number().integer().min(0).optional(),
  maxMonthlyRate: Joi.number().integer().min(0).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

export const numberReservationSchema = Joi.object({
  id: Joi.string().uuid().required(),
  phoneNumber: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required(),
  userId: Joi.string().uuid().required(),
  expiresAt: Joi.date().greater('now').required(),
  createdAt: Joi.date().required(),
});

export const availableNumberSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^\+[1-9]\d{1,14}$/)
    .required(),
  countryCode: Joi.string().length(2).uppercase().required(),
  areaCode: Joi.string().min(2).max(5).required(),
  city: Joi.string().min(1).max(100).required(),
  region: Joi.string().min(1).max(100).required(),
  monthlyRate: Joi.number().integer().min(0).required(),
  setupFee: Joi.number().integer().min(0).required(),
  features: Joi.array().items(Joi.string()).required(),
  provider: Joi.string().min(1).max(100).required(),
  reservationId: Joi.string().uuid().optional(),
  reservationExpiry: Joi.date().optional(),
});

// Validation functions
export const validateSearchCriteria = (data: unknown) => {
  return searchCriteriaSchema.validate(data, { abortEarly: false });
};

export const validateNumberReservation = (data: unknown) => {
  return numberReservationSchema.validate(data, { abortEarly: false });
};

export const validateAvailableNumber = (data: unknown) => {
  return availableNumberSchema.validate(data, { abortEarly: false });
};