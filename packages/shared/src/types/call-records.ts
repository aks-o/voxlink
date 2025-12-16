// Call Records and Analytics Types
export type CallDirection = 'inbound' | 'outbound';
export type CallStatus = 'completed' | 'abandoned' | 'failed' | 'busy' | 'no_answer' | 'in_progress';
export type CallDisposition = 'answered' | 'voicemail' | 'busy' | 'no_answer' | 'failed' | 'transferred' | 'callback_requested';

export interface CallRecord {
  id: string;
  callId: string;
  direction: CallDirection;
  fromNumber: string;
  toNumber: string;
  duration: number; // in seconds
  status: CallStatus;
  disposition: CallDisposition;
  recordingUrl?: string;
  transcriptUrl?: string;
  agentId?: string;
  aiAgentId?: string;
  customerId?: string;
  campaignId?: string;
  metadata: Record<string, any>;
  startTime: Date;
  endTime?: Date;
  answerTime?: Date;
  cost?: number;
  quality?: CallQuality;
  tags?: string[];
}

export interface CallQuality {
  score: number; // 1-5 rating
  audioQuality: number;
  connectionStability: number;
  latency: number;
  jitter: number;
  packetLoss: number;
  feedback?: string;
}

export interface CallAnalytics {
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  answeredCalls: number;
  abandonedCalls: number;
  averageDuration: number;
  averageWaitTime: number;
  answerRate: number;
  abandonRate: number;
  totalDuration: number;
  totalCost: number;
  peakHours: HourlyStats[];
  dailyStats: DailyStats[];
}

export interface HourlyStats {
  hour: number;
  callCount: number;
  averageDuration: number;
  answerRate: number;
}

export interface DailyStats {
  date: string;
  callCount: number;
  inboundCount: number;
  outboundCount: number;
  averageDuration: number;
  answerRate: number;
  abandonRate: number;
  totalCost: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalCalls: number;
  answeredCalls: number;
  averageCallDuration: number;
  averageWrapUpTime: number;
  customerSatisfactionScore: number;
  firstCallResolutionRate: number;
  transferRate: number;
  onlineTime: number;
  availableTime: number;
  busyTime: number;
  breakTime: number;
  efficiency: number;
  ranking: number;
}

export interface CallStatusReport {
  period: DateRange;
  totalCalls: number;
  callsByStatus: Record<CallStatus, number>;
  callsByDisposition: Record<CallDisposition, number>;
  hourlyDistribution: HourlyStats[];
  topNumbers: NumberStats[];
  averageMetrics: {
    duration: number;
    waitTime: number;
    answerTime: number;
  };
}

export interface AbandonRateReport {
  period: DateRange;
  totalCalls: number;
  abandonedCalls: number;
  abandonRate: number;
  abandonReasons: Record<string, number>;
  abandonByWaitTime: WaitTimeStats[];
  trendData: TrendPoint[];
  recommendations: string[];
}

export interface OutgoingCallReport {
  period: DateRange;
  totalOutboundCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number;
  averageDuration: number;
  totalCost: number;
  costPerCall: number;
  campaignBreakdown: CampaignStats[];
  agentPerformance: AgentPerformance[];
}

export interface UserStatusReport {
  period: DateRange;
  agents: AgentPerformance[];
  teamMetrics: {
    totalAgents: number;
    activeAgents: number;
    averageOnlineTime: number;
    averageCallsPerAgent: number;
    teamEfficiency: number;
  };
  topPerformers: AgentPerformance[];
  improvementAreas: string[];
}

export interface NumberStats {
  number: string;
  callCount: number;
  totalDuration: number;
  averageDuration: number;
  answerRate: number;
}

export interface WaitTimeStats {
  waitTimeRange: string;
  callCount: number;
  abandonCount: number;
  abandonRate: number;
}

export interface TrendPoint {
  date: string;
  value: number;
  change?: number;
}

export interface CampaignStats {
  campaignId: string;
  campaignName: string;
  callCount: number;
  successRate: number;
  averageDuration: number;
  totalCost: number;
  conversionRate: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in';
  value: string | number | Date | (string | number | Date)[];
}

export interface ReportConfig {
  id: string;
  name: string;
  type: 'call-status' | 'abandon-rate' | 'outgoing-call' | 'user-status' | 'call-disposition' | 'sms-mms';
  filters: ReportFilter[];
  schedule?: ReportSchedule;
  recipients: string[];
  format: 'pdf' | 'csv' | 'excel' | 'json';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  timezone: string;
  nextRun: Date;
}

// API Request/Response Types
export interface CallRecordQuery {
  startDate?: Date;
  endDate?: Date;
  direction?: CallDirection;
  status?: CallStatus;
  agentId?: string;
  customerId?: string;
  campaignId?: string;
  minDuration?: number;
  maxDuration?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GenerateReportRequest {
  type: ReportConfig['type'];
  period: DateRange;
  filters?: ReportFilter[];
  format: ReportConfig['format'];
  includeCharts?: boolean;
}