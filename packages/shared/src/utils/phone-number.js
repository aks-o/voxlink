"use strict";
/**
 * Phone number utility functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePhoneNumber = parsePhoneNumber;
exports.formatPhoneNumber = formatPhoneNumber;
exports.isValidPhoneNumber = isValidPhoneNumber;
exports.getCountryCode = getCountryCode;
exports.generateRandomPhoneNumber = generateRandomPhoneNumber;
/**
 * Parse a phone number in E.164 format
 */
function parsePhoneNumber(phoneNumber) {
    // Remove any non-digit characters except the leading +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
        return {
            countryCode: '',
            nationalNumber: '',
            areaCode: '',
            localNumber: '',
            isValid: false,
        };
    }
    // Basic parsing for common formats
    const digits = cleaned.substring(1); // Remove the +
    // US/Canada numbers (country code 1)
    if (digits.startsWith('1') && digits.length === 11) {
        return {
            countryCode: '1',
            nationalNumber: digits.substring(1),
            areaCode: digits.substring(1, 4),
            localNumber: digits.substring(4),
            isValid: true,
        };
    }
    // UK numbers (country code 44)
    if (digits.startsWith('44') && digits.length >= 10) {
        return {
            countryCode: '44',
            nationalNumber: digits.substring(2),
            areaCode: digits.substring(2, 5),
            localNumber: digits.substring(5),
            isValid: true,
        };
    }
    // Generic parsing for other countries
    if (digits.length >= 7 && digits.length <= 15) {
        const countryCode = digits.substring(0, Math.min(3, digits.length - 7));
        const nationalNumber = digits.substring(countryCode.length);
        const areaCode = nationalNumber.substring(0, Math.min(3, nationalNumber.length - 4));
        const localNumber = nationalNumber.substring(areaCode.length);
        return {
            countryCode,
            nationalNumber,
            areaCode,
            localNumber,
            isValid: true,
        };
    }
    return {
        countryCode: '',
        nationalNumber: '',
        areaCode: '',
        localNumber: '',
        isValid: false,
    };
}
/**
 * Format a phone number for display
 */
function formatPhoneNumber(phoneNumber, format = 'international') {
    const parsed = parsePhoneNumber(phoneNumber);
    if (!parsed.isValid) {
        return phoneNumber;
    }
    switch (format) {
        case 'e164':
            return `+${parsed.countryCode}${parsed.nationalNumber}`;
        case 'national':
            if (parsed.countryCode === '1') {
                return `(${parsed.areaCode}) ${parsed.localNumber.substring(0, 3)}-${parsed.localNumber.substring(3)}`;
            }
            return parsed.nationalNumber;
        case 'international':
        default:
            if (parsed.countryCode === '1') {
                return `+1 (${parsed.areaCode}) ${parsed.localNumber.substring(0, 3)}-${parsed.localNumber.substring(3)}`;
            }
            return `+${parsed.countryCode} ${parsed.nationalNumber}`;
    }
}
/**
 * Validate phone number format
 */
function isValidPhoneNumber(phoneNumber) {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
}
/**
 * Get country code from phone number
 */
function getCountryCode(phoneNumber) {
    const parsed = parsePhoneNumber(phoneNumber);
    return parsed.isValid ? parsed.countryCode : null;
}
/**
 * Generate a random phone number for testing
 */
function generateRandomPhoneNumber(countryCode = '1') {
    if (countryCode === '1') {
        // US/Canada format
        const areaCode = Math.floor(Math.random() * 800) + 200; // 200-999
        const exchange = Math.floor(Math.random() * 800) + 200; // 200-999
        const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `+1${areaCode}${exchange}${number}`;
    }
    // Generic format for other countries
    const length = Math.floor(Math.random() * 5) + 7; // 7-11 digits
    const nationalNumber = Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
    return `+${countryCode}${nationalNumber}`;
}
