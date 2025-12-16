"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const base_provider_service_1 = require("./base-provider.service");
const logger_1 = require("../../utils/logger");
class TwilioProvider extends base_provider_service_1.BaseTelecomProvider {
    constructor(provider) {
        super(provider);
        this.client = axios_1.default.create({
            baseURL: 'https://api.twilio.com/2010-04-01',
            timeout: this.provider.config.timeout,
            auth: {
                username: this.provider.config.authentication.credentials.accountSid,
                password: this.provider.config.authentication.credentials.authToken,
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
    }
    async searchNumbers(request) {
        this.validateRequest(request, ['countryCode']);
        const startTime = Date.now();
        const searchId = `twilio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            // Build Twilio API parameters
            const params = {
                IsoCountry: request.countryCode,
            };
            if (request.areaCode) {
                params.AreaCode = request.areaCode;
            }
            if (request.city) {
                params.InLocality = request.city;
            }
            if (request.region) {
                params.InRegion = request.region;
            }
            if (request.pattern) {
                params.Contains = request.pattern.replace(/\*/g, '');
            }
            if (request.features?.includes('sms')) {
                params.SmsEnabled = true;
            }
            if (request.features?.includes('voice')) {
                params.VoiceEnabled = true;
            }
            if (request.features?.includes('mms')) {
                params.MmsEnabled = true;
            }
            // Twilio uses PageSize instead of limit
            params.PageSize = Math.min(request.limit || 20, 1000);
            const response = await this.client.get('/Accounts/{AccountSid}/AvailablePhoneNumbers/{IsoCountry}/Local.json'
                .replace('{AccountSid}', this.provider.config.authentication.credentials.accountSid)
                .replace('{IsoCountry}', request.countryCode), { params });
            const numbers = response.data.available_phone_numbers.map((twilioNumber) => ({
                phoneNumber: twilioNumber.phone_number,
                countryCode: request.countryCode,
                areaCode: this.extractAreaCode(twilioNumber.phone_number),
                city: twilioNumber.locality || request.city || 'Unknown',
                region: twilioNumber.region || request.region || 'Unknown',
                monthlyRate: this.calculateMonthlyRate(request.countryCode),
                setupFee: this.calculateSetupFee(request.countryCode),
                features: this.mapTwilioFeatures(twilioNumber),
                provider: this.provider.id,
                providerId: twilioNumber.phone_number,
                metadata: {
                    friendlyName: twilioNumber.friendly_name,
                    lata: twilioNumber.lata,
                    rateCenter: twilioNumber.rate_center,
                    latitude: twilioNumber.latitude,
                    longitude: twilioNumber.longitude,
                    postalCode: twilioNumber.postal_code,
                },
            }));
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
            logger_1.logger.error('Twilio number search failed', { error, request });
            throw error;
        }
    }
    async reserveNumber(request) {
        // Twilio doesn't have a separate reservation step, numbers are purchased directly
        // We'll simulate a reservation by storing it temporarily
        const reservationId = `twilio_res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + request.reservationDuration * 60 * 1000);
        return {
            reservationId,
            phoneNumber: request.phoneNumber,
            provider: this.provider.id,
            expiresAt,
            status: 'reserved',
        };
    }
    async purchaseNumber(request) {
        this.validateRequest(request, ['phoneNumber', 'customerInfo']);
        try {
            const params = new URLSearchParams({
                PhoneNumber: request.phoneNumber,
                FriendlyName: `${request.customerInfo.businessName || request.customerInfo.name} - ${request.phoneNumber}`,
            });
            // Add optional parameters
            if (request.customerInfo.address) {
                params.append('AddressSid', await this.createOrGetAddress(request.customerInfo.address));
            }
            const response = await this.client.post(`/Accounts/${this.provider.config.authentication.credentials.accountSid}/IncomingPhoneNumbers.json`, params);
            const purchaseId = response.data.sid;
            return {
                purchaseId,
                phoneNumber: request.phoneNumber,
                provider: this.provider.id,
                status: 'purchased',
                activationDate: new Date(),
                monthlyRate: this.calculateMonthlyRate(this.extractCountryCode(request.phoneNumber)),
                setupFee: this.calculateSetupFee(this.extractCountryCode(request.phoneNumber)),
                features: this.mapTwilioFeatures(response.data),
            };
        }
        catch (error) {
            logger_1.logger.error('Twilio number purchase failed', { error, request });
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
    async portNumber(request) {
        // Twilio porting is handled through their console/support, not API
        // This would typically involve creating a support ticket
        const portingId = `twilio_port_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            // In a real implementation, this might create a support ticket or use a porting API
            logger_1.logger.info('Twilio porting request submitted', { request, portingId });
            return {
                portingId,
                phoneNumber: request.phoneNumber,
                status: 'submitted',
                estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            };
        }
        catch (error) {
            logger_1.logger.error('Twilio porting request failed', { error, request });
            return {
                portingId,
                phoneNumber: request.phoneNumber,
                status: 'rejected',
                rejectionReason: 'Failed to submit porting request',
            };
        }
    }
    async checkNumberAvailability(phoneNumber) {
        try {
            const countryCode = this.extractCountryCode(phoneNumber);
            const response = await this.searchNumbers({
                countryCode,
                pattern: phoneNumber.replace(/\D/g, '').slice(-4), // Last 4 digits
                limit: 50,
            });
            return response.numbers.some(num => num.phoneNumber === phoneNumber);
        }
        catch (error) {
            logger_1.logger.error('Twilio availability check failed', { error, phoneNumber });
            return false;
        }
    }
    async releaseReservation(reservationId) {
        // Since Twilio doesn't have reservations, we just return true
        logger_1.logger.info('Twilio reservation released (simulated)', { reservationId });
        return true;
    }
    async performHealthCheck() {
        try {
            const response = await this.client.get(`/Accounts/${this.provider.config.authentication.credentials.accountSid}.json`);
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
    extractAreaCode(phoneNumber) {
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length >= 10) {
            return digits.slice(-10, -7); // Extract area code from 10-digit number
        }
        return '';
    }
    extractCountryCode(phoneNumber) {
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.startsWith('1') && digits.length === 11) {
            return 'US';
        }
        // Add more country code mappings as needed
        return 'US';
    }
    calculateMonthlyRate(countryCode) {
        // Twilio pricing in cents
        const pricing = {
            'US': 100, // $1.00/month
            'CA': 100, // $1.00/month
            'GB': 150, // $1.50/month
            'AU': 200, // $2.00/month
        };
        return pricing[countryCode] || 100;
    }
    calculateSetupFee(countryCode) {
        // Most Twilio numbers don't have setup fees
        return 0;
    }
    mapTwilioFeatures(twilioNumber) {
        const features = [];
        if (twilioNumber.capabilities?.voice)
            features.push('voice');
        if (twilioNumber.capabilities?.sms)
            features.push('sms');
        if (twilioNumber.capabilities?.mms)
            features.push('mms');
        if (twilioNumber.capabilities?.fax)
            features.push('fax');
        // Twilio numbers typically support these features
        features.push('call_forwarding', 'voicemail', 'analytics');
        return features;
    }
    async createOrGetAddress(address) {
        try {
            // Check if address already exists or create new one
            const params = new URLSearchParams({
                CustomerName: address.name || 'Customer',
                Street: address.street,
                City: address.city,
                Region: address.state,
                PostalCode: address.postalCode,
                IsoCountry: address.country,
            });
            const response = await this.client.post(`/Accounts/${this.provider.config.authentication.credentials.accountSid}/Addresses.json`, params);
            return response.data.sid;
        }
        catch (error) {
            logger_1.logger.error('Failed to create Twilio address', { error, address });
            throw error;
        }
    }
}
exports.TwilioProvider = TwilioProvider;
