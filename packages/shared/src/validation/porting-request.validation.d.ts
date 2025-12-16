import Joi from 'joi';
export declare const addressSchema: Joi.ObjectSchema<any>;
export declare const portingDocumentSchema: Joi.ObjectSchema<any>;
export declare const portingStatusUpdateSchema: Joi.ObjectSchema<any>;
export declare const portingRequestSchema: Joi.ObjectSchema<any>;
export declare const createPortingRequestSchema: Joi.ObjectSchema<any>;
export declare const validatePortingRequest: (data: unknown) => Joi.ValidationResult<any>;
export declare const validateCreatePortingRequest: (data: unknown) => Joi.ValidationResult<any>;
export declare const validateAddress: (data: unknown) => Joi.ValidationResult<any>;
