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

// VoxLink monitoring configuration
export const voxlinkMonitoringConfig: Record<string, DashboardConfig> = {
  'api-gateway': {
    service: 'api-gateway',
    metrics: [
      {
        name: 'http_requests_total',
        type: 'counter',
        description: 'Total HTTP requests',
        labels: ['method', 'path', 'status_code'],
        thresholds: { warning: 1000, critical: 5000 }
      },
      {
        name: 'http_request_duration_seconds',
        type: 'histogram',
        description: 'HTTP request duration',
        labels: ['method', 'path'],
        thresholds: { warning: 1, critical: 5 }
      },
      {
        name: 'active_connections',
        type: 'gauge',
        description: 'Active connections',
        thresholds: { warning: 100, critical: 500 }
      },
      {
        name: 'rate_limit_exceeded_total',
        type: 'counter',
        description: 'Rate limit exceeded events',
        labels: ['ip', 'endpoint'],
        thresholds: { warning: 10, critical: 50 }
      }
    ],
    alerts: [
      {
        name: 'High Error Rate',
        condition: 'http_requests_total{status_code=~"5.."} / http_requests_total > 0.05',
        severity: 'high',
        description: 'Error rate above 5%',
        channels: ['email', 'slack']
      },
      {
        name: 'High Response Time',
        condition: 'http_request_duration_seconds > 2',
        severity: 'medium',
        description: 'Response time above 2 seconds',
        channels: ['slack']
      },
      {
        name: 'Service Down',
        condition: 'up == 0',
        severity: 'critical',
        description: 'API Gateway is down',
        channels: ['email', 'slack', 'webhook']
      }
    ],
    healthChecks: [
      {
        name: 'api-gateway-health',
        endpoint: '/health',
        interval: 30,
        timeout: 5,
        retries: 3
      }
    ]
  },

  'number-service': {
    service: 'number-service',
    metrics: [
      {
        name: 'number_searches_total',
        type: 'counter',
        description: 'Total number searches',
        labels: ['country', 'area_code'],
        thresholds: { warning: 100, critical: 1000 }
      },
      {
        name: 'number_purchases_total',
        type: 'counter',
        description: 'Total number purchases',
        labels: ['country', 'status'],
        thresholds: { warning: 10, critical: 100 }
      },
      {
        name: 'number_activations_total',
        type: 'counter',
        description: 'Total number activations',
        labels: ['country', 'success'],
        thresholds: { warning: 10, critical: 100 }
      },
      {
        name: 'database_query_duration_seconds',
        type: 'histogram',
        description: 'Database query duration',
        labels: ['operation', 'table'],
        thresholds: { warning: 0.5, critical: 2 }
      },
      {
        name: 'telecom_provider_calls_total',
        type: 'counter',
        description: 'Telecom provider API calls',
        labels: ['provider', 'operation', 'status'],
        thresholds: { warning: 100, critical: 1000 }
      }
    ],
    alerts: [
      {
        name: 'High Number Search Failure Rate',
        condition: 'number_searches_total{status="failed"} / number_searches_total > 0.1',
        severity: 'high',
        description: 'Number search failure rate above 10%',
        channels: ['email', 'slack']
      },
      {
        name: 'Slow Database Queries',
        condition: 'database_query_duration_seconds > 1',
        severity: 'medium',
        description: 'Database queries taking longer than 1 second',
        channels: ['slack']
      },
      {
        name: 'Telecom Provider API Issues',
        condition: 'telecom_provider_calls_total{status="failed"} / telecom_provider_calls_total > 0.05',
        severity: 'high',
        description: 'Telecom provider API failure rate above 5%',
        channels: ['email', 'slack']
      }
    ],
    healthChecks: [
      {
        name: 'number-service-health',
        endpoint: '/health',
        interval: 30,
        timeout: 5,
        retries: 3
      },
      {
        name: 'number-service-database',
        endpoint: '/health/ready',
        interval: 60,
        timeout: 10,
        retries: 2
      }
    ]
  },

  'billing-service': {
    service: 'billing-service',
    metrics: [
      {
        name: 'invoices_generated_total',
        type: 'counter',
        description: 'Total invoices generated',
        labels: ['status', 'customer_type'],
        thresholds: { warning: 100, critical: 1000 }
      },
      {
        name: 'payments_processed_total',
        type: 'counter',
        description: 'Total payments processed',
        labels: ['status', 'payment_method'],
        thresholds: { warning: 50, critical: 500 }
      },
      {
        name: 'billing_amount_total',
        type: 'counter',
        description: 'Total billing amount',
        labels: ['currency', 'service_type'],
        thresholds: { warning: 10000, critical: 100000 }
      },
      {
        name: 'payment_failures_total',
        type: 'counter',
        description: 'Total payment failures',
        labels: ['reason', 'payment_method'],
        thresholds: { warning: 5, critical: 20 }
      },
      {
        name: 'usage_tracking_events_total',
        type: 'counter',
        description: 'Total usage tracking events',
        labels: ['event_type', 'service'],
        thresholds: { warning: 1000, critical: 10000 }
      }
    ],
    alerts: [
      {
        name: 'High Payment Failure Rate',
        condition: 'payment_failures_total / payments_processed_total > 0.05',
        severity: 'high',
        description: 'Payment failure rate above 5%',
        channels: ['email', 'slack']
      },
      {
        name: 'Invoice Generation Issues',
        condition: 'invoices_generated_total{status="failed"} / invoices_generated_total > 0.02',
        severity: 'medium',
        description: 'Invoice generation failure rate above 2%',
        channels: ['slack']
      },
      {
        name: 'Unusual Billing Activity',
        condition: 'billing_amount_total > 50000',
        severity: 'medium',
        description: 'Unusually high billing activity detected',
        channels: ['email']
      }
    ],
    healthChecks: [
      {
        name: 'billing-service-health',
        endpoint: '/health',
        interval: 30,
        timeout: 5,
        retries: 3
      }
    ]
  },

  'notification-service': {
    service: 'notification-service',
    metrics: [
      {
        name: 'notifications_sent_total',
        type: 'counter',
        description: 'Total notifications sent',
        labels: ['channel', 'type', 'status'],
        thresholds: { warning: 100, critical: 1000 }
      },
      {
        name: 'notification_delivery_duration_seconds',
        type: 'histogram',
        description: 'Notification delivery duration',
        labels: ['channel', 'type'],
        thresholds: { warning: 5, critical: 30 }
      },
      {
        name: 'notification_failures_total',
        type: 'counter',
        description: 'Total notification failures',
        labels: ['channel', 'reason'],
        thresholds: { warning: 10, critical: 50 }
      },
      {
        name: 'notification_queue_size',
        type: 'gauge',
        description: 'Notification queue size',
        labels: ['priority'],
        thresholds: { warning: 100, critical: 1000 }
      }
    ],
    alerts: [
      {
        name: 'High Notification Failure Rate',
        condition: 'notification_failures_total / notifications_sent_total > 0.1',
        severity: 'high',
        description: 'Notification failure rate above 10%',
        channels: ['email', 'slack']
      },
      {
        name: 'Notification Queue Backlog',
        condition: 'notification_queue_size > 500',
        severity: 'medium',
        description: 'Notification queue backlog detected',
        channels: ['slack']
      },
      {
        name: 'Slow Notification Delivery',
        condition: 'notification_delivery_duration_seconds > 10',
        severity: 'medium',
        description: 'Notifications taking longer than 10 seconds to deliver',
        channels: ['slack']
      }
    ],
    healthChecks: [
      {
        name: 'notification-service-health',
        endpoint: '/health',
        interval: 30,
        timeout: 5,
        retries: 3
      }
    ]
  }
};

// Export individual service configurations
export const apiGatewayConfig = voxlinkMonitoringConfig['api-gateway'];
export const numberServiceConfig = voxlinkMonitoringConfig['number-service'];
export const billingServiceConfig = voxlinkMonitoringConfig['billing-service'];
export const notificationServiceConfig = voxlinkMonitoringConfig['notification-service'];