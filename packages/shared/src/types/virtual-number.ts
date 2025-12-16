export type NumberStatus = 'available' | 'reserved' | 'active' | 'suspended' | 'porting';

export type NumberFeature = 
  | 'call_forwarding'
  | 'voicemail'
  | 'sms'
  | 'international_calling'
  | 'call_recording'
  | 'analytics';

export interface VirtualNumber {
  id: string;
  phoneNumber: string;
  countryCode: string;
  areaCode: string;
  city: string;
  region: string;
  status: NumberStatus;
  ownerId: string;
  purchaseDate: Date;
  activationDate?: Date;
  monthlyRate: number;
  setupFee: number;
  features: NumberFeature[];
  configuration: NumberConfiguration;
  createdAt: Date;
  updatedAt: Date;
}

export interface NumberConfiguration {
  id: string;
  numberId: string;
  callForwarding: CallForwardingConfig;
  voicemail: VoicemailConfig;
  businessHours: BusinessHoursConfig;
  notifications: NotificationConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface CallForwardingConfig {
  enabled: boolean;
  primaryDestination?: string;
  failoverDestination?: string;
  businessHoursDestination?: string;
  afterHoursDestination?: string;
  timeout: number; // seconds
}

export interface VoicemailConfig {
  enabled: boolean;
  customGreeting?: string;
  emailNotifications: boolean;
  transcriptionEnabled: boolean;
  maxDuration: number; // seconds
}

export interface BusinessHoursConfig {
  timezone: string;
  schedule: {
    [day: string]: {
      open: string; // HH:MM format
      close: string; // HH:MM format
      enabled: boolean;
    };
  };
  holidays: Date[];
}

export interface NotificationConfig {
  callNotifications: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
  webhookUrl?: string;
  notificationChannels: ('email' | 'sms' | 'webhook')[];
}