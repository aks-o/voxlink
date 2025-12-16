import React from 'react';
interface NumberConfiguration {
    id: string;
    numberId: string;
    callForwarding: {
        enabled: boolean;
        primaryDestination: string;
        failoverDestination?: string;
        businessHoursDestination?: string;
        afterHoursDestination?: string;
        timeout: number;
    };
    voicemail: {
        enabled: boolean;
        customGreeting?: string;
        greetingUrl?: string;
        emailNotifications: boolean;
        transcription: boolean;
    };
    businessHours: {
        timezone: string;
        schedule: {
            [day: string]: {
                open: string;
                close: string;
                enabled: boolean;
            };
        };
        holidays: string[];
    };
    notifications: {
        callReceived: boolean;
        voicemailReceived: boolean;
        configurationChanged: boolean;
        technicalIssues: boolean;
        billingEvents: boolean;
        deliveryMethods: {
            email: boolean;
            sms: boolean;
            push: boolean;
        };
    };
}
declare const NumberConfiguration: React.FC;
export default NumberConfiguration;
