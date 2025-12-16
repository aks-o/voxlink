import { NumberConfiguration } from '@prisma/client';
import { BaseRepository } from './base.repository';
export interface CreateConfigurationData {
    numberId: string;
    callForwardingEnabled?: boolean;
    primaryDestination?: string;
    failoverDestination?: string;
    businessHoursDestination?: string;
    afterHoursDestination?: string;
    forwardingTimeout?: number;
    voicemailEnabled?: boolean;
    customGreeting?: string;
    emailNotifications?: boolean;
    transcriptionEnabled?: boolean;
    maxVoicemailDuration?: number;
    timezone?: string;
    businessHoursSchedule?: any;
    holidays?: Date[];
    callNotifications?: boolean;
    smsNotifications?: boolean;
    webhookUrl?: string;
    notificationChannels?: string[];
}
export interface UpdateConfigurationData extends Partial<CreateConfigurationData> {
}
export declare class NumberConfigurationRepository extends BaseRepository {
    create(data: CreateConfigurationData): Promise<NumberConfiguration>;
    findByNumberId(numberId: string): Promise<NumberConfiguration | null>;
    findById(id: string): Promise<NumberConfiguration | null>;
    update(numberId: string, data: UpdateConfigurationData): Promise<NumberConfiguration>;
    updateCallForwarding(numberId: string, config: {
        enabled: boolean;
        primaryDestination?: string;
        failoverDestination?: string;
        businessHoursDestination?: string;
        afterHoursDestination?: string;
        timeout?: number;
    }): Promise<NumberConfiguration>;
    updateVoicemail(numberId: string, config: {
        enabled: boolean;
        customGreeting?: string;
        emailNotifications?: boolean;
        transcriptionEnabled?: boolean;
        maxDuration?: number;
    }): Promise<NumberConfiguration>;
    updateBusinessHours(numberId: string, config: {
        timezone: string;
        schedule: any;
        holidays?: Date[];
    }): Promise<NumberConfiguration>;
    updateNotifications(numberId: string, config: {
        callNotifications?: boolean;
        smsNotifications?: boolean;
        emailNotifications?: boolean;
        webhookUrl?: string;
        notificationChannels?: string[];
    }): Promise<NumberConfiguration>;
    delete(numberId: string): Promise<void>;
    createDefaultConfiguration(numberId: string): Promise<NumberConfiguration>;
}
