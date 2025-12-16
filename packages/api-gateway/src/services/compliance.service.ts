import { RedisService } from './redis.service';
import { logger } from '../utils/logger';
import {
  CallRecordingConsent,
  CompliancePolicy,
  DataRetentionPolicy,
  ComplianceRule
} from '@voxlink/shared';
import crypto from 'crypto';

export class ComplianceService {
  constructor(private redisService: RedisService) { }

  /**
   * Request call recording consent
   */
  async requestCallRecordingConsent(
    callId: string,
    participantNumber: string,
    method: 'verbal' | 'dtmf' | 'web' | 'api' = 'verbal'
  ): Promise<string> {
    try {
      const consentId = crypto.randomUUID();
      const consentRequest = {
        id: consentId,
        callId,
        participantNumber,
        method,
        requestedAt: new Date(),
        status: 'pending',
      };

      // Store consent request in Redis with 5-minute expiration
      await this.redisService.setex(
        `consent_request:${consentId}`,
        300, // 5 minutes
        JSON.stringify(consentRequest)
      );

      logger.info(`Call recording consent requested: ${consentId} for call ${callId}`);
      return consentId;
    } catch (error) {
      logger.error('Failed to request call recording consent:', error as any);
      throw error;
    }
  }

  /**
   * Record call recording consent
   */
  async recordCallRecordingConsent(
    callId: string,
    participantId: string,
    participantNumber: string,
    consentGiven: boolean,
    method: 'verbal' | 'dtmf' | 'web' | 'api',
    metadata: Record<string, any> = {}
  ): Promise<CallRecordingConsent> {
    try {
      const retentionPolicy = await this.getDataRetentionPolicy('call_recordings');
      const retentionPeriod = retentionPolicy?.retentionPeriod || 365; // Default 1 year

      const consent: CallRecordingConsent = {
        id: crypto.randomUUID(),
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
      await this.redisService.setex(
        `call_consent:${callId}:${participantId}`,
        24 * 60 * 60, // 24 hours
        JSON.stringify(consent)
      );

      logger.info(`Call recording consent recorded: ${consent.id} - ${consentGiven ? 'GRANTED' : 'DENIED'}`);
      return consent;
    } catch (error) {
      logger.error('Failed to record call recording consent:', error as any);
      throw error;
    }
  }

  /**
   * Check if call recording is allowed
   */
  async isCallRecordingAllowed(callId: string, participantId?: string): Promise<boolean> {
    try {
      if (participantId) {
        // Check specific participant consent
        const cached = await this.redisService.get(`call_consent:${callId}:${participantId}`);
        if (cached) {
          const consent = JSON.parse(cached) as CallRecordingConsent;
          return consent.consentGiven;
        }
      }

      // Check all participants for this call
      const consents = await this.getCallRecordingConsents(callId);

      // Recording is allowed only if ALL participants have given consent
      return consents.length > 0 && consents.every(consent => consent.consentGiven);
    } catch (error) {
      logger.error('Failed to check call recording permission:', error as any);
      return false; // Default to not allowed on error
    }
  }

  /**
   * Start call recording with consent validation
   */
  async startCallRecording(callId: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const allowed = await this.isCallRecordingAllowed(callId);

      if (allowed) {
        // Update consent records with recording start time
        await this.updateCallRecordingStart(callId);

        logger.info(`Call recording started for call: ${callId}`);
        return { allowed: true };
      } else {
        const reason = 'Consent not obtained from all participants';
        logger.warn(`Call recording denied for call ${callId}: ${reason}`);
        return { allowed: false, reason };
      }
    } catch (error) {
      logger.error('Failed to start call recording:', error as any);
      return { allowed: false, reason: 'System error' };
    }
  }

  /**
   * End call recording
   */
  async endCallRecording(callId: string): Promise<void> {
    try {
      await this.updateCallRecordingEnd(callId);
      logger.info(`Call recording ended for call: ${callId}`);
    } catch (error) {
      logger.error('Failed to end call recording:', error as any);
    }
  }

  /**
   * Create compliance policy
   */
  async createCompliancePolicy(
    name: string,
    type: 'data_retention' | 'call_recording' | 'data_encryption' | 'access_control',
    rules: ComplianceRule[],
    organizationId: string
  ): Promise<CompliancePolicy> {
    try {
      const policy: CompliancePolicy = {
        id: crypto.randomUUID(),
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

      logger.info(`Compliance policy created: ${policy.id} - ${name}`);
      return policy;
    } catch (error) {
      logger.error('Failed to create compliance policy:', error as any);
      throw error;
    }
  }

  /**
   * Apply compliance policies to data
   */
  async applyCompliancePolicies(
    resourceType: string,
    data: any,
    organizationId: string
  ): Promise<{ compliant: boolean; actions: string[]; violations: string[] }> {
    try {
      const policies = await this.getActiveCompliancePolicies(organizationId);
      const relevantPolicies = policies.filter(p =>
        p.rules.some(rule => rule.condition.includes(resourceType))
      );

      const actions: string[] = [];
      const violations: string[] = [];
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
    } catch (error) {
      logger.error('Failed to apply compliance policies:', error as any);
      return { compliant: false, actions: [], violations: ['System error'] };
    }
  }

  /**
   * Schedule data retention cleanup
   */
  async scheduleDataRetentionCleanup(): Promise<void> {
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

      logger.info('Data retention cleanup completed');
    } catch (error) {
      logger.error('Failed to schedule data retention cleanup:', error as any);
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    callRecordingCompliance: any;
    dataRetentionCompliance: any;
    accessControlCompliance: any;
    violations: any[];
  }> {
    try {
      const [
        callRecordingCompliance,
        dataRetentionCompliance,
        accessControlCompliance,
        violations
      ] = await Promise.all([
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
    } catch (error) {
      logger.error('Failed to generate compliance report:', error as any);
      throw error;
    }
  }

  /**
   * Validate GDPR compliance for data processing
   */
  async validateGDPRCompliance(
    dataType: string,
    processingPurpose: string,
    dataSubjectConsent: boolean,
    organizationId: string
  ): Promise<{ compliant: boolean; requirements: string[]; warnings: string[] }> {
    try {
      const requirements: string[] = [];
      const warnings: string[] = [];
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
    } catch (error) {
      logger.error('Failed to validate GDPR compliance:', error as any);
      return {
        compliant: false,
        requirements: ['System error - manual review required'],
        warnings: []
      };
    }
  }

  // Private helper methods
  private async getCallRecordingConsents(callId: string): Promise<CallRecordingConsent[]> {
    // This would query the database for all consents for this call
    return [];
  }

  private async updateCallRecordingStart(callId: string): Promise<void> {
    // This would update the consent records with recording start time
    logger.debug(`Updated recording start time for call: ${callId}`);
  }

  private async updateCallRecordingEnd(callId: string): Promise<void> {
    // This would update the consent records with recording end time
    logger.debug(`Updated recording end time for call: ${callId}`);
  }

  private async getDataRetentionPolicy(resourceType: string): Promise<DataRetentionPolicy | null> {
    // This would query the database for the retention policy
    return null;
  }

  private async getActiveCompliancePolicies(organizationId: string): Promise<CompliancePolicy[]> {
    // This would query the database for active compliance policies
    return [];
  }

  private async evaluateComplianceRule(rule: ComplianceRule, data: any): Promise<{
    violated: boolean;
    message?: string;
    action?: string;
  }> {
    // This would evaluate the compliance rule against the data
    return { violated: false };
  }

  private requiresConsentForProcessing(dataType: string, purpose: string): boolean {
    // Define data types and purposes that require explicit consent
    const consentRequired = [
      'personal_data',
      'sensitive_data',
      'biometric_data',
      'call_recordings',
    ];

    return consentRequired.includes(dataType);
  }

  private isDataMinimized(dataType: string, purpose: string): boolean {
    // Check if data collection is minimized for the purpose
    return true; // Simplified implementation
  }

  private async getLawfulBasisForProcessing(dataType: string, purpose: string): Promise<string | null> {
    // Return the lawful basis for processing this type of data
    return 'legitimate_interest'; // Simplified implementation
  }

  // Mock database operations
  private async storeCallRecordingConsent(consent: CallRecordingConsent): Promise<void> {
    logger.debug(`Storing call recording consent: ${consent.id}`);
  }

  private async storeCompliancePolicy(policy: CompliancePolicy): Promise<void> {
    logger.debug(`Storing compliance policy: ${policy.id}`);
  }

  private async cacheActivePolicy(policy: CompliancePolicy): Promise<void> {
    await this.redisService.sadd(`active_policies:${policy.organizationId}`, policy.id);
  }

  private async getAllDataRetentionPolicies(): Promise<DataRetentionPolicy[]> {
    return [];
  }

  private async findExpiredData(policy: DataRetentionPolicy): Promise<any[]> {
    return [];
  }

  private async archiveData(data: any, location: string): Promise<void> {
    logger.debug(`Archiving data to: ${location}`);
  }

  private async deleteExpiredData(data: any, policy: DataRetentionPolicy): Promise<void> {
    logger.debug(`Deleting expired data for policy: ${policy.id}`);
  }

  private async getCallRecordingComplianceStats(organizationId: string, startDate: Date, endDate: Date): Promise<any> {
    return { totalCalls: 0, recordedCalls: 0, consentRate: 0 };
  }

  private async getDataRetentionComplianceStats(organizationId: string, startDate: Date, endDate: Date): Promise<any> {
    return { totalRecords: 0, expiredRecords: 0, deletedRecords: 0 };
  }

  private async getAccessControlComplianceStats(organizationId: string, startDate: Date, endDate: Date): Promise<any> {
    return { totalAccess: 0, authorizedAccess: 0, violations: 0 };
  }

  private async getComplianceViolations(organizationId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return [];
  }
}
