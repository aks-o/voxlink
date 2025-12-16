/**
 * Date utility functions for VoxLink
 */

/**
 * Check if a date is within business hours
 */
export function isWithinBusinessHours(
  date: Date,
  schedule: Record<string, { open: string; close: string; enabled: boolean }>,
  timezone: string = 'UTC',
  holidays: Date[] = []
): boolean {
  // Check if it's a holiday
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const isHoliday = holidays.some(holiday => {
    const holidayDate = new Date(holiday.getFullYear(), holiday.getMonth(), holiday.getDate());
    return dateOnly.getTime() === holidayDate.getTime();
  });
  
  if (isHoliday) {
    return false;
  }

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[date.getDay()];
  
  const daySchedule = schedule[dayName];
  if (!daySchedule || !daySchedule.enabled) {
    return false;
  }

  // Convert time to minutes for comparison
  const currentTime = date.getHours() * 60 + date.getMinutes();
  const [openHour, openMinute] = daySchedule.open.split(':').map(Number);
  const [closeHour, closeMinute] = daySchedule.close.split(':').map(Number);
  
  const openTime = openHour * 60 + openMinute;
  const closeTime = closeHour * 60 + closeMinute;
  
  return currentTime >= openTime && currentTime <= closeTime;
}

/**
 * Get the start and end of a billing period
 */
export function getBillingPeriod(date: Date, period: 'monthly' | 'quarterly' | 'yearly'): { start: Date; end: Date } {
  const start = new Date(date);
  const end = new Date(date);
  
  switch (period) {
    case 'monthly':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
      
    case 'quarterly':
      const quarter = Math.floor(date.getMonth() / 3);
      start.setMonth(quarter * 3, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(quarter * 3 + 3, 0);
      end.setHours(23, 59, 59, 999);
      break;
      
    case 'yearly':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }
  
  return { start, end };
}

/**
 * Add business days to a date (excluding weekends and holidays)
 */
export function addBusinessDays(date: Date, days: number, holidays: Date[] = []): Date {
  const result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (result.getDay() === 0 || result.getDay() === 6) {
      continue;
    }
    
    // Skip holidays
    const isHoliday = holidays.some(holiday => {
      return result.toDateString() === holiday.toDateString();
    });
    
    if (!isHoliday) {
      addedDays++;
    }
  }
  
  return result;
}

/**
 * Format duration in seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  let result = `${hours}h`;
  if (remainingMinutes > 0) {
    result += ` ${remainingMinutes}m`;
  }
  if (remainingSeconds > 0) {
    result += ` ${remainingSeconds}s`;
  }
  
  return result;
}

/**
 * Get timezone offset in minutes
 */
export function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const targetTime = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    return (targetTime.getTime() - utc.getTime()) / 60000;
  } catch (error) {
    console.warn(`Invalid timezone: ${timezone}, using UTC`);
    return 0;
  }
}

/**
 * Convert date to specific timezone
 */
export function convertToTimezone(date: Date, timezone: string): Date {
  try {
    return new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  } catch (error) {
    console.warn(`Invalid timezone: ${timezone}, using original date`);
    return date;
  }
}