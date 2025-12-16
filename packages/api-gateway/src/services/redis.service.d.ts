export declare class RedisService {
    private client;
    private isConnected;
    constructor();
    private connect;
    disconnect(): Promise<void>;
    private getKey;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<boolean>;
    setex(key: string, seconds: number, value: string): Promise<boolean>;
    del(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    incrementRateLimit(key: string, windowMs: number): Promise<number>;
    getRateLimit(key: string): Promise<{
        count: number;
        ttl: number;
    }>;
    createSession(sessionId: string, userId: string, data: any): Promise<boolean>;
    getSession(sessionId: string): Promise<any | null>;
    deleteSession(sessionId: string): Promise<boolean>;
    extendSession(sessionId: string): Promise<boolean>;
    ping(): Promise<boolean>;
    getConnectionStatus(): boolean;
}
