// Auto Dialer System Types
export type DialerType = 'power' | 'parallel' | 'speed';
export type DialerStatus = 'active' | 'paused' | 'completed' | 'stopped' | 'error';
export type ContactStatus = 'pending' | 'dialing' | 'connected' | 'no_answer' | 'busy' | 'failed' | 'completed' | 'do_not_call';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  title?: string;
  timezone?: string;
  customFields: Record<string, any>;
  status: ContactStatus;
  lastCallDate?: Date;
  callAttempts: number;
  maxAttempts: number;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  doNotCall: boolean;
  preferredCallTime?: TimeRange;
  notes?: string;
}

export interface TimeRange {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  timezone: string;
  daysOfWeek: number[]; // 0-6, Sunday = 0
}

export interface DialerCampaign {
  id: string;
  name: string;
  description: string;
  type: DialerType;
  contactList: Contact[];
  settings: DialerSettings;
  status: DialerStatus;
  statistics: CampaignStatistics;
  schedule?: CampaignSchedule;
  complianceRules: ComplianceRule[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface DialerSettings {
  // Power Dialer Settings
  dialRatio?: number; // calls per available agent
  maxRetries: number;
  retryInterval: number; // minutes between retries
  
  // Parallel Dialer Settings
  maxConcurrentCalls?: number;
  connectionTimeout: number; // seconds
  
  // Speed Dial Settings
  speedDialSlots?: SpeedDialEntry[];
  
  // Common Settings
  callTimeout: number; // seconds
  answerMachineDetection: boolean;
  recordCalls: boolean;
  playBeep: boolean;
  callerIdNumber: string;
  workingHours: TimeRange;
  timezoneBased: boolean;
  respectDoNotCall: boolean;
  maxCallsPerContact: number;
  minTimeBetweenCalls: number; // minutes
}

export interface SpeedDialEntry {
  id: string;
  name: string;
  phoneNumber: string;
  description?: string;
  hotkey?: string;
  category: string;
  priority: number;
  lastUsed?: Date;
  usageCount: number;
}

export interface CampaignStatistics {
  totalContacts: number;
  contactsDialed: number;
  contactsConnected: number;
  contactsCompleted: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  busyCalls: number;
  noAnswerCalls: number;
  voicemailCalls: number;
  connectionRate: number;
  completionRate: number;
  averageCallDuration: number;
  totalCallDuration: number;
  averageWaitTime: number;
  callsPerHour: number;
  contactsPerHour: number;
  agentUtilization: number;
  costPerCall: number;
  totalCost: number;
  startTime?: Date;
  endTime?: Date;
  lastUpdated: Date;
}

export interface CampaignSchedule {
  startDate: Date;
  endDate?: Date;
  workingHours: TimeRange;
  pauseDuringBreaks: boolean;
  breakTimes: TimeRange[];
  maxDailyContacts?: number;
  maxHourlyContacts?: number;
}

export interface ComplianceRule {
  id: string;
  type: 'time_restriction' | 'dnc_list' | 'call_frequency' | 'consent_required';
  name: string;
  description: string;
  config: Record<string, any>;
  isActive: boolean;
  violations: ComplianceViolation[];
}

export interface ComplianceViolation {
  id: string;
  ruleId: string;
  contactId: string;
  campaignId: string;
  violationType: string;
  description: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface DialerSession {
  id: string;
  campaignId: string;
  agentId: string;
  status: 'active' | 'paused' | 'ended';
  currentContact?: Contact;
  callsHandled: number;
  contactsCompleted: number;
  sessionDuration: number;
  averageCallDuration: number;
  startTime: Date;
  endTime?: Date;
  lastActivity: Date;
}

export interface DialerMetrics {
  activeCampaigns: number;
  totalAgents: number;
  activeAgents: number;
  callsInProgress: number;
  callsPerMinute: number;
  averageWaitTime: number;
  connectionRate: number;
  agentUtilization: number;
  systemLoad: number;
  queuedContacts: number;
}

export interface PowerDialerConfig extends DialerSettings {
  predictiveRatio: number;
  abandonRateThreshold: number;
  agentWrapUpTime: number;
  autoAdvance: boolean;
}

export interface ParallelDialerConfig extends DialerSettings {
  maxSimultaneousCalls: number;
  callDistributionStrategy: 'round_robin' | 'least_busy' | 'skill_based';
  failoverEnabled: boolean;
  callQueueSize: number;
}

export interface SpeedDialConfig extends DialerSettings {
  categories: string[];
  allowCustomEntries: boolean;
  syncWithContacts: boolean;
  hotkeyEnabled: boolean;
}

// API Request/Response Types
export interface CreateCampaignRequest {
  name: string;
  description: string;
  type: DialerType;
  contactListId?: string;
  contacts?: Contact[];
  settings: DialerSettings;
  schedule?: CampaignSchedule;
  complianceRules?: string[];
}

export interface UpdateCampaignRequest extends Partial<CreateCampaignRequest> {
  status?: DialerStatus;
}

export interface StartCampaignRequest {
  campaignId: string;
  agentIds?: string[];
  overrideSchedule?: boolean;
}

export interface StopCampaignRequest {
  campaignId: string;
  reason?: string;
  saveProgress?: boolean;
}

export interface AddContactsRequest {
  campaignId: string;
  contacts: Contact[];
  replaceExisting?: boolean;
}

export interface UpdateContactRequest extends Partial<Contact> {
  campaignId: string;
  contactId: string;
}

export interface DialerStatsQuery {
  campaignId?: string;
  agentId?: string;
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'hour' | 'day' | 'week' | 'month';
}