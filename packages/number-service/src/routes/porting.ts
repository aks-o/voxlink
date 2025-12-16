import { Router, Request, Response } from 'express';
import { PortingRequestRepository } from '../repositories/porting-request.repository';
import { VirtualNumberRepository } from '../repositories/virtual-number.repository';
import { NumberConfigurationRepository } from '../repositories/number-configuration.repository';
import { PortingService } from '../services/porting.service';
import { asyncHandler, NotFoundError, ValidationError, ConflictError } from '../middleware/error-handler';

export const portingRouter = Router();

const portingRepo = new PortingRequestRepository();
const numberRepo = new VirtualNumberRepository();
const configRepo = new NumberConfigurationRepository();
const portingService = new PortingService(portingRepo, numberRepo, configRepo);

// Create new porting request
portingRouter.post('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    userId,
    currentNumber,
    currentCarrier,
    accountNumber,
    pin,
    authorizedName,
    billingAddress,
    notes,
  } = req.body;

  // Validate required fields
  if (!userId || !currentNumber || !currentCarrier || !accountNumber || !pin || !authorizedName) {
    throw new ValidationError('Missing required fields: userId, currentNumber, currentCarrier, accountNumber, pin, authorizedName');
  }

  if (!billingAddress || !billingAddress.street || !billingAddress.city || !billingAddress.state || !billingAddress.zipCode) {
    throw new ValidationError('Complete billing address is required');
  }

  const portingRequest = await portingService.initiatePorting({
    userId,
    currentNumber,
    currentCarrier,
    accountNumber,
    pin,
    authorizedName,
    billingAddress,
    notes,
  });

  res.status(201).json({
    success: true,
    data: portingRequest,
    message: 'Porting request submitted successfully',
  });
}));

// Get porting request by ID
portingRouter.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const portingRequest = await portingRepo.findByIdWithDetails(id);
  if (!portingRequest) {
    throw new NotFoundError('Porting request not found');
  }

  res.json({
    success: true,
    data: portingRequest,
  });
}));

// Get user's porting requests
portingRouter.get('/user/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { limit = '50', offset = '0' } = req.query;

  const result = await portingService.getUserPortingRequests(
    userId,
    parseInt(limit as string, 10),
    parseInt(offset as string, 10)
  );

  res.json({
    success: true,
    data: result.requests,
    pagination: {
      total: result.total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
}));

// Get porting progress
portingRouter.get('/:id/progress', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const progress = await portingService.getPortingProgress(id);

  res.json({
    success: true,
    data: progress,
  });
}));

// Update porting status (admin endpoint)
portingRouter.put('/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, message, updatedBy } = req.body;

  if (!status || !message || !updatedBy) {
    throw new ValidationError('status, message, and updatedBy are required');
  }

  const validStatuses = ['SUBMITTED', 'PROCESSING', 'APPROVED', 'COMPLETED', 'FAILED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const portingRequest = await portingService.updatePortingStatus(id, status, message, updatedBy);

  res.json({
    success: true,
    data: portingRequest,
    message: 'Porting status updated successfully',
  });
}));

// Cancel porting request
portingRouter.post('/:id/cancel', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason, cancelledBy } = req.body;

  if (!reason || !cancelledBy) {
    throw new ValidationError('reason and cancelledBy are required');
  }

  const portingRequest = await portingService.cancelPortingRequest(id, reason, cancelledBy);

  res.json({
    success: true,
    data: portingRequest,
    message: 'Porting request cancelled successfully',
  });
}));

// Upload document for porting request
portingRouter.post('/:id/documents', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, filename, url } = req.body;

  if (!type || !filename || !url) {
    throw new ValidationError('type, filename, and url are required');
  }

  const validTypes = ['BILL', 'AUTHORIZATION', 'IDENTIFICATION', 'OTHER'];
  if (!validTypes.includes(type)) {
    throw new ValidationError(`Invalid document type. Must be one of: ${validTypes.join(', ')}`);
  }

  // Verify porting request exists
  const portingRequest = await portingRepo.findById(id);
  if (!portingRequest) {
    throw new NotFoundError('Porting request not found');
  }

  const document = await portingRepo.addDocument({
    portingRequestId: id,
    type,
    filename,
    url,
  });

  res.status(201).json({
    success: true,
    data: document,
    message: 'Document uploaded successfully',
  });
}));

// Get documents for porting request
portingRouter.get('/:id/documents', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Verify porting request exists
  const portingRequest = await portingRepo.findById(id);
  if (!portingRequest) {
    throw new NotFoundError('Porting request not found');
  }

  const documents = await portingRepo.getDocuments(id);

  res.json({
    success: true,
    data: documents,
  });
}));

// Delete document
portingRouter.delete('/documents/:documentId', asyncHandler(async (req: Request, res: Response) => {
  const { documentId } = req.params;

  await portingRepo.deleteDocument(documentId);

  res.json({
    success: true,
    message: 'Document deleted successfully',
  });
}));

// Get status history for porting request
portingRouter.get('/:id/history', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Verify porting request exists
  const portingRequest = await portingRepo.findById(id);
  if (!portingRequest) {
    throw new NotFoundError('Porting request not found');
  }

  const history = await portingRepo.getStatusHistory(id);

  res.json({
    success: true,
    data: history,
  });
}));

// Validate porting request data (preview)
portingRouter.post('/validate', asyncHandler(async (req: Request, res: Response) => {
  const portingData = req.body;

  const validation = await portingService.validatePortingRequest(portingData);

  res.json({
    success: true,
    data: validation,
  });
}));

// Search porting requests (admin endpoint)
portingRouter.get('/search/:query', asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.params;
  const { 
    userId,
    status,
    carrier,
    limit = '50',
    offset = '0'
  } = req.query;

  const filters: any = {};
  if (userId) filters.userId = userId as string;
  if (status) filters.status = status as any;
  if (carrier) filters.carrier = carrier as string;

  const results = await portingRepo.search(
    query,
    filters,
    parseInt(limit as string, 10),
    parseInt(offset as string, 10)
  );

  res.json({
    success: true,
    data: results,
    searchQuery: query,
    filters,
  });
}));

// Get porting requests by status (admin endpoint)
portingRouter.get('/status/:status', asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.params;
  const { limit = '50', offset = '0' } = req.query;

  const validStatuses = ['SUBMITTED', 'PROCESSING', 'APPROVED', 'COMPLETED', 'FAILED', 'CANCELLED'];
  if (!validStatuses.includes(status.toUpperCase())) {
    throw new ValidationError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const [requests, total] = await Promise.all([
    portingRepo.findByStatus(
      status.toUpperCase() as any,
      parseInt(limit as string, 10),
      parseInt(offset as string, 10)
    ),
    portingRepo.countByStatus(status.toUpperCase() as any),
  ]);

  res.json({
    success: true,
    data: requests,
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
}));

// Get porting requests requiring attention (admin endpoint)
portingRouter.get('/admin/attention', asyncHandler(async (req: Request, res: Response) => {
  const requests = await portingRepo.getRequestsRequiringAttention();

  res.json({
    success: true,
    data: requests,
    count: requests.length,
  });
}));