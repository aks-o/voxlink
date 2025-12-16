import { RedisClientType } from 'redis';
declare class RedisServiceClass {
    private client;
    initialize(): Promise<void>;
    disconnect(): Promise<void>;
    getClient(): RedisClientType;
    healthCheck(): Promise<boolean>;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    setWithExpiry(key: string, value: any, expiryDate: Date): Promise<boolean>;
}
export declare const RedisService: RedisServiceClass;
export {};

