export interface DashboardConfig {
    service: string;
    metrics: MetricConfig[];
    alerts: AlertConfig[];
    healthChecks: HealthCheckConfig[];
}
export interface MetricConfig {
    name: string;
    type: 'counter' | 'gauge' | 'histogram';
    description: string;
    labels?: string[];
    thresholds?: {
        warning?: number;
        critical?: number;
    };
}
export interface AlertConfig {
    name: string;
    condition: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    channels: ('email' | 'slack' | 'webhook')[];
}
export interface HealthCheckConfig {
    name: string;
    endpoint: string;
    interval: number;
    timeout: number;
    retries: number;
}
export declare const voxlinkMonitoringConfig: Record<string, DashboardConfig>;
export declare const apiGatewayConfig: DashboardConfig;
export declare const numberServiceConfig: DashboardConfig;
export declare const billingServiceConfig: DashboardConfig;
export declare const notificationServiceConfig: DashboardConfig;
