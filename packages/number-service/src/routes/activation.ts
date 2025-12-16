import { Router, Request, Response } from 'express';
import { NumberActivationService, ActivationRequest } from '../services/number-activation.service';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error-handler';

export const activationRouter = Router();

const activationService = new NumberActivationService();

// Activate a single number
activationRouter.post('/activate', asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumber, userId, paymentInfo, initialConfiguration } = req.body;

  if (!phoneNumber || !userId) {
    throw new ValidationError('phoneNumber and userId are required');
  }

  const activationRequest: ActivationRequest = {
    phoneNumber,
    userId,
    paymentInfo,
    initialConfiguration,
  };

  const result = await activationService.activateNumber(activationRequest);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error,
      phoneNumber: result.phoneNumber,
    });
  }

  res.json({
    success: true,
    data: result,
    message: 'Number activated successfully',
  });
}));

// Deactivate a number
activationRouter.post('/deactivate', asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumber, userId } = req.body;

  if (!phoneNumber || !userId) {
    throw new ValidationError('phoneNumber and userId are required');
  }

  const result = await activationService.deactivateNumber(phoneNumber, userId);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error,
      phoneNumber: result.phoneNumber,
    });
  }

  res.json({
    success: true,
    data: result,
    message: 'Number deactivated successfully',
  });
}));

// Get activation status
activationRouter.get('/status/:phoneNumber', asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumber } = req.params;

  if (!phoneNumber) {
    throw new ValidationError('phoneNumber is required');
  }

  const status = await activationService.getActivationStatus(phoneNumber);

  res.json({
    success: true,
    data: status,
  });
}));

// Bulk activate numbers
activationRouter.post('/bulk-activate', asyncHandler(async (req: Request, res: Response) => {
  const { requests } = req.body;

  if (!Array.isArray(requests) || requests.length === 0) {
    throw new ValidationError('requests array is required and must not be empty');
  }

  if (requests.length > 50) {
    throw new ValidationError('Maximum 50 numbers can be activated at once');
  }

  // Validate each request
  for (const request of requests) {
    if (!request.phoneNumber || !request.userId) {
      throw new ValidationError('Each request must have phoneNumber and userId');
    }
  }

  const results = await activationService.bulkActivateNumbers(requests);

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  res.json({
    success: true,
    data: results,
    summary: {
      total: requests.length,
      successful,
      failed,
    },
    message: `Bulk activation completed: ${successful} successful, ${failed} failed`,
  });
}));

// Test activation system
activationRouter.post('/test', asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    throw new ValidationError('phoneNumber is required for testing');
  }

  // This is a test endpoint that simulates activation without actually activating
  const testResult = {
    phoneNumber,
    canActivate: true,
    estimatedTime: '30-60 seconds',
    requirements: [
      'Number must be reserved',
      'Valid payment method',
      'User authorization',
    ],
    supportedFeatures: [
      'Call forwarding',
      'Voicemail',
      'SMS',
      'Business hours routing',
    ],
  };

  res.json({
    success: true,
    data: testResult,
    message: 'Activation test completed',
  });
}));