import {
  parsePhoneNumber,
  formatPhoneNumber,
  isValidPhoneNumber,
  getCountryCode,
  generateRandomPhoneNumber,
} from '../phone-number';

describe('Phone Number Utilities', () => {
  describe('parsePhoneNumber', () => {
    it('should parse US phone number correctly', () => {
      const result = parsePhoneNumber('+12345678901');
      expect(result).toEqual({
        countryCode: '1',
        nationalNumber: '2345678901',
        areaCode: '234',
        localNumber: '5678901',
        isValid: true,
      });
    });

    it('should parse UK phone number correctly', () => {
      const result = parsePhoneNumber('+441234567890');
      expect(result).toEqual({
        countryCode: '44',
        nationalNumber: '1234567890',
        areaCode: '123',
        localNumber: '4567890',
        isValid: true,
      });
    });

    it('should handle invalid phone numbers', () => {
      const result = parsePhoneNumber('invalid');
      expect(result.isValid).toBe(false);
    });

    it('should handle phone numbers without + prefix', () => {
      const result = parsePhoneNumber('12345678901');
      expect(result.isValid).toBe(false);
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format US number internationally', () => {
      const formatted = formatPhoneNumber('+12345678901', 'international');
      expect(formatted).toBe('+1 (234) 567-8901');
    });

    it('should format US number nationally', () => {
      const formatted = formatPhoneNumber('+12345678901', 'national');
      expect(formatted).toBe('(234) 567-8901');
    });

    it('should format number in E.164', () => {
      const formatted = formatPhoneNumber('+12345678901', 'e164');
      expect(formatted).toBe('+12345678901');
    });

    it('should handle invalid numbers gracefully', () => {
      const formatted = formatPhoneNumber('invalid');
      expect(formatted).toBe('invalid');
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should validate correct E.164 format', () => {
      expect(isValidPhoneNumber('+12345678901')).toBe(true);
      expect(isValidPhoneNumber('+441234567890')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidPhoneNumber('12345678901')).toBe(false); // No +
      expect(isValidPhoneNumber('+0123456789')).toBe(false); // Starts with 0
      expect(isValidPhoneNumber('+1234567890123456')).toBe(false); // Too long
      expect(isValidPhoneNumber('+1')).toBe(false); // Too short
    });
  });

  describe('getCountryCode', () => {
    it('should extract country code correctly', () => {
      expect(getCountryCode('+12345678901')).toBe('1');
      expect(getCountryCode('+441234567890')).toBe('44');
    });

    it('should return null for invalid numbers', () => {
      expect(getCountryCode('invalid')).toBe(null);
    });
  });

  describe('generateRandomPhoneNumber', () => {
    it('should generate valid US phone number', () => {
      const phoneNumber = generateRandomPhoneNumber('1');
      expect(isValidPhoneNumber(phoneNumber)).toBe(true);
      expect(phoneNumber).toMatch(/^\+1\d{10}$/);
    });

    it('should generate valid phone number for other countries', () => {
      const phoneNumber = generateRandomPhoneNumber('44');
      expect(isValidPhoneNumber(phoneNumber)).toBe(true);
      expect(phoneNumber.startsWith('+44')).toBe(true);
    });

    it('should default to US format', () => {
      const phoneNumber = generateRandomPhoneNumber();
      expect(phoneNumber.startsWith('+1')).toBe(true);
    });
  });
});