// Types
export * from './types/virtual-number';
export * from './types/usage-record';
export * from './types/porting-request';
export * from './types/search-criteria';
export * from './types/billing';
export * from './types/did-management';
export * from './types/security';
export * from './types/regional-pricing';
export * from './types/indian-pricing';
// Telecom provider types - explicit exports to avoid conflict with PortingRequest
export type {
    TelecomProvider,
    ProviderConfig,
    ProviderCapability,
    ProviderHealthCheck,
    NumberSearchRequest,
    NumberSearchResponse,
    ProviderNumber,
    NumberReservationRequest,
    NumberReservationResponse,
    NumberPurchaseRequest,
    NumberPurchaseResponse,
    PortingRequest as TelecomPortingRequest, // Alias to avoid conflict with DB PortingRequest
    PortingResponse,
    ProviderError,
    ProviderMetrics
} from './types/telecom-provider';

// Validation
export * from './validation/virtual-number.validation';
export * from './validation/search-criteria.validation';
export * from './validation/porting-request.validation';

// Utilities
export * from './utils/phone-number';
export * from './utils/date-helpers';
export * from './utils/cost-calculator';

// Monitoring
export * from './monitoring/error-handler';
export * from './monitoring/logger';
export * from './monitoring/health-check';
export * from './monitoring/dashboard-config';

// Performance and caching services
export * from './services/cache.service';
export * from './services/query-optimizer.service';
export * from './services/cdn.service';
export { PaginationOptions, PaginationResult, CursorPaginationOptions, CursorPaginationResult } from './services/pagination.service';

// Performance middleware
export {
    createCompressionMiddleware,
    createCacheMiddleware,
    responseTimeMiddleware,
    securityHeadersMiddleware,
    requestSizeLimitMiddleware,
    staticAssetMiddleware,
    apiOptimizationMiddleware,
    conditionalRequestMiddleware,
} from './middleware/performance.middleware';

// Performance system export
export * as performanceSystem from './performance';
export { getPerformanceMiddleware, performanceUtils, cacheUtils } from './performance';