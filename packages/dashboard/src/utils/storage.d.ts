/**
 * Safe localStorage utility that handles SecurityError and other localStorage issues
 */
declare class SafeStorage {
    private isAvailable;
    constructor();
    private checkAvailability;
    getItem(key: string): string | null;
    setItem(key: string, value: string): boolean;
    removeItem(key: string): boolean;
    clear(): boolean;
    get available(): boolean;
}
export declare const safeStorage: SafeStorage;
/**
 * Hook for safely using localStorage with fallback to memory storage
 */
export declare function useSafeLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void];
export default safeStorage;
