import { Router, Request, Response } from 'express';
import { NumberStatus } from '@prisma/client';
import { VirtualNumberRepository } from '../repositories/virtual-number.repository';
import { NumberConfigurationRepository } from '../repositories/number-configuration.repository';
import { NumberSearchService } from '../services/number-search.service';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error-handler';

export const numbersRouter = Router();

const virtualNumberRepo = new VirtualNumberRepository();
const configRepo = new NumberConfigurationRepository();
const searchService = new NumberSearchService();

// Get all numbers for a user (placeholder - will add auth later)
numbersRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { ownerId, limit = '50', offset = '0' } = req.query;
  
  if (!ownerId) {
    throw new ValidationError('ownerId query parameter is required');
  }

  const numbers = await virtualNumberRepo.findByOwner(
    ownerId as string,
    parseInt(limit as string, 10),
    parseInt(offset as string, 10)
  );

  const total = await virtualNumberRepo.countByOwner(ownerId as string);

  res.json({
    data: numbers,
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
}));

// Get number by ID
numbersRouter.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const number = await virtualNumberRepo.findById(id);
  
  if (!number) {
    throw new NotFoundError('Virtual number not found');
  }

  res.json({ data: number });
}));

// Search available numbers
numbersRouter.get('/search/available', asyncHandler(async (req: Request, res: Response) => {
  const { 
    countryCode, 
    areaCode, 
    city, 
    region, 
    pattern,
    features,
    maxMonthlyRate,
    maxSetupFee,
    limit = '10',
    sortBy,
    preferredFeatures,
    preferredAreaCodes
  } = req.query;
  
  // Build search criteria
  const searchCriteria = {
    countryCode: countryCode as string,
    areaCode: areaCode as string,
    city: city as string,
    region: region as string,
    pattern: pattern as string,
    features: features ? (features as string).split(',') : undefined,
    maxMonthlyRate: maxMonthlyRate ? parseInt(maxMonthlyRate as string, 10) : undefined,
    maxSetupFee: maxSetupFee ? parseInt(maxSetupFee as string, 10) : undefined,
    limit: parseInt(limit as string, 10),
    preferences: {
      sortBy: sortBy as 'cost' | 'features' | 'location',
      preferredFeatures: preferredFeatures ? (preferredFeatures as string).split(',') : undefined,
      preferredAreaCodes: preferredAreaCodes ? (preferredAreaCodes as string).split(',') : undefined,
    },
  };

  // Validate required fields
  if (!searchCriteria.countryCode) {
    throw new ValidationError('countryCode is required');
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
numbersRouter.get('/:id/configuration', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Verify number exists
  const number = await virtualNumberRepo.findById(id);
  if (!number) {
    throw new NotFoundError('Virtual number not found');
  }

  const configuration = await configRepo.findByNumberId(id);
  
  if (!configuration) {
    throw new NotFoundError('Number configuration not found');
  }

  res.json({ data: configuration });
}));

// Update number configuration
numbersRouter.put('/:id/configuration', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  
  // Verify number exists
  const number = await virtualNumberRepo.findById(id);
  if (!number) {
    throw new NotFoundError('Virtual number not found');
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
numbersRouter.post('/:phoneNumber/reserve', asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumber } = req.params;
  const { userId } = req.body;
  
  if (!userId) {
    throw new ValidationError('userId is required');
  }

  // Check if number exists and is available
  const number = await virtualNumberRepo.findByPhoneNumber(phoneNumber);
  if (!number) {
    throw new NotFoundError('Phone number not found');
  }

  if (number.status !== NumberStatus.available) {
    throw new ValidationError('Phone number is not available for reservation');
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
numbersRouter.delete('/:phoneNumber/reserve', asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumber } = req.params;
  
  await virtualNumberRepo.releaseReservation(phoneNumber);

  res.json({
    message: 'Reservation released successfully',
    phoneNumber,
  });
}));

// Get number details and availability
numbersRouter.get('/details/:phoneNumber', asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumber } = req.params;
  
  const numberDetails = await searchService.getNumberDetails(phoneNumber);
  
  if (!numberDetails) {
    throw new NotFoundError('Number not available or not found');
  }

  res.json({
    success: true,
    data: numberDetails,
  });
}));

// Check bulk availability
numbersRouter.post('/availability/bulk', asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumbers } = req.body;
  
  if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    throw new ValidationError('phoneNumbers array is required');
  }

  if (phoneNumbers.length > 100) {
    throw new ValidationError('Maximum 100 phone numbers allowed per request');
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
numbersRouter.get('/search/suggestions', asyncHandler(async (req: Request, res: Response) => {
  const { countryCode, areaCode, city } = req.query;
  
  const partialCriteria = {
    countryCode: countryCode as string,
    areaCode: areaCode as string,
    city: city as string,
  };

  const suggestions = await searchService.getSearchSuggestions(partialCriteria);

  res.json({
    success: true,
    data: suggestions,
  });
}));

// Advanced search with filters and sorting
numbersRouter.post('/search/advanced', asyncHandler(async (req: Request, res: Response) => {
  const searchCriteria = req.body;
  
  if (!searchCriteria.countryCode) {
    throw new ValidationError('countryCode is required');
  }

  const searchResult = await searchService.searchNumbers(searchCriteria);

  res.json({
    success: true,
    data: searchResult,
    searchCriteria,
  });
}));
