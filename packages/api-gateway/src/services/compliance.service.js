"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceService = void 0;
const logger_1 = require("../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
class ComplianceService {
    constructor(redisService) {
        this.redisService = redisService;
    }
    /**
     * Request call recording consent
     */
    async requestCallRecordingConsent(callId, participantNumber, method = 'verbal') {
        try {
            const consentId = crypto_1.default.randomUUID();
            const consentRequest = {
                id: consentId,
                callId,
                participantNumber,
                method,
                requestedAt: new Date(),
                status: 'pending',
            };
            // Store consent request in Redis with 5-minute expiration
            await this.redisService.setex(`consent_request:${consentId}`, 300, // 5 minutes
            JSON.stringify(consentRequest));
            logger_1.logger.info(`Call recording consent requested: ${consentId} for call ${callId}`);
            return consentId;
        }
        catch (error) {
            logger_1.logger.error('Failed to request call recording consent:', error);
            throw error;
        }
    }
    /**
     * Record call recording consent
     */
    async recordCallRecordingConsent(callId, participantId, participantNumber, consentGiven, method, metadata = {}) {
        try {
            const retentionPolicy = await this.getDataRetentionPolicy('call_recordings');
            const retentionPeriod = retentionPolicy?.retentionPeriod || 365; // Default 1 year
            const consent = {
                id: crypto_1.default.randomUUID(),
                callId,
                participantId,
                participantNumber,
                consentGiven,
                consentMethod: method,
                consentTimestamp: new Date(),
                retentionPeriod,
                autoDeleteAt: new Date(Date.now() + retentionPeriod * 24 * 60 * 60 * 1000),
                metadata,
            };
            // Store consent record
            await this.storeCallRecordingConsent(consent);
            // Cache for quick access during call
            await this.redisService.setex(`call_consent:${callId}:${participantId}`, 24 * 60 * 60, // 24 hours
            JSON.stringify(consent));
            logger_1.logger.info(`Call recording consent recorded: ${consent.id} - ${consentGiven ? 'GRANTED' : 'DENIED'}`);
            return consent;
        }
        catch (error) {
            logger_1.logger.error('Failed to record call recording consent:', error);
            throw error;
        }
    }
    /**
     * Check if call recording is allowed
     */
    async isCallRecordingAllowed(callId, participantId) {
        try {
            if (participantId) {
                // Check specific participant consent
                const cached = await this.redisService.get(`call_consent:${callId}:${participantId}`);
                if (cached) {
                    const consent = JSON.parse(cached);
                    return consent.consentGiven;
                }
            }
            // Check all participants for this call
            const consents = await this.getCallRecordingConsents(callId);
            // Recording is allowed only if ALL participants have given consent
            return consents.length > 0 && consents.every(consent => consent.consentGiven);
        }
        catch (error) {
            logger_1.logger.error('Failed to check call recording permission:', error);
            return false; // Default to not allowed on error
        }
    }
    /**
     * Start call recording with consent validation
     */
    async startCallRecording(callId) {
        try {
            const allowed = await this.isCallRecordingAllowed(callId);
            if (allowed) {
                // Update consent records with recording start time
                await this.updateCallRecordingStart(callId);
                logger_1.logger.info(`Call recording started for call: ${callId}`);
                return { allowed: true };
            }
            else {
                const reason = 'Consent not obtained from all participants';
                logger_1.logger.warn(`Call recording denied for call ${callId}: ${reason}`);
                return { allowed: false, reason };
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to start call recording:', error);
            return { allowed: false, reason: 'System error' };
        }
    }
    /**
     * End call recording
     */
    async endCallRecording(callId) {
        try {
            await this.updateCallRecordingEnd(callId);
            logger_1.logger.info(`Call recording ended for call: ${callId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to end call recording:', error);
        }
    }
    /**
     * Create compliance policy
     */
    async createCompliancePolicy(name, type, rules, organizationId) {
        try {
            const policy = {
                id: crypto_1.default.randomUUID(),
                name,
                type,
                rules,
                organizationId,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            await this.storeCompliancePolicy(policy);
            // Cache active policies
            await this.cacheActivePolicy(policy);
            logger_1.logger.info(`Compliance policy created: ${policy.id} - ${name}`);
            return policy;
        }
        catch (error) {
            logger_1.logger.error('Failed to create compliance policy:', error);
            throw error;
        }
    }
    /**
     * Apply compliance policies to data
     */
    async applyCompliancePolicies(resourceType, data, organizationId) {
        try {
            const policies = await this.getActiveCompliancePolicies(organizationId);
            const relevantPolicies = policies.filter(p => p.rules.some(rule => rule.condition.includes(resourceType)));
            const actions = [];
            const violations = [];
            let compliant = true;
            for (const policy of relevantPolicies) {
                for (const rule of policy.rules) {
                    const ruleResult = await this.evaluateComplianceRule(rule, data);
                    if (ruleResult.violated) {
                        compliant = false;
                        violations.push(`${policy.name}: ${ruleResult.message}`);
                    }
                    if (ruleResult.action) {
                        actions.push(ruleResult.action);
                    }
                }
            }
            return { compliant, actions, violations };
        }
        catch (error) {
            logger_1.logger.error('Failed to apply compliance policies:', error);
            return { compliant: false, actions: [], violations: ['System error'] };
        }
    }
    /**
     * Schedule data retention cleanup
     */
    async scheduleDataRetentionCleanup() {
        try {
            const policies = await this.getAllDataRetentionPolicies();
            for (const policy of policies) {
                const expiredData = await this.findExpiredData(policy);
                for (const item of expiredData) {
                    if (policy.archiveBeforeDelete && policy.archiveLocation) {
                        await this.archiveData(item, policy.archiveLocation);
                    }
                    if (policy.autoDelete) {
                        await this.deleteExpiredData(item, policy);
                    }
                }
            }
            logger_1.logger.info('Data retention cleanup completed');
        }
        catch (error) {
            logger_1.logger.error('Failed to schedule data retention cleanup:', error);
        }
    }
    /**
     * Generate compliance report
     */
    async generateComplianceReport(organizationId, startDate, endDate) {
        try {
            const [callRecordingCompliance, dataRetentionCompliance, accessControlCompliance, violations] = await Promise.all([
                this.getCallRecordingComplianceStats(organizationId, startDate, endDate),
                this.getDataRetentionComplianceStats(organizationId, startDate, endDate),
                this.getAccessControlComplianceStats(organizationId, startDate, endDate),
                this.getComplianceViolations(organizationId, startDate, endDate)
            ]);
            return {
                callRecordingCompliance,
                dataRetentionCompliance,
                accessControlCompliance,
                violations,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate compliance report:', error);
            throw error;
        }
    }
    /**
     * Validate GDPR compliance for data processing
     */
    async validateGDPRCompliance(dataType, processingPurpose, dataSubjectConsent, organizationId) {
        try {
            const requirements = [];
            const warnings = [];
            let compliant = true;
            // Check consent requirement
            if (!dataSubjectConsent && this.requiresConsentForProcessing(dataType, processingPurpose)) {
                compliant = false;
                requirements.push('Data subject consent required for processing');
            }
            // Check data minimization
            if (!this.isDataMinimized(dataType, processingPurpose)) {
                warnings.push('Consider data minimization principles');
            }
            // Check retention period
            const retentionPolicy = await this.getDataRetentionPolicy(dataType);
            if (!retentionPolicy) {
                warnings.push('No data retention policy defined');
            }
            // Check lawful basis
            const lawfulBasis = await this.getLawfulBasisForProcessing(dataType, processingPurpose);
            if (!lawfulBasis) {
                compliant = false;
                requirements.push('Lawful basis for processing must be established');
            }
            return { compliant, requirements, warnings };
        }
        catch (error) {
            logger_1.logger.error('Failed to validate GDPR compliance:', error);
            return {
                compliant: false,
                requirements: ['System error - manual review required'],
                warnings: []
            };
        }
    }
    // Private helper methods
    async getCallRecordingConsents(callId) {
        // This would query the database for all consents for this call
        return [];
    }
    async updateCallRecordingStart(callId) {
        // This would update the consent records with recording start time
        logger_1.logger.debug(`Updated recording start time for call: ${callId}`);
    }
    async updateCallRecordingEnd(callId) {
        // This would update the consent records with recording end time
        logger_1.logger.debug(`Updated recording end time for call: ${callId}`);
    }
    async getDataRetentionPolicy(resourceType) {
        // This would query the database for the retention policy
        return null;
    }
    async getActiveCompliancePolicies(organizationId) {
        // This would query the database for active compliance policies
        return [];
    }
    async evaluateComplianceRule(rule, data) {
        // This would evaluate the compliance rule against the data
        return { violated: false };
    }
    requiresConsentForProcessing(dataType, purpose) {
        // Define data types and purposes that require explicit consent
        const consentRequired = [
            'personal_data',
            'sensitive_data',
            'biometric_data',
            'call_recordings',
        ];
        return consentRequired.includes(dataType);
    }
    isDataMinimized(dataType, purpose) {
        // Check if data collection is minimized for the purpose
        return true; // Simplified implementation
    }
    async getLawfulBasisForProcessing(dataType, purpose) {
        // Return the lawful basis for processing this type of data
        return 'legitimate_interest'; // Simplified implementation
    }
    // Mock database operations
    async storeCallRecordingConsent(consent) {
        logger_1.logger.debug(`Storing call recording consent: ${consent.id}`);
    }
    async storeCompliancePolicy(policy) {
        logger_1.logger.debug(`Storing compliance policy: ${policy.id}`);
    }
    async cacheActivePolicy(policy) {
        await this.redisService.sadd(`active_policies:${policy.organizationId}`, policy.id);
    }
    async getAllDataRetentionPolicies() {
        return [];
    }
    async findExpiredData(policy) {
        return [];
    }
    async archiveData(data, location) {
        logger_1.logger.debug(`Archiving data to: ${location}`);
    }
    async deleteExpiredData(data, policy) {
        logger_1.logger.debug(`Deleting expired data for policy: ${policy.id}`);
    }
    async getCallRecordingComplianceStats(organizationId, startDate, endDate) {
        return { totalCalls: 0, recordedCalls: 0, consentRate: 0 };
    }
    async getDataRetentionComplianceStats(organizationId, startDate, endDate) {
        return { totalRecords: 0, expiredRecords: 0, deletedRecords: 0 };
    }
    async getAccessControlComplianceStats(organizationId, startDate, endDate) {
        return { totalAccess: 0, authorizedAccess: 0, violations: 0 };
    }
    async getComplianceViolations(organizationId, startDate, endDate) {
        return [];
    }
}
exports.ComplianceService = ComplianceService;
