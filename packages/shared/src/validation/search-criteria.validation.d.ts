import Joi from 'joi';
export declare const searchCriteriaSchema: Joi.ObjectSchema<any>;
export declare const numberReservationSchema: Joi.ObjectSchema<any>;
export declare const availableNumberSchema: Joi.ObjectSchema<any>;
export declare const validateSearchCriteria: (data: unknown) => Joi.ValidationResult<any>;
export declare const validateNumberReservation: (data: unknown) => Joi.ValidationResult<any>;
export declare const validateAvailableNumber: (data: unknown) => Joi.ValidationResult<any>;
