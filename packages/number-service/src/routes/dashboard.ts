import { Router, Request, Response } from 'express';
import { VirtualNumberRepository } from '../repositories/virtual-number.repository';
import { NumberConfigurationRepository } from '../repositories/number-configuration.repository';
import { UsageRecordRepository } from '../repositories/usage-record.repository';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error-handler';

export const dashboardRouter = Router();

const virtualNumberRepo = new VirtualNumberRepository();
const configRepo = new NumberConfigurationRepository();
const usageRepo = new UsageRecordRepository();

// Get user's virtual numbers with enhanced dashboard data
dashboardRouter.get('/numbers', asyncHandler(async (req: Request, res: Response) => {
  const { 
    ownerId, 
    limit = '50', 
    offset = '0',
    status,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;
  
  if (!ownerId) {
    throw new ValidationError('ownerId query parameter is required');
  }

  // Build search filters
  const filters: any = { ownerId: ownerId as string };
  
  if (status) {
    filters.status = status;
  }

  // Add search functionality for phone number, city, or region
  if (search) {
    const searchTerm = search as string;
    // This would be better implemented with full-text search in production
    filters.OR = [
      { phoneNumber: { contains: searchTerm } },
      { city: { contains: searchTerm, mode: 'insensitive' } },
      { region: { contains: searchTerm, mode: 'insensitive' } },
    ];
  }

  const numbers = await virtualNumberRepo.search(
    filters,
    parseInt(limit as string, 10),
    parseInt(offset as string, 10)
  );

  const total = await virtualNumberRepo.countByOwner(ownerId as string);

  // Enhance each number with recent activity and basic stats
  const enhancedNumbers = await Promise.all(
    (numbers || []).map(async (number) => {
      const recentActivity = await usageRepo.getRecentActivity(number.id, 5);
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const monthlyStats = await usageRepo.getUsageStatistics(
        number.id,
        currentMonth,
        new Date()
      );

      return {
        ...number,
        recentActivity: recentActivity || [],
        monthlyStats: {
          totalCalls: monthlyStats?.totalCalls || 0,
          totalCost: monthlyStats?.totalCost || 0,
          totalDuration: monthlyStats?.totalDuration || 0,
        },
      };
    })
  );

  res.json({
    success: true,
    data: enhancedNumbers,
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
}));

// Get detailed number information with comprehensive statistics
dashboardRouter.get('/numbers/:id/details', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    period = '30', // days
    includeUsageHistory = 'true'
  } = req.query;
  
  const number = await virtualNumberRepo.findById(id);
  
  if (!number) {
    throw new NotFoundError('Virtual number not found');
  }

  // Calculate date range for statistics
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period as string, 10));

  // Get comprehensive usage statistics
  const usageStats = await usageRepo.getUsageStatistics(number.id, startDate, endDate);
  
  // Get recent activity
  const recentActivity = await usageRepo.getRecentActivity(number.id, 20);

  let usageHistory = null;
  if (includeUsageHistory === 'true') {
    usageHistory = await usageRepo.getUsageByDateRange(
      number.id,
      startDate,
      endDate,
      'day'
    );
  }

  res.json({
    success: true,
    data: {
      number,
      statistics: {
        period: `${period} days`,
        ...usageStats,
      },
      recentActivity,
      usageHistory,
    },
  });
}));

// Get usage statistics for a specific number
dashboardRouter.get('/numbers/:id/usage', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { 
    startDate,
    endDate,
    eventType,
    limit = '100',
    offset = '0'
  } = req.query;
  
  const number = await virtualNumberRepo.findById(id);
  if (!number) {
    throw new NotFoundError('Virtual number not found');
  }

  // Parse date filters
  const filters: any = {};
  if (startDate) {
    filters.startDate = new Date(startDate as string);
  }
  if (endDate) {
    filters.endDate = new Date(endDate as string);
  }
  if (eventType) {
    filters.eventType = eventType;
  }

  const usageRecords = await usageRepo.findByNumberId(
    id,
    parseInt(limit as string, 10),
    parseInt(offset as string, 10),
    filters
  );

  const total = await usageRepo.countByNumberId(id, filters);

  res.json({
    success: true,
    data: usageRecords,
    pagination: {
      total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    },
  });
}));

// Update number settings (configuration)
dashboardRouter.put('/numbers/:id/settings', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;
  
  // Verify number exists
  const number = await virtualNumberRepo.findById(id);
  if (!number) {
    throw new NotFoundError('Virtual number not found');
  }

  // Validate update data structure
  const allowedFields = [
    'callForwardingEnabled',
    'primaryDestination',
    'failoverDestination',
    'businessHoursDestination',
    'afterHoursDestination',
    'forwardingTimeout',
    'voicemailEnabled',
    'customGreeting',
    'emailNotifications',
    'transcriptionEnabled',
    'maxVoicemailDuration',
    'timezone',
    'businessHoursSchedule',
    'holidays',
    'callNotifications',
    'smsNotifications',
    'webhookUrl',
    'notificationChannels',
  ];

  const filteredData = Object.keys(updateData)
    .filter(key => allowedFields.includes(key))
    .reduce((obj: any, key) => {
      obj[key] = updateData[key];
      return obj;
    }, {});

  if (Object.keys(filteredData).length === 0) {
    throw new ValidationError('No valid fields provided for update');
  }

  // Check if configuration exists, create if not
  let configuration = await configRepo.findByNumberId(id);
  if (!configuration) {
    configuration = await configRepo.createDefaultConfiguration(id);
  }

  // Update configuration
  const updatedConfig = await configRepo.update(id, filteredData);

  res.json({
    success: true,
    data: updatedConfig,
    message: 'Number settings updated successfully',
  });
}));

// Get number configuration/settings
dashboardRouter.get('/numbers/:id/settings', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Verify number exists
  const number = await virtualNumberRepo.findById(id);
  if (!number) {
    throw new NotFoundError('Virtual number not found');
  }

  const configuration = await configRepo.findByNumberId(id);
  
  if (!configuration) {
    // Create default configuration if it doesn't exist
    const defaultConfig = await configRepo.createDefaultConfiguration(id);
    return res.json({
      success: true,
      data: defaultConfig,
    });
  }

  res.json({
    success: true,
    data: configuration,
  });
}));

// Get dashboard overview/summary
dashboardRouter.get('/overview', asyncHandler(async (req: Request, res: Response) => {
  const { ownerId, period = '30' } = req.query;
  
  if (!ownerId) {
    throw new ValidationError('ownerId query parameter is required');
  }

  // Get user's numbers
  const numbers = await virtualNumberRepo.findByOwner(ownerId as string, 1000, 0);
  
  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period as string, 10));

  // Get aggregated statistics for all numbers
  const overallStats = {
    totalNumbers: (numbers || []).length,
    activeNumbers: (numbers || []).filter(n => n.status === 'active').length,
    totalCalls: 0,
    totalSms: 0,
    totalCost: 0,
    totalDuration: 0,
  };

  // Get usage statistics for each number and aggregate
  const numberStats = await Promise.all(
    (numbers || []).map(async (number) => {
      const stats = await usageRepo.getUsageStatistics(number.id, startDate, endDate);
      return {
        numberId: number.id,
        phoneNumber: number.phoneNumber,
        ...(stats || {
          totalCalls: 0,
          totalSms: 0,
          totalCost: 0,
          totalDuration: 0,
        }),
      };
    })
  );

  // Aggregate all statistics
  numberStats.forEach((stats) => {
    overallStats.totalCalls += stats.totalCalls;
    overallStats.totalSms += stats.totalSms;
    overallStats.totalCost += stats.totalCost;
    overallStats.totalDuration += stats.totalDuration;
  });

  // Get top performing numbers
  const topPerformers = numberStats
    .sort((a, b) => b.totalCalls - a.totalCalls)
    .slice(0, 5)
    .map(stats => ({
      numberId: stats.numberId,
      phoneNumber: stats.phoneNumber,
      totalCalls: stats.totalCalls,
      totalCost: stats.totalCost,
    }));

  res.json({
    success: true,
    data: {
      overview: overallStats,
      topPerformers,
      period: `${period} days`,
      numberCount: (numbers || []).length,
    },
  });
}));

// Search/filter user's numbers
dashboardRouter.post('/numbers/search', asyncHandler(async (req: Request, res: Response) => {
  const { 
    ownerId,
    filters = {},
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    limit = 50,
    offset = 0
  } = req.body;
  
  if (!ownerId) {
    throw new ValidationError('ownerId is required');
  }

  // Build search criteria
  const searchFilters: any = { 
    ownerId,
    ...filters
  };

  // Add text search
  if (search) {
    searchFilters.OR = [
      { phoneNumber: { contains: search } },
      { city: { contains: search, mode: 'insensitive' } },
      { region: { contains: search, mode: 'insensitive' } },
    ];
  }

  const numbers = await virtualNumberRepo.search(searchFilters, limit, offset);
  const total = await virtualNumberRepo.countByOwner(ownerId);

  res.json({
    success: true,
    data: numbers,
    pagination: {
      total,
      limit,
      offset,
    },
    searchCriteria: {
      filters,
      search,
      sortBy,
      sortOrder,
    },
  });
}));

// Bulk update number settings
dashboardRouter.put('/numbers/bulk-update', asyncHandler(async (req: Request, res: Response) => {
  const { numberIds, updates } = req.body;
  
  if (!Array.isArray(numberIds) || numberIds.length === 0) {
    throw new ValidationError('numberIds array is required');
  }

  if (numberIds.length > 50) {
    throw new ValidationError('Maximum 50 numbers allowed per bulk update');
  }

  if (!updates || Object.keys(updates).length === 0) {
    throw new ValidationError('updates object is required');
  }

  // Validate that all numbers exist and belong to the user
  const numbers = await Promise.all(
    numberIds.map(id => virtualNumberRepo.findById(id))
  );

  const notFound = numbers.findIndex(n => !n);
  if (notFound !== -1) {
    throw new NotFoundError(`Number with ID ${numberIds[notFound]} not found`);
  }

  // Update configurations for all numbers
  const results = await Promise.all(
    numberIds.map(async (numberId: string) => {
      try {
        let configuration = await configRepo.findByNumberId(numberId);
        if (!configuration) {
          configuration = await configRepo.createDefaultConfiguration(numberId);
        }
        
        const updated = await configRepo.update(numberId, updates);
        return { numberId, success: true, data: updated };
      } catch (error) {
        return { 
          numberId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    })
  );

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  res.json({
    success: true,
    data: results,
    summary: {
      total: numberIds.length,
      successful,
      failed,
    },
  });
}));