export declare const config: {
    nodeEnv: string;
    port: number;
    database: {
        url: string;
        ssl: boolean;
        maxConnections: number;
    };
    cors: {
        allowedOrigins: string[];
    };
    logging: {
        level: string;
        format: string;
        enableConsole: boolean;
        enableFile: boolean;
        logFile: string;
    };
    ai: {
        voiceProvider: string;
        apiKey: string;
        defaultLanguage: string;
        maxCallDuration: number;
        responseTimeout: number;
    };
};
