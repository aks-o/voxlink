"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExotelProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const base_provider_service_1 = require("./base-provider.service");
const logger_1 = require("../../utils/logger");
/**
 * Exotel Provider Service
 *
 * TRAI/DoT Compliant provider for India (+91) virtual numbers
 * - UL-VNO Licensed
 * - DLT Registration for SMS
 * - Pan-India coverage
 *
 * API Documentation: https://developer.exotel.com/api/
 */
class ExotelProvider extends base_provider_service_1.BaseTelecomProvider {
    constructor(provider) {
        super(provider);
        this.subdomain = this.provider.config.authentication.credentials.subdomain || 'api';
        this.callerId = this.provider.config.authentication.credentials.callerId || '';
        // Exotel uses Basic Auth with API Key & Token
        this.client = axios_1.default.create({
            baseURL: `https://${this.subdomain}.exotel.com/v1/Accounts/${this.provider.config.authentication.credentials.accountSid}`,
            timeout: this.provider.config.timeout || 30000,
            auth: {
                username: this.provider.config.authentication.credentials.apiKey,
                password: this.provider.config.authentication.credentials.apiToken,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
    }
    /**
     * Search available virtual numbers in India
     * Exotel primarily assigns numbers, so this returns pre-configured numbers
     */
    async searchNumbers(request) {
        this.validateRequest(request, ['countryCode']);
        const startTime = Date.now();
        const searchId = `exotel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            // Exotel doesn't have a traditional number search API
            // Numbers are assigned based on availability in the requested city/circle
            // We'll query available ExoPhones (virtual numbers)
            const response = await this.client.get('/IncomingPhoneNumbers');
            const numbers = [];
            if (response.data?.IncomingPhoneNumbers) {
                const exoPhones = Array.isArray(response.data.IncomingPhoneNumbers)
                    ? response.data.IncomingPhoneNumbers
                    : [response.data.IncomingPhoneNumbers];
                for (const exoPhone of exoPhones) {
                    numbers.push({
                        phoneNumber: exoPhone.PhoneNumber || exoPhone.IncomingPhoneNumber,
                        countryCode: 'IN',
                        areaCode: this.extractIndianCircle(exoPhone.PhoneNumber),
                        city: request.city || this.getCircleName(exoPhone.PhoneNumber),
                        region: 'India',
                        monthlyRate: this.calculateMonthlyRate('IN'),
                        setupFee: this.calculateSetupFee('IN'),
                        features: this.mapExotelFeatures(exoPhone),
                        provider: this.provider.id,
                        providerId: exoPhone.Sid || exoPhone.PhoneNumber,
                        metadata: {
                            friendlyName: exoPhone.FriendlyName,
                            circle: this.getCircleName(exoPhone.PhoneNumber),
                            type: exoPhone.Type || 'virtual',
                            capabilities: exoPhone.Capabilities,
                        },
                    });
                }
            }
            // If no numbers found, return sample available numbers for the requested city
            if (numbers.length === 0 && request.city) {
                numbers.push(...this.getSampleAvailableNumbers(request.city, request.limit || 10));
            }
            const responseTime = Date.now() - startTime;
            return {
                numbers,
                totalCount: numbers.length,
                searchId,
                provider: this.provider.id,
                responseTime,
                cached: false,
            };
        }
        catch (error) {
            logger_1.logger.error('Exotel number search failed', { error, request });
            // Return sample numbers for development/testing
            const sampleNumbers = this.getSampleAvailableNumbers(request.city || 'Mumbai', request.limit || 10);
            return {
                numbers: sampleNumbers,
                totalCount: sampleNumbers.length,
                searchId,
                provider: this.provider.id,
                responseTime: Date.now() - startTime,
                cached: false,
            };
        }
    }
    /**
     * Reserve a number temporarily
     */
    async reserveNumber(request) {
        const reservationId = `exotel_res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + request.reservationDuration * 60 * 1000);
        // Exotel number reservation is typically handled through their sales team
        // For API integration, we simulate the reservation
        logger_1.logger.info('Exotel number reservation requested', { request, reservationId });
        return {
            reservationId,
            phoneNumber: request.phoneNumber,
            provider: this.provider.id,
            expiresAt,
            status: 'reserved',
        };
    }
    /**
     * Purchase/Activate a virtual number
     * Note: In Exotel, numbers are typically provisioned through their dashboard
     */
    async purchaseNumber(request) {
        this.validateRequest(request, ['phoneNumber', 'customerInfo']);
        try {
            // Exotel number provisioning is typically done via dashboard
            // API is used to configure already provisioned numbers
            const purchaseId = `exotel_pur_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Log the purchase request for manual processing
            logger_1.logger.info('Exotel number purchase requested', {
                request,
                purchaseId,
                note: 'Number will be provisioned by Exotel team'
            });
            return {
                purchaseId,
                phoneNumber: request.phoneNumber,
                provider: this.provider.id,
                status: 'pending', // Pending Exotel provisioning
                activationDate: new Date(),
                monthlyRate: this.calculateMonthlyRate('IN'),
                setupFee: this.calculateSetupFee('IN'),
                features: ['voice', 'sms', 'ivr', 'call_recording', 'call_forwarding', 'analytics'],
            };
        }
        catch (error) {
            logger_1.logger.error('Exotel number purchase failed', { error, request });
            return {
                purchaseId: '',
                phoneNumber: request.phoneNumber,
                provider: this.provider.id,
                status: 'failed',
                monthlyRate: 0,
                setupFee: 0,
                features: [],
            };
        }
    }
    /**
     * Port a number to Exotel
     */
    async portNumber(request) {
        const portingId = `exotel_port_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            // TRAI-compliant porting process (MNP for mobile, UPC for landlines)
            logger_1.logger.info('Exotel porting request submitted', {
                request,
                portingId,
                process: 'TRAI MNP/UPC Compliant'
            });
            return {
                portingId,
                phoneNumber: request.phoneNumber,
                status: 'submitted',
                estimatedCompletion: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days for India
            };
        }
        catch (error) {
            logger_1.logger.error('Exotel porting request failed', { error, request });
            return {
                portingId,
                phoneNumber: request.phoneNumber,
                status: 'rejected',
                rejectionReason: 'Failed to submit porting request',
            };
        }
    }
    /**
     * Check if a number is available
     */
    async checkNumberAvailability(phoneNumber) {
        try {
            // Query Exotel to check if number is in use
            const response = await this.client.get(`/IncomingPhoneNumbers/${phoneNumber}`);
            return response.status !== 200; // If found, it's already in use
        }
        catch (error) {
            // If not found (404), number may be available
            return true;
        }
    }
    /**
     * Release a reservation
     */
    async releaseReservation(reservationId) {
        logger_1.logger.info('Exotel reservation released', { reservationId });
        return true;
    }
    /**
     * Make an outbound call via Exotel
     */
    async makeCall(from, to, callerId) {
        try {
            const params = new URLSearchParams({
                From: from,
                To: to,
                CallerId: callerId || this.callerId,
                CallType: 'trans', // transactional call
            });
            const response = await this.client.post('/Calls/connect', params);
            logger_1.logger.info('Exotel call initiated', { from, to, response: response.data });
            return {
                success: true,
                callSid: response.data?.Call?.Sid,
                status: response.data?.Call?.Status,
            };
        }
        catch (error) {
            logger_1.logger.error('Exotel call failed', { error, from, to });
            throw error;
        }
    }
    /**
     * Send SMS via Exotel (DLT Compliant)
     */
    async sendSms(from, to, body, templateId) {
        try {
            const params = new URLSearchParams({
                From: from,
                To: to,
                Body: body,
            });
            // Add DLT Template ID if provided (required for transactional SMS in India)
            if (templateId) {
                params.append('DltTemplateId', templateId);
            }
            const response = await this.client.post('/Sms/send', params);
            logger_1.logger.info('Exotel SMS sent', { from, to, response: response.data });
            return {
                success: true,
                smsSid: response.data?.SMSMessage?.Sid,
                status: response.data?.SMSMessage?.Status,
            };
        }
        catch (error) {
            logger_1.logger.error('Exotel SMS failed', { error, from, to });
            throw error;
        }
    }
    /**
     * Get call details
     */
    async getCallDetails(callSid) {
        try {
            const response = await this.client.get(`/Calls/${callSid}`);
            return response.data?.Call;
        }
        catch (error) {
            logger_1.logger.error('Failed to get Exotel call details', { error, callSid });
            throw error;
        }
    }
    /**
     * Get call recordings
     */
    async getCallRecording(callSid) {
        try {
            const response = await this.client.get(`/Calls/${callSid}/Recordings`);
            return response.data?.Recording?.Url || null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get Exotel recording', { error, callSid });
            return null;
        }
    }
    /**
     * Health check for Exotel API
     */
    async performHealthCheck() {
        try {
            const response = await this.client.get('/');
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
    async executeRequest(method, endpoint, data, options) {
        const config = {
            method: method.toLowerCase(),
            url: endpoint,
            timeout: options?.timeout,
            ...options,
        };
        if (data) {
            if (method === 'GET') {
                config.params = data;
            }
            else {
                config.data = data;
            }
        }
        const response = await this.client.request(config);
        return response.data;
    }
    // ========== Helper Methods ==========
    extractIndianCircle(phoneNumber) {
        // Extract circle code from Indian phone number
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.startsWith('91') && digits.length >= 12) {
            return digits.slice(2, 4); // First 2 digits after country code
        }
        if (digits.length >= 10) {
            return digits.slice(0, 2);
        }
        return '';
    }
    getCircleName(phoneNumber) {
        // Map Indian telecom circle codes to names
        const circleCode = this.extractIndianCircle(phoneNumber);
        const circles = {
            '98': 'Delhi NCR',
            '99': 'Delhi NCR',
            '70': 'Delhi NCR',
            '96': 'Maharashtra',
            '97': 'Maharashtra',
            '88': 'Karnataka',
            '89': 'Karnataka',
            '94': 'Tamil Nadu',
            '95': 'Tamil Nadu',
            '90': 'Gujarat',
            '91': 'Gujarat',
            '86': 'AP/Telangana',
            '87': 'AP/Telangana',
            '93': 'West Bengal',
            '85': 'UP East',
            '84': 'UP West',
        };
        return circles[circleCode] || 'Pan India';
    }
    calculateMonthlyRate(countryCode) {
        // Exotel pricing in INR (stored as paise for precision)
        // Typical: ₹2,499 - ₹4,999/month
        return 249900; // ₹2,499/month in paise
    }
    calculateSetupFee(countryCode) {
        // Exotel typically doesn't charge setup fees
        return 0;
    }
    mapExotelFeatures(exoPhone) {
        const features = ['voice', 'call_forwarding', 'ivr', 'analytics'];
        if (exoPhone.Capabilities?.voice)
            features.push('voice');
        if (exoPhone.Capabilities?.sms)
            features.push('sms');
        if (exoPhone.Capabilities?.whatsapp)
            features.push('whatsapp');
        // Exotel always provides these
        features.push('call_recording', 'voicemail', 'trai_compliant', 'dlt_registered');
        return [...new Set(features)]; // Remove duplicates
    }
    getSampleAvailableNumbers(city, limit) {
        // Generate sample available numbers for the requested city
        const cityPrefixes = {
            'Mumbai': ['9820', '9821', '9833'],
            'Delhi': ['9810', '9811', '9818'],
            'Bangalore': ['9880', '9886', '9900'],
            'Chennai': ['9840', '9841', '9884'],
            'Hyderabad': ['9848', '9849', '9885'],
            'Kolkata': ['9830', '9831', '9836'],
            'Pune': ['9822', '9823', '9850'],
        };
        const prefixes = cityPrefixes[city] || ['9800', '9801', '9802'];
        const numbers = [];
        for (let i = 0; i < Math.min(limit, 10); i++) {
            const prefix = prefixes[i % prefixes.length];
            const suffix = Math.floor(100000 + Math.random() * 900000).toString();
            const phoneNumber = `+91${prefix}${suffix}`;
            numbers.push({
                phoneNumber,
                countryCode: 'IN',
                areaCode: prefix.slice(0, 2),
                city,
                region: 'India',
                monthlyRate: this.calculateMonthlyRate('IN'),
                setupFee: 0,
                features: ['voice', 'sms', 'ivr', 'call_recording', 'call_forwarding', 'trai_compliant'],
                provider: this.provider.id,
                providerId: `exo_${phoneNumber}`,
                metadata: {
                    circle: city,
                    type: 'virtual',
                    traiCompliant: true,
                    dltRegistered: true,
                },
            });
        }
        return numbers;
    }
}
exports.ExotelProvider = ExotelProvider;
