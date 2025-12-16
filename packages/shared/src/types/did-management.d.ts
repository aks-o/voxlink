export interface DIDGroup {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    numbers: string[];
    routingConfig: DIDGroupRoutingConfig;
    createdAt: Date;
    updatedAt: Date;
}
export interface DIDGroupRoutingConfig {
    strategy: 'round_robin' | 'sequential' | 'random' | 'least_used';
    failoverEnabled: boolean;
    failoverNumbers: string[];
    businessHoursRouting?: {
        enabled: boolean;
        strategy: 'round_robin' | 'sequential' | 'random' | 'least_used';
        numbers: string[];
    };
    afterHoursRouting?: {
        enabled: boolean;
        strategy: 'round_robin' | 'sequential' | 'random' | 'least_used';
        numbers: string[];
    };
}
export interface NumberInventoryItem {
    id: string;
    phoneNumber: string;
    countryCode: string;
    areaCode: string;
    city: string;
    region: string;
    status: 'available' | 'active' | 'reserved' | 'suspended' | 'porting';
    assignedGroups: string[];
    monthlyRate: number;
    setupFee: number;
    features: string[];
    purchaseDate: Date;
    activationDate?: Date;
    lastUsed?: Date;
    usageStats: {
        totalCalls: number;
        totalDuration: number;
        totalCost: number;
        lastMonth: {
            calls: number;
            duration: number;
            cost: number;
        };
    };
    configuration: {
        callForwardingEnabled: boolean;
        primaryDestination?: string;
        voicemailEnabled: boolean;
    };
}
export interface RoutingRule {
    id: string;
    name: string;
    description?: string;
    priority: number;
    conditions: RoutingCondition[];
    actions: RoutingAction[];
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface RoutingCondition {
    type: 'time_of_day' | 'day_of_week' | 'caller_id' | 'number_called' | 'call_queue_length';
    operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than';
    value: string | number;
}
export interface RoutingAction {
    type: 'forward_to_number' | 'forward_to_group' | 'send_to_voicemail' | 'play_message' | 'hangup';
    target?: string;
    timeout?: number;
}
export interface NumberProvider {
    id: string;
    name: string;
    displayName: string;
    supportedCountries: string[];
    features: string[];
    pricing: {
        setupFee: number;
        monthlyRate: number;
        perMinuteRate: number;
    };
    apiEndpoint: string;
    status: 'active' | 'inactive' | 'maintenance';
}
export interface NumberPurchaseRequest {
    phoneNumber: string;
    providerId: string;
    countryCode: string;
    areaCode: string;
    features: string[];
    billingInfo: {
        companyName: string;
        email: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
    };
    paymentMethod: {
        type: 'credit_card' | 'bank_transfer' | 'paypal';
        details: Record<string, any>;
    };
}
