"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortingService = void 0;
const logger_1 = require("../utils/logger");
class PortingService {
    constructor(portingRepo, numberRepo, configRepo) {
        this.portingRepo = portingRepo;
        this.numberRepo = numberRepo;
        this.configRepo = configRepo;
    }
    /**
     * Initiate a new porting request
     */
    async initiatePorting(data) {
        try {
            // Validate the porting request
            const validation = await this.validatePortingRequest(data);
            if (!validation.isValid) {
                throw new Error(`Porting validation failed: ${validation.errors.join(', ')}`);
            }
            // Check if there's already an active porting request for this number
            const existingRequest = await this.portingRepo.findByCurrentNumber(data.currentNumber);
            if (existingRequest && ['SUBMITTED', 'PROCESSING', 'APPROVED'].includes(existingRequest.status)) {
                throw new Error(`Active porting request already exists for number ${data.currentNumber}`);
            }
            // Get carrier information and estimate
            const carrierInfo = this.getCarrierInfo(data.currentCarrier);
            const estimate = this.calculatePortingEstimate(data.currentCarrier, data.currentNumber);
            // Create the porting request
            const portingRequest = await this.portingRepo.create({
                ...data,
                estimatedCompletion: estimate.estimatedCompletion,
            });
            // Add initial status update
            await this.portingRepo.addStatusUpdate({
                portingRequestId: portingRequest.id,
                status: 'SUBMITTED',
                message: 'Porting request submitted and under review',
                updatedBy: 'system',
            });
            logger_1.logger.info('Porting request initiated', {
                portingRequestId: portingRequest.id,
                userId: data.userId,
                currentNumber: data.currentNumber,
                currentCarrier: data.currentCarrier,
                estimatedCompletion: estimate.estimatedCompletion,
            });
            return portingRequest;
        }
        catch (error) {
            logger_1.logger.error('Failed to initiate porting request', {
                error: error instanceof Error ? error.message : 'Unknown error',
                userId: data.userId,
                currentNumber: data.currentNumber,
            });
            throw error;
        }
    }
    /**
     * Validate porting request data
     */
    async validatePortingRequest(data) {
        const errors = [];
        const warnings = [];
        // Validate phone number format
        if (!this.isValidPhoneNumber(data.currentNumber)) {
            errors.push('Invalid phone number format');
        }
        // Validate required fields
        if (!data.currentCarrier.trim()) {
            errors.push('Current carrier is required');
        }
        if (!data.accountNumber.trim()) {
            errors.push('Account number is required');
        }
        if (!data.pin.trim()) {
            errors.push('PIN/Password is required');
        }
        if (!data.authorizedName.trim()) {
            errors.push('Authorized name is required');
        }
        // Validate billing address
        const address = data.billingAddress;
        if (!address.street || !address.city || !address.state || !address.zipCode) {
            errors.push('Complete billing address is required');
        }
        // Check if number is already in our system
        const existingNumber = await this.numberRepo.findByPhoneNumber(data.currentNumber);
        if (existingNumber) {
            errors.push('This number is already in the VoxLink system');
        }
        // Carrier-specific validations
        const carrierValidation = this.validateCarrierSpecificRequirements(data);
        errors.push(...carrierValidation.errors);
        warnings.push(...carrierValidation.warnings);
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }
    /**
     * Update porting request status
     */
    async updatePortingStatus(portingRequestId, status, message, updatedBy) {
        try {
            const portingRequest = await this.portingRepo.updateStatus(portingRequestId, status, message, updatedBy);
            // Handle status-specific actions
            await this.handleStatusChange(portingRequest, status);
            logger_1.logger.info('Porting status updated', {
                portingRequestId,
                status,
                message,
                updatedBy,
            });
            return portingRequest;
        }
        catch (error) {
            logger_1.logger.error('Failed to update porting status', {
                error: error instanceof Error ? error.message : 'Unknown error',
                portingRequestId,
                status,
            });
            throw error;
        }
    }
    /**
     * Handle status change actions
     */
    async handleStatusChange(portingRequest, status) {
        switch (status) {
            case 'APPROVED':
                await this.handlePortingApproved(portingRequest);
                break;
            case 'COMPLETED':
                await this.handlePortingCompleted(portingRequest);
                break;
            case 'FAILED':
                await this.handlePortingFailed(portingRequest);
                break;
            case 'CANCELLED':
                await this.handlePortingCancelled(portingRequest);
                break;
        }
    }
    /**
     * Handle porting approved
     */
    async handlePortingApproved(portingRequest) {
        // Start the porting process with the carrier
        await this.initiateCarrierPorting(portingRequest);
        // Update status to processing
        await this.portingRepo.updateStatus(portingRequest.id, 'PROCESSING', 'Porting approved and initiated with carrier', 'system');
    }
    /**
     * Handle porting completed
     */
    async handlePortingCompleted(portingRequest) {
        try {
            // Create the virtual number in our system
            const virtualNumber = await this.numberRepo.create({
                phoneNumber: portingRequest.currentNumber,
                countryCode: this.extractCountryCode(portingRequest.currentNumber),
                areaCode: this.extractAreaCode(portingRequest.currentNumber),
                city: 'Ported Number',
                region: 'Various',
                ownerId: portingRequest.userId,
                monthlyRate: 1000, // Default rate, can be configured
                setupFee: 0, // No setup fee for ported numbers
                features: ['VOICE', 'SMS'],
            });
            // Activate the number
            await this.numberRepo.updateStatus(virtualNumber.id, 'ACTIVE');
            // Create default configuration
            await this.configRepo.createDefaultConfiguration(virtualNumber.id);
            logger_1.logger.info('Ported number activated', {
                portingRequestId: portingRequest.id,
                virtualNumberId: virtualNumber.id,
                phoneNumber: portingRequest.currentNumber,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to activate ported number', {
                error: error instanceof Error ? error.message : 'Unknown error',
                portingRequestId: portingRequest.id,
            });
            // Revert status to failed
            await this.portingRepo.updateStatus(portingRequest.id, 'FAILED', 'Failed to activate ported number in system', 'system');
        }
    }
    /**
     * Handle porting failed
     */
    async handlePortingFailed(portingRequest) {
        // Log failure for analysis
        logger_1.logger.warn('Porting request failed', {
            portingRequestId: portingRequest.id,
            currentNumber: portingRequest.currentNumber,
            currentCarrier: portingRequest.currentCarrier,
        });
        // Could trigger notification to user about failure
        // Could also trigger manual review process
    }
    /**
     * Handle porting cancelled
     */
    async handlePortingCancelled(portingRequest) {
        // Clean up any resources or processes
        logger_1.logger.info('Porting request cancelled', {
            portingRequestId: portingRequest.id,
            currentNumber: portingRequest.currentNumber,
        });
    }
    /**
     * Get porting progress for a request
     */
    async getPortingProgress(portingRequestId) {
        const portingRequest = await this.portingRepo.findByIdWithDetails(portingRequestId);
        if (!portingRequest) {
            throw new Error(`Porting request not found: ${portingRequestId}`);
        }
        const steps = this.getPortingSteps();
        const currentStepIndex = this.getCurrentStepIndex(portingRequest.status);
        return {
            currentStep: steps[currentStepIndex],
            completedSteps: steps.slice(0, currentStepIndex),
            remainingSteps: steps.slice(currentStepIndex + 1),
            estimatedCompletion: portingRequest.estimatedCompletion,
            lastUpdate: portingRequest.updatedAt,
        };
    }
    /**
     * Get carrier information
     */
    getCarrierInfo(carrierName) {
        // This would typically come from a database or external service
        const carrierDatabase = {
            'verizon': {
                name: 'Verizon',
                portingTimeEstimate: 3,
                requiredDocuments: ['BILL', 'AUTHORIZATION'],
                specialRequirements: ['Account must be in good standing'],
            },
            'att': {
                name: 'AT&T',
                portingTimeEstimate: 5,
                requiredDocuments: ['BILL', 'AUTHORIZATION'],
            },
            't-mobile': {
                name: 'T-Mobile',
                portingTimeEstimate: 2,
                requiredDocuments: ['BILL', 'AUTHORIZATION'],
            },
            'sprint': {
                name: 'Sprint',
                portingTimeEstimate: 4,
                requiredDocuments: ['BILL', 'AUTHORIZATION', 'IDENTIFICATION'],
            },
        };
        const normalizedCarrier = carrierName.toLowerCase().replace(/\s+/g, '-');
        return carrierDatabase[normalizedCarrier] || {
            name: carrierName,
            portingTimeEstimate: 7, // Default to 7 days
            requiredDocuments: ['BILL', 'AUTHORIZATION'],
        };
    }
    /**
     * Calculate porting estimate
     */
    calculatePortingEstimate(carrier, phoneNumber) {
        const carrierInfo = this.getCarrierInfo(carrier);
        const baseEstimate = carrierInfo.portingTimeEstimate;
        const factors = [];
        let adjustedDays = baseEstimate;
        // Add factors that might affect timing
        if (this.isBusinessNumber(phoneNumber)) {
            adjustedDays += 1;
            factors.push('Business number may require additional verification');
        }
        if (this.isComplexCarrier(carrier)) {
            adjustedDays += 2;
            factors.push('Carrier requires additional processing time');
        }
        const estimatedCompletion = new Date();
        estimatedCompletion.setDate(estimatedCompletion.getDate() + adjustedDays);
        return {
            estimatedDays: adjustedDays,
            estimatedCompletion,
            factors,
        };
    }
    /**
     * Validate carrier-specific requirements
     */
    validateCarrierSpecificRequirements(data) {
        const errors = [];
        const warnings = [];
        const carrierInfo = this.getCarrierInfo(data.currentCarrier);
        // Check for carrier-specific requirements
        if (carrierInfo.specialRequirements) {
            warnings.push(...carrierInfo.specialRequirements);
        }
        // Validate account number format for specific carriers
        if (data.currentCarrier.toLowerCase().includes('verizon')) {
            if (!/^\d{9,12}$/.test(data.accountNumber)) {
                errors.push('Verizon account numbers must be 9-12 digits');
            }
        }
        return { isValid: errors.length === 0, errors, warnings };
    }
    /**
     * Initiate carrier porting process (mock implementation)
     */
    async initiateCarrierPorting(portingRequest) {
        // This would integrate with actual carrier APIs
        // For now, we'll simulate the process
        logger_1.logger.info('Initiating carrier porting process', {
            portingRequestId: portingRequest.id,
            carrier: portingRequest.currentCarrier,
            phoneNumber: portingRequest.currentNumber,
        });
        // Simulate carrier API call
        // In reality, this would submit the porting request to the carrier's system
    }
    /**
     * Get porting steps
     */
    getPortingSteps() {
        return [
            'Request Submitted',
            'Documentation Review',
            'Carrier Approval',
            'Processing',
            'Completed',
        ];
    }
    /**
     * Get current step index based on status
     */
    getCurrentStepIndex(status) {
        const statusToStep = {
            'SUBMITTED': 0,
            'PROCESSING': 1,
            'APPROVED': 2,
            'COMPLETED': 4,
            'FAILED': 1, // Stay at review step
            'CANCELLED': 0,
        };
        return statusToStep[status] || 0;
    }
    /**
     * Utility methods
     */
    isValidPhoneNumber(phoneNumber) {
        // Basic E.164 format validation
        return /^\+[1-9]\d{1,14}$/.test(phoneNumber);
    }
    extractCountryCode(phoneNumber) {
        // Extract country code from E.164 format
        if (phoneNumber.startsWith('+1'))
            return 'US';
        if (phoneNumber.startsWith('+44'))
            return 'GB';
        if (phoneNumber.startsWith('+33'))
            return 'FR';
        // Add more country codes as needed
        return 'US'; // Default
    }
    extractAreaCode(phoneNumber) {
        // Extract area code for US numbers
        if (phoneNumber.startsWith('+1') && phoneNumber.length === 12) {
            return phoneNumber.substring(2, 5);
        }
        return '000'; // Default
    }
    isBusinessNumber(phoneNumber) {
        // Simple heuristic - could be enhanced with actual business number database
        return false; // Placeholder
    }
    isComplexCarrier(carrier) {
        const complexCarriers = ['sprint', 'boost', 'cricket'];
        return complexCarriers.some(c => carrier.toLowerCase().includes(c));
    }
    /**
     * Get user's porting requests
     */
    async getUserPortingRequests(userId, limit = 50, offset = 0) {
        const [requests, total] = await Promise.all([
            this.portingRepo.findByUserId(userId, limit, offset),
            this.portingRepo.countByUserId(userId),
        ]);
        return { requests, total };
    }
    /**
     * Cancel porting request
     */
    async cancelPortingRequest(portingRequestId, reason, cancelledBy) {
        const portingRequest = await this.portingRepo.findById(portingRequestId);
        if (!portingRequest) {
            throw new Error(`Porting request not found: ${portingRequestId}`);
        }
        if (!['SUBMITTED', 'PROCESSING'].includes(portingRequest.status)) {
            throw new Error(`Cannot cancel porting request in status: ${portingRequest.status}`);
        }
        return this.updatePortingStatus(portingRequestId, 'CANCELLED', `Cancelled: ${reason}`, cancelledBy);
    }
}
exports.PortingService = PortingService;
