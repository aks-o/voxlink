export declare const config: {
    readonly env: string;
    readonly server: {
        readonly port: number;
    };
    readonly database: {
        readonly url: string;
        readonly testUrl: string;
    };
    readonly redis: {
        readonly url: string;
        readonly host: string;
        readonly port: number;
        readonly password: string | undefined;
        readonly keyPrefix: "voxlink:numbers:";
        readonly defaultTtl: 3600;
    };
    readonly cors: {
        readonly allowedOrigins: string[];
    };
    readonly logging: {
        readonly level: string;
        readonly format: string;
    };
    readonly providers: {
        readonly twilio: {
            readonly accountSid: string;
            readonly authToken: string;
            readonly apiKey: string;
            readonly enabled: boolean;
        };
        readonly bandwidth: {
            readonly username: string;
            readonly password: string;
            readonly accountId: string;
            readonly siteId: string;
            readonly peerId: string;
            readonly apiKey: string;
            readonly enabled: boolean;
        };
        readonly vonage: {
            readonly apiKey: string;
            readonly apiSecret: string;
            readonly enabled: boolean;
        };
        readonly exotel: {
            readonly apiKey: string;
            readonly apiToken: string;
            readonly accountSid: string;
            readonly subdomain: string;
            readonly callerId: string;
            readonly enabled: boolean;
        };
    };
    readonly cache: {
        readonly searchResultsTtl: 300;
        readonly numberDetailsTtl: 1800;
        readonly availabilityTtl: 60;
    };
    readonly reservations: {
        readonly timeoutMinutes: 10;
        readonly cleanupIntervalMinutes: 5;
    };
};
