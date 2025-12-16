export interface VoiceSettings {
    voice: string;
    speed: number;
    pitch: number;
    language: string;
    volume?: number;
    tone?: 'professional' | 'friendly' | 'casual' | 'formal';
}
export interface WorkflowStep {
    id: string;
    type: 'greeting' | 'question' | 'condition' | 'action' | 'transfer' | 'end';
    name: string;
    content: string;
    conditions?: WorkflowCondition[];
    nextSteps?: string[];
    metadata?: Record<string, any>;
}
export interface WorkflowCondition {
    id: string;
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
    value: string | number | boolean;
    nextStep?: string;
}
export interface EscalationRule {
    id: string;
    trigger: 'timeout' | 'keyword' | 'sentiment' | 'manual';
    condition: string;
    action: 'transfer_to_agent' | 'voicemail' | 'callback' | 'end_call';
    targetAgent?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
}
export interface AgentPerformance {
    totalCalls: number;
    successfulCalls: number;
    averageCallDuration: number;
    customerSatisfactionScore: number;
    escalationRate: number;
    lastUpdated: Date;
}
export interface WorkflowAnalytics {
    totalExecutions: number;
    successRate: number;
    averageCompletionTime: number;
    commonExitPoints: Record<string, number>;
    userSatisfactionScore: number;
}
export interface Integration {
    id: string;
    type: 'crm' | 'calendar' | 'database' | 'webhook' | 'api';
    name: string;
    config: Record<string, any>;
    isActive: boolean;
    lastSync?: Date;
}
export interface AIAgent {
    id: string;
    name: string;
    description: string;
    voiceSettings: VoiceSettings;
    workflows: WorkflowStep[];
    integrations: Integration[];
    performance: AgentPerformance;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tags?: string[];
}
export interface VoiceWorkflow {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    conditions: WorkflowCondition[];
    escalationRules: EscalationRule[];
    analytics: WorkflowAnalytics;
    isActive: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tags?: string[];
}
export interface CreateAIAgentRequest {
    name: string;
    description: string;
    voiceSettings: VoiceSettings;
    workflows?: string[];
    integrations?: string[];
    tags?: string[];
}
export interface UpdateAIAgentRequest extends Partial<CreateAIAgentRequest> {
    isActive?: boolean;
}
export interface CreateVoiceWorkflowRequest {
    name: string;
    description: string;
    steps: WorkflowStep[];
    conditions?: WorkflowCondition[];
    escalationRules?: EscalationRule[];
    tags?: string[];
}
export interface UpdateVoiceWorkflowRequest extends Partial<CreateVoiceWorkflowRequest> {
    isActive?: boolean;
}
