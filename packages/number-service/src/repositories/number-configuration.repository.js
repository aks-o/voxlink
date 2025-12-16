"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberConfigurationRepository = void 0;
const base_repository_1 = require("./base.repository");
class NumberConfigurationRepository extends base_repository_1.BaseRepository {
    async create(data) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.numberConfiguration.create({
                data: {
                    numberId: data.numberId,
                    callForwardingEnabled: data.callForwardingEnabled ?? false,
                    primaryDestination: data.primaryDestination,
                    failoverDestination: data.failoverDestination,
                    businessHoursDestination: data.businessHoursDestination,
                    afterHoursDestination: data.afterHoursDestination,
                    forwardingTimeout: data.forwardingTimeout ?? 30,
                    voicemailEnabled: data.voicemailEnabled ?? true,
                    customGreeting: data.customGreeting,
                    emailNotifications: data.emailNotifications ?? true,
                    transcriptionEnabled: data.transcriptionEnabled ?? false,
                    maxVoicemailDuration: data.maxVoicemailDuration ?? 180,
                    timezone: data.timezone ?? 'UTC',
                    businessHoursSchedule: data.businessHoursSchedule ?? {},
                    holidays: data.holidays ?? [],
                    callNotifications: data.callNotifications ?? true,
                    smsNotifications: data.smsNotifications ?? true,
                    webhookUrl: data.webhookUrl,
                    notificationChannels: data.notificationChannels ?? ['email'],
                },
            });
        }, 'create number configuration');
    }
    async findByNumberId(numberId) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.numberConfiguration.findUnique({
                where: { numberId },
            });
        }, 'find configuration by number id');
    }
    async findById(id) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.numberConfiguration.findUnique({
                where: { id },
            });
        }, 'find configuration by id');
    }
    async update(numberId, data) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.numberConfiguration.update({
                where: { numberId },
                data: {
                    ...data,
                    updatedAt: new Date(),
                },
            });
        }, 'update number configuration');
    }
    async updateCallForwarding(numberId, config) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.numberConfiguration.update({
                where: { numberId },
                data: {
                    callForwardingEnabled: config.enabled,
                    primaryDestination: config.primaryDestination,
                    failoverDestination: config.failoverDestination,
                    businessHoursDestination: config.businessHoursDestination,
                    afterHoursDestination: config.afterHoursDestination,
                    forwardingTimeout: config.timeout ?? 30,
                    updatedAt: new Date(),
                },
            });
        }, 'update call forwarding configuration');
    }
    async updateVoicemail(numberId, config) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.numberConfiguration.update({
                where: { numberId },
                data: {
                    voicemailEnabled: config.enabled,
                    customGreeting: config.customGreeting,
                    emailNotifications: config.emailNotifications ?? true,
                    transcriptionEnabled: config.transcriptionEnabled ?? false,
                    maxVoicemailDuration: config.maxDuration ?? 180,
                    updatedAt: new Date(),
                },
            });
        }, 'update voicemail configuration');
    }
    async updateBusinessHours(numberId, config) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.numberConfiguration.update({
                where: { numberId },
                data: {
                    timezone: config.timezone,
                    businessHoursSchedule: config.schedule,
                    holidays: config.holidays,
                    updatedAt: new Date(),
                },
            });
        }, 'update business hours configuration');
    }
    async updateNotifications(numberId, config) {
        return this.executeWithErrorHandling(async () => {
            return await this.db.numberConfiguration.update({
                where: { numberId },
                data: {
                    callNotifications: config.callNotifications,
                    smsNotifications: config.smsNotifications,
                    emailNotifications: config.emailNotifications,
                    webhookUrl: config.webhookUrl,
                    notificationChannels: config.notificationChannels,
                    updatedAt: new Date(),
                },
            });
        }, 'update notification configuration');
    }
    async delete(numberId) {
        return this.executeWithErrorHandling(async () => {
            await this.db.numberConfiguration.delete({
                where: { numberId },
            });
        }, 'delete number configuration');
    }
    async createDefaultConfiguration(numberId) {
        return this.executeWithErrorHandling(async () => {
            const defaultSchedule = {
                monday: { open: '09:00', close: '17:00', enabled: true },
                tuesday: { open: '09:00', close: '17:00', enabled: true },
                wednesday: { open: '09:00', close: '17:00', enabled: true },
                thursday: { open: '09:00', close: '17:00', enabled: true },
                friday: { open: '09:00', close: '17:00', enabled: true },
                saturday: { open: '10:00', close: '14:00', enabled: false },
                sunday: { open: '10:00', close: '14:00', enabled: false },
            };
            return await this.db.numberConfiguration.create({
                data: {
                    numberId,
                    callForwardingEnabled: false,
                    voicemailEnabled: true,
                    emailNotifications: true,
                    transcriptionEnabled: false,
                    maxVoicemailDuration: 180,
                    timezone: 'UTC',
                    businessHoursSchedule: defaultSchedule,
                    holidays: [],
                    callNotifications: true,
                    smsNotifications: true,
                    notificationChannels: ['email'],
                    forwardingTimeout: 30,
                },
            });
        }, 'create default configuration');
    }
}
exports.NumberConfigurationRepository = NumberConfigurationRepository;
