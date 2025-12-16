/**
 * Date utility functions for VoxLink
 */
/**
 * Check if a date is within business hours
 */
export declare function isWithinBusinessHours(date: Date, schedule: Record<string, {
    open: string;
    close: string;
    enabled: boolean;
}>, timezone?: string, holidays?: Date[]): boolean;
/**
 * Get the start and end of a billing period
 */
export declare function getBillingPeriod(date: Date, period: 'monthly' | 'quarterly' | 'yearly'): {
    start: Date;
    end: Date;
};
/**
 * Add business days to a date (excluding weekends and holidays)
 */
export declare function addBusinessDays(date: Date, days: number, holidays?: Date[]): Date;
/**
 * Format duration in seconds to human readable format
 */
export declare function formatDuration(seconds: number): string;
/**
 * Get timezone offset in minutes
 */
export declare function getTimezoneOffset(timezone: string): number;
/**
 * Convert date to specific timezone
 */
export declare function convertToTimezone(date: Date, timezone: string): Date;
