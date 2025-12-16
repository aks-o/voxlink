import { RedisClientType } from 'redis';
export declare class RedisService {
    private static client;
    static initialize(): Promise<void>;
    static getClient(): RedisClientType;
    static disconnect(): Promise<void>;
    static healthCheck(): Promise<boolean>;
    static set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    static get(key: string): Promise<string | null>;
    static del(key: string): Promise<void>;
    static exists(key: string): Promise<boolean>;
}
