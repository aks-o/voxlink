export interface OfflineState {
    isOnline: boolean;
    isOffline: boolean;
    wasOffline: boolean;
    downlink?: number;
    effectiveType?: string;
    rtt?: number;
    saveData?: boolean;
}
export declare function useOffline(): OfflineState;
export declare function useNetworkStatus(): {
    connectionQuality: "unknown" | "poor" | "good" | "excellent";
    isSlowConnection: boolean;
    isOnline: boolean;
    isOffline: boolean;
    wasOffline: boolean;
    downlink?: number;
    effectiveType?: string;
    rtt?: number;
    saveData?: boolean;
};
