/**
 * Phone number utility functions
 */
export interface ParsedPhoneNumber {
    countryCode: string;
    nationalNumber: string;
    areaCode: string;
    localNumber: string;
    isValid: boolean;
}
/**
 * Parse a phone number in E.164 format
 */
export declare function parsePhoneNumber(phoneNumber: string): ParsedPhoneNumber;
/**
 * Format a phone number for display
 */
export declare function formatPhoneNumber(phoneNumber: string, format?: 'international' | 'national' | 'e164'): string;
/**
 * Validate phone number format
 */
export declare function isValidPhoneNumber(phoneNumber: string): boolean;
/**
 * Get country code from phone number
 */
export declare function getCountryCode(phoneNumber: string): string | null;
/**
 * Generate a random phone number for testing
 */
export declare function generateRandomPhoneNumber(countryCode?: string): string;
