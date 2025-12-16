// Unified Messaging System Types
export type MessageChannel = 'sms' | 'chat' | 'email' | 'voice' | 'whatsapp' | 'telegram';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'cancelled';

export interface UnifiedMessage {
  id: string;
  threadId: string;
  channel: MessageChannel;
  direction: MessageDirection;
  content: string;
  metadata: Record<string, any>;
  status: MessageStatus;
  timestamp: Date;
  agentId?: string;
  customerId: string;
  attachments?: MessageAttachment[];
  replyToId?: string;
  isAutomated?: boolean;
}

export interface MessageAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

export interface MessageThread {
  id: string;
  customerId: string;
  channel: MessageChannel;
  subject?: string;
  status: 'open' | 'closed' | 'pending' | 'resolved';
  assignedAgentId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  unreadCount: number;
}

export interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  variables: TemplateVariable[];
  channel: MessageChannel;
  category: string;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  defaultValue?: string;
  options?: string[];
  description?: string;
}

export interface CommunicationChannel {
  id: string;
  type: MessageChannel;
  name: string;
  config: Record<string, any>;
  isActive: boolean;
  isDefault: boolean;
  rateLimits?: RateLimit[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RateLimit {
  period: 'minute' | 'hour' | 'day';
  limit: number;
  currentUsage: number;
  resetAt: Date;
}

export interface MessageWorkflow {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
  isActive: boolean;
  executionCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WorkflowTrigger {
  id: string;
  type: 'message_received' | 'keyword_detected' | 'time_based' | 'customer_action';
  config: Record<string, any>;
  conditions?: WorkflowCondition[];
}

export interface WorkflowAction {
  id: string;
  type: 'send_message' | 'assign_agent' | 'add_tag' | 'create_ticket' | 'webhook';
  config: Record<string, any>;
  delay?: number;
}

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: string | number | boolean;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'broadcast' | 'drip' | 'triggered' | 'promotional';
  channel: MessageChannel;
  templateId: string;
  targetAudience: CampaignAudience;
  schedule: CampaignSchedule;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  statistics: CampaignStatistics;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CampaignAudience {
  type: 'all' | 'segment' | 'custom';
  criteria?: AudienceCriteria[];
  customerIds?: string[];
  estimatedSize: number;
}

export interface AudienceCriteria {
  field: string;
  operator: string;
  value: string | number | boolean;
}

export interface CampaignSchedule {
  type: 'immediate' | 'scheduled' | 'recurring';
  startDate?: Date;
  endDate?: Date;
  timezone: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  daysOfWeek?: number[];
  timeOfDay?: string;
}

export interface CampaignStatistics {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  unsubscribed: number;
  bounced: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
}

// API Request/Response Types
export interface SendMessageRequest {
  threadId?: string;
  customerId: string;
  channel: MessageChannel;
  content: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
  attachments?: File[];
  scheduledAt?: Date;
}

export interface CreateTemplateRequest {
  name: string;
  description: string;
  content: string;
  variables: TemplateVariable[];
  channel: MessageChannel;
  category: string;
}

export interface CreateCampaignRequest {
  name: string;
  description: string;
  type: Campaign['type'];
  channel: MessageChannel;
  templateId: string;
  targetAudience: CampaignAudience;
  schedule: CampaignSchedule;
}