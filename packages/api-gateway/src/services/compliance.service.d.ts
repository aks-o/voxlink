import { RedisService } from './redis.service';
import { CallRecordingConsent, CompliancePolicy, ComplianceRule } from '../../../shared/src/types/security';
export declare class ComplianceService {
    private redisService;
    constructor(redisService: RedisService);
    /**
     * Request call recording consent
     */
    requestCallRecordingConsent(callId: string, participantNumber: string, method?: 'verbal' | 'dtmf' | 'web' | 'api'): Promise<string>;
    /**
     * Record call recording consent
     */
    recordCallRecordingConsent(callId: string, participantId: string, participantNumber: string, consentGiven: boolean, method: 'verbal' | 'dtmf' | 'web' | 'api', metadata?: Record<string, any>): Promise<CallRecordingConsent>;
    /**
     * Check if call recording is allowed
     */
    isCallRecordingAllowed(callId: string, participantId?: string): Promise<boolean>;
    /**
     * Start call recording with consent validation
     */
    startCallRecording(callId: string): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    /**
     * End call recording
     */
    endCallRecording(callId: string): Promise<void>;
    /**
     * Create compliance policy
     */
    createCompliancePolicy(name: string, type: 'data_retention' | 'call_recording' | 'data_encryption' | 'access_control', rules: ComplianceRule[], organizationId: string): Promise<CompliancePolicy>;
    /**
     * Apply compliance policies to data
     */
    applyCompliancePolicies(resourceType: string, data: any, organizationId: string): Promise<{
        compliant: boolean;
        actions: string[];
        violations: string[];
    }>;
    /**
     * Schedule data retention cleanup
     */
    scheduleDataRetentionCleanup(): Promise<void>;
    /**
     * Generate compliance report
     */
    generateComplianceReport(organizationId: string, startDate: Date, endDate: Date): Promise<{
        callRecordingCompliance: any;
        dataRetentionCompliance: any;
        accessControlCompliance: any;
        violations: any[];
    }>;
    /**
     * Validate GDPR compliance for data processing
     */
    validateGDPRCompliance(dataType: string, processingPurpose: string, dataSubjectConsent: boolean, organizationId: string): Promise<{
        compliant: boolean;
        requirements: string[];
        warnings: string[];
    }>;
    private getCallRecordingConsents;
    private updateCallRecordingStart;
    private updateCallRecordingEnd;
    private getDataRetentionPolicy;
    private getActiveCompliancePolicies;
    private evaluateComplianceRule;
    private requiresConsentForProcessing;
    private isDataMinimized;
    private getLawfulBasisForProcessing;
    private storeCallRecordingConsent;
    private storeCompliancePolicy;
    private cacheActivePolicy;
    private getAllDataRetentionPolicies;
    private findExpiredData;
    private archiveData;
    private deleteExpiredData;
    private getCallRecordingComplianceStats;
    private getDataRetentionComplianceStats;
    private getAccessControlComplianceStats;
    private getComplianceViolations;
}
