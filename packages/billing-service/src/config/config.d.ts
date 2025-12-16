export declare const config: {
    env: string;
    server: {
        port: number;
        host: string;
    };
    database: {
        url: string;
    };
    redis: {
        url: string;
    };
    cors: {
        allowedOrigins: string[];
    };
    stripe: {
        secretKey: string;
        webhookSecret: string;
        publishableKey: string;
    };
    billing: {
        defaultCurrency: string;
        taxRate: number;
        gracePeriodDays: number;
        invoiceDueDays: number;
    };
    pdf: {
        storageUrl: string;
        storagePath: string;
    };
    pricing: {
        setupFee: number;
        monthlyBase: number;
        inboundCallPerMinute: number;
        outboundCallPerMinute: number;
        smsInbound: number;
        smsOutbound: number;
        voicemailPerMessage: number;
        callForwardingPerMinute: number;
    };
};
