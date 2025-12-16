import axios from 'axios';
import { safeStorage } from '../utils/storage';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = safeStorage.getItem('voxlink_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      safeStorage.removeItem('voxlink_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Dashboard API
export const dashboardApi = {
  getMetrics: async () => {
    // Mock data for now - replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalInboundCalls: 1247,
          totalOutboundCalls: 892,
          totalAgentsCalled: 24,
          bestPerformer: 'Sarah Johnson',
          callDuration: 156,
          smsCount: 342,
          activeNumbers: 12,
          uptime: 99.9,
        });
      }, 500);
    });
  },

  getRecentActivity: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            type: 'call',
            title: 'Incoming call from +1 (555) 123-4567',
            time: '2 minutes ago',
            status: 'completed',
          },
          {
            id: 2,
            type: 'sms',
            title: 'SMS received from +1 (555) 987-6543',
            time: '5 minutes ago',
            status: 'new',
          },
          {
            id: 3,
            type: 'call',
            title: 'Outbound call to +1 (555) 456-7890',
            time: '8 minutes ago',
            status: 'completed',
          },
        ]);
      }, 300);
    });
  },

  getLiveCalls: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: 1,
            agent: 'John Smith',
            number: '+1 (555) 123-4567',
            duration: 125,
            status: 'active',
          },
          {
            id: 2,
            agent: 'Sarah Johnson',
            number: '+1 (555) 987-6543',
            duration: 67,
            status: 'active',
          },
        ]);
      }, 200);
    });
  },
};

// Numbers API
export const numbersApi = {
  searchNumbers: async (criteria: any) => {
    const response = await api.get('/numbers/search/available', { params: criteria });
    return response.data;
  },

  getNumbers: async (ownerId: string) => {
    const response = await api.get('/numbers', { params: { ownerId } });
    return response.data;
  },

  getNumberDetails: async (phoneNumber: string) => {
    const response = await api.get(`/numbers/details/${encodeURIComponent(phoneNumber)}`);
    return response.data;
  },

  reserveNumber: async (phoneNumber: string, userId: string) => {
    const response = await api.post(`/numbers/${encodeURIComponent(phoneNumber)}/reserve`, {
      userId,
    });
    return response.data;
  },

  releaseReservation: async (phoneNumber: string) => {
    const response = await api.delete(`/numbers/${encodeURIComponent(phoneNumber)}/reserve`);
    return response.data;
  },

  checkBulkAvailability: async (phoneNumbers: string[]) => {
    const response = await api.post('/numbers/availability/bulk', { phoneNumbers });
    return response.data;
  },

  getSearchSuggestions: async (criteria: any) => {
    const response = await api.get('/numbers/search/suggestions', { params: criteria });
    return response.data;
  },

  // DID Group Management
  getDIDGroups: async (userId: string) => {
    const response = await api.get('/did-groups', { params: { userId } });
    return response.data;
  },

  getDIDGroup: async (groupId: string) => {
    const response = await api.get(`/did-groups/${groupId}`);
    return response.data;
  },

  createDIDGroup: async (groupData: any) => {
    const response = await api.post('/did-groups', groupData);
    return response.data;
  },

  updateDIDGroup: async (groupId: string, updates: any) => {
    const response = await api.patch(`/did-groups/${groupId}`, updates);
    return response.data;
  },

  deleteDIDGroup: async (groupId: string) => {
    const response = await api.delete(`/did-groups/${groupId}`);
    return response.data;
  },

  getGroupNumbers: async (groupId: string) => {
    const response = await api.get(`/did-groups/${groupId}/numbers`);
    return response.data;
  },

  addNumbersToGroup: async (groupId: string, numberIds: string[]) => {
    const response = await api.post(`/did-groups/${groupId}/numbers`, { numberIds });
    return response.data;
  },

  removeNumberFromGroup: async (groupId: string, numberId: string) => {
    const response = await api.delete(`/did-groups/${groupId}/numbers/${numberId}`);
    return response.data;
  },

  getAvailableNumbers: async () => {
    const response = await api.get('/numbers/available-for-groups');
    return response.data;
  },

  // Routing Rules Management
  getRoutingRules: async (userId: string) => {
    const response = await api.get('/routing-rules', { params: { userId } });
    return response.data;
  },

  createRoutingRule: async (ruleData: any) => {
    const response = await api.post('/routing-rules', ruleData);
    return response.data;
  },

  updateRoutingRule: async (ruleId: string, updates: any) => {
    const response = await api.patch(`/routing-rules/${ruleId}`, updates);
    return response.data;
  },

  deleteRoutingRule: async (ruleId: string) => {
    const response = await api.delete(`/routing-rules/${ruleId}`);
    return response.data;
  },

  testRoutingRule: async (ruleId: string, testData: any) => {
    const response = await api.post(`/routing-rules/${ruleId}/test`, testData);
    return response.data;
  },

  // Dialer API
  getDialerCampaigns: async (dialerType?: string) => {
    const response = await api.get('/dialer/campaigns', { params: { type: dialerType } });
    return response.data;
  },

  createDialerCampaign: async (campaignData: any) => {
    const response = await api.post('/dialer/campaigns', campaignData);
    return response.data;
  },

  updateDialerCampaign: async (campaignId: string, updates: any) => {
    const response = await api.patch(`/dialer/campaigns/${campaignId}`, updates);
    return response.data;
  },

  deleteDialerCampaign: async (campaignId: string) => {
    const response = await api.delete(`/dialer/campaigns/${campaignId}`);
    return response.data;
  },

  startDialerCampaign: async (campaignId: string, agentIds?: string[]) => {
    const response = await api.post(`/dialer/campaigns/${campaignId}/start`, { agentIds });
    return response.data;
  },

  stopDialerCampaign: async (campaignId: string) => {
    const response = await api.post(`/dialer/campaigns/${campaignId}/stop`);
    return response.data;
  },

  getDialerSession: async (agentId: string) => {
    const response = await api.get(`/dialer/sessions/${agentId}`);
    return response.data;
  },

  getDialerMetrics: async () => {
    const response = await api.get('/dialer/metrics');
    return response.data;
  },

  // Speed Dial API
  getSpeedDialEntries: async (userId: string) => {
    const response = await api.get('/speed-dial/entries', { params: { userId } });
    return response.data;
  },

  createSpeedDialEntry: async (entryData: any) => {
    const response = await api.post('/speed-dial/entries', entryData);
    return response.data;
  },

  updateSpeedDialEntry: async (entryId: string, updates: any) => {
    const response = await api.patch(`/speed-dial/entries/${entryId}`, updates);
    return response.data;
  },

  deleteSpeedDialEntry: async (entryId: string) => {
    const response = await api.delete(`/speed-dial/entries/${entryId}`);
    return response.data;
  },

  makeSpeedDialCall: async (entryId: string) => {
    const response = await api.post(`/speed-dial/entries/${entryId}/call`);
    return response.data;
  },

  // Dialer Settings API
  getDialerSettings: async (dialerType: string) => {
    const response = await api.get(`/dialer/settings/${dialerType}`);
    return response.data;
  },

  updateDialerSettings: async (dialerType: string, settings: any) => {
    const response = await api.put(`/dialer/settings/${dialerType}`, settings);
    return response.data;
  },

  getComplianceRules: async () => {
    const response = await api.get('/dialer/compliance-rules');
    return response.data;
  },

  updateComplianceRule: async (ruleId: string, updates: any) => {
    const response = await api.patch(`/dialer/compliance-rules/${ruleId}`, updates);
    return response.data;
  },

  getNumberConfiguration: async (phoneNumber: string) => {
    // Mock configuration - replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            id: 'config-1',
            numberId: phoneNumber,
            callForwarding: {
              enabled: true,
              primaryDestination: '+1 (555) 123-4567',
              failoverDestination: '+1 (555) 987-6543',
              businessHoursDestination: '',
              afterHoursDestination: '',
              timeout: 30
            },
            voicemail: {
              enabled: true,
              customGreeting: 'Hi, you\'ve reached VoxLink. Please leave a message.',
              greetingUrl: '',
              emailNotifications: true,
              transcription: true
            },
            businessHours: {
              timezone: 'America/New_York',
              schedule: {
                monday: { enabled: true, open: '09:00', close: '17:00' },
                tuesday: { enabled: true, open: '09:00', close: '17:00' },
                wednesday: { enabled: true, open: '09:00', close: '17:00' },
                thursday: { enabled: true, open: '09:00', close: '17:00' },
                friday: { enabled: true, open: '09:00', close: '17:00' },
                saturday: { enabled: false, open: '09:00', close: '17:00' },
                sunday: { enabled: false, open: '09:00', close: '17:00' }
              },
              holidays: ['2024-12-25', '2024-01-01']
            },
            notifications: {
              callReceived: true,
              voicemailReceived: true,
              configurationChanged: false,
              technicalIssues: true,
              billingEvents: true,
              deliveryMethods: {
                email: true,
                sms: false,
                push: true
              }
            }
          }
        });
      }, 500);
    });
  },

  updateNumberConfiguration: async (phoneNumber: string, configuration: any) => {
    // Mock update - replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Configuration updated successfully',
          data: configuration
        });
      }, 1000);
    });
  },

  testNumberConfiguration: async (phoneNumber: string) => {
    // Mock test - replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Configuration test completed successfully',
          details: {
            callForwarding: 'Working',
            voicemail: 'Working',
            businessHours: 'Configured',
            notifications: 'Active'
          }
        });
      }, 2000);
    });
  },
};

// Analytics API
export const analyticsApi = {
  getCallAnalytics: async (period: string) => {
    // Mock data for now
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          totalCalls: 2139,
          callDuration: 45678,
          successRate: 94.2,
          chartData: [
            { date: '2024-01-01', inbound: 45, outbound: 32 },
            { date: '2024-01-02', inbound: 52, outbound: 28 },
            { date: '2024-01-03', inbound: 48, outbound: 35 },
            { date: '2024-01-04', inbound: 61, outbound: 42 },
            { date: '2024-01-05', inbound: 55, outbound: 38 },
            { date: '2024-01-06', inbound: 67, outbound: 45 },
            { date: '2024-01-07', inbound: 59, outbound: 41 },
          ],
        });
      }, 400);
    });
  },

  getUsageAnalytics: async (dateRange: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            totalCalls: 1247,
            totalSMS: 892,
            totalDuration: 45678,
            averageCallDuration: 156,
            callTrends: [
              { date: '2024-01-01', inbound: 45, outbound: 32 },
              { date: '2024-01-02', inbound: 52, outbound: 28 },
              { date: '2024-01-03', inbound: 48, outbound: 35 },
              { date: '2024-01-04', inbound: 61, outbound: 42 },
              { date: '2024-01-05', inbound: 55, outbound: 38 },
              { date: '2024-01-06', inbound: 67, outbound: 45 },
              { date: '2024-01-07', inbound: 59, outbound: 41 },
            ],
            numberUsage: [
              { phoneNumber: '+1 (555) 123-4567', calls: 156, sms: 89, duration: 12456 },
              { phoneNumber: '+1 (555) 987-6543', calls: 134, sms: 67, duration: 10234 },
              { phoneNumber: '+1 (555) 456-7890', calls: 98, sms: 45, duration: 8765 },
              { phoneNumber: '+1 (555) 321-0987', calls: 87, sms: 34, duration: 7654 },
              { phoneNumber: '+1 (555) 654-3210', calls: 76, sms: 23, duration: 6543 },
            ],
            hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({
              hour,
              calls: Math.floor(Math.random() * 50) + 10
            })),
            callTypes: [
              { type: 'Inbound', count: 756, percentage: 60.6 },
              { type: 'Outbound', count: 491, percentage: 39.4 },
            ]
          }
        });
      }, 500);
    });
  },

  getCostAnalytics: async (dateRange: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            totalCost: 1247.89,
            monthlyRecurring: 890.00,
            usageCosts: 357.89,
            projectedCost: 1456.78,
            costTrends: [
              { date: '2024-01-01', recurring: 890, usage: 45, total: 935 },
              { date: '2024-01-02', recurring: 890, usage: 52, total: 942 },
              { date: '2024-01-03', recurring: 890, usage: 48, total: 938 },
              { date: '2024-01-04', recurring: 890, usage: 61, total: 951 },
              { date: '2024-01-05', recurring: 890, usage: 55, total: 945 },
              { date: '2024-01-06', recurring: 890, usage: 67, total: 957 },
              { date: '2024-01-07', recurring: 890, usage: 59, total: 949 },
            ],
            numberCosts: [
              { phoneNumber: '+1 (555) 123-4567', monthlyCost: 25.00, usageCost: 45.67, totalCost: 70.67 },
              { phoneNumber: '+1 (555) 987-6543', monthlyCost: 25.00, usageCost: 38.45, totalCost: 63.45 },
              { phoneNumber: '+1 (555) 456-7890', monthlyCost: 25.00, usageCost: 32.18, totalCost: 57.18 },
              { phoneNumber: '+1 (555) 321-0987', monthlyCost: 25.00, usageCost: 28.90, totalCost: 53.90 },
              { phoneNumber: '+1 (555) 654-3210', monthlyCost: 25.00, usageCost: 24.56, totalCost: 49.56 },
            ],
            costBreakdown: [
              { category: 'Monthly Fees', amount: 890.00, percentage: 71.3 },
              { category: 'Call Charges', amount: 245.67, percentage: 19.7 },
              { category: 'SMS Charges', amount: 89.34, percentage: 7.2 },
              { category: 'Setup Fees', amount: 22.88, percentage: 1.8 },
            ],
            invoices: [
              { id: 'INV-001', date: '2024-01-01', amount: 1247.89, status: 'paid', dueDate: '2024-01-15' },
              { id: 'INV-002', date: '2024-01-15', amount: 1156.78, status: 'pending', dueDate: '2024-01-30' },
              { id: 'INV-003', date: '2023-12-15', amount: 1089.45, status: 'overdue', dueDate: '2023-12-30' },
            ],
            recommendations: [
              {
                type: 'warning',
                title: 'High Usage Detected',
                description: 'Your usage costs have increased by 23% this month. Consider reviewing your call patterns.',
                potentialSavings: 89.45
              },
              {
                type: 'info',
                title: 'Unused Numbers',
                description: 'You have 3 numbers with minimal usage. Consider consolidating to reduce costs.',
                potentialSavings: 75.00
              },
              {
                type: 'success',
                title: 'Efficient Usage',
                description: 'Your average call duration is optimal, keeping per-minute costs low.'
              }
            ]
          }
        });
      }, 600);
    });
  },

  getCallStatistics: async (dateRange: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            totalCalls: 1247,
            inboundCalls: 756,
            outboundCalls: 491,
            missedCalls: 89,
            averageDuration: 156,
            totalDuration: 194532,
            answerRate: 92.8,
            callTrends: [
              { date: '2024-01-01', inbound: 45, outbound: 32, missed: 8 },
              { date: '2024-01-02', inbound: 52, outbound: 28, missed: 6 },
              { date: '2024-01-03', inbound: 48, outbound: 35, missed: 9 },
              { date: '2024-01-04', inbound: 61, outbound: 42, missed: 12 },
              { date: '2024-01-05', inbound: 55, outbound: 38, missed: 7 },
              { date: '2024-01-06', inbound: 67, outbound: 45, missed: 11 },
              { date: '2024-01-07', inbound: 59, outbound: 41, missed: 8 },
            ],
            durationTrends: [
              { date: '2024-01-01', averageDuration: 145 },
              { date: '2024-01-02', averageDuration: 152 },
              { date: '2024-01-03', averageDuration: 148 },
              { date: '2024-01-04', averageDuration: 161 },
              { date: '2024-01-05', averageDuration: 155 },
              { date: '2024-01-06', averageDuration: 167 },
              { date: '2024-01-07', averageDuration: 159 },
            ],
            geographicDistribution: [
              { country: 'US', region: 'California', calls: 456, percentage: 36.6 },
              { country: 'US', region: 'New York', calls: 234, percentage: 18.8 },
              { country: 'US', region: 'Texas', calls: 189, percentage: 15.2 },
              { country: 'CA', region: 'Ontario', calls: 156, percentage: 12.5 },
              { country: 'US', region: 'Florida', calls: 134, percentage: 10.7 },
              { country: 'GB', region: 'London', calls: 78, percentage: 6.3 },
            ],
            peakHours: Array.from({ length: 24 }, (_, hour) => ({
              hour,
              calls: Math.floor(Math.random() * 80) + 20,
              averageDuration: Math.floor(Math.random() * 60) + 120
            })),
            callQuality: {
              excellent: 567,
              good: 445,
              fair: 156,
              poor: 79
            },
            topCallers: [
              { number: '+1 (555) 123-4567', calls: 45, duration: 3456, lastCall: '2024-01-15T14:30:00Z' },
              { number: '+1 (555) 987-6543', calls: 38, duration: 2890, lastCall: '2024-01-15T13:45:00Z' },
              { number: '+1 (555) 456-7890', calls: 32, duration: 2456, lastCall: '2024-01-15T12:20:00Z' },
              { number: '+1 (555) 321-0987', calls: 28, duration: 2134, lastCall: '2024-01-15T11:15:00Z' },
              { number: '+1 (555) 654-3210', calls: 24, duration: 1890, lastCall: '2024-01-15T10:30:00Z' },
            ],
            realTimeStats: {
              activeCalls: 3,
              callsToday: 127,
              averageWaitTime: 15,
              onlineAgents: 8
            }
          }
        });
      }, 700);
    });
  },

  exportReport: async (exportData: any) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          jobId: Date.now().toString(),
          message: 'Export job started successfully'
        });
      }, 1000);
    });
  },
};

// AI Agent API
export const aiAgentApi = {
  // AI Agents
  getAgents: async () => {
    const response = await api.get('/ai-agents');
    return response.data;
  },

  getAgent: async (agentId: string) => {
    const response = await api.get(`/ai-agents/${agentId}`);
    return response.data;
  },

  createAgent: async (agentData: any) => {
    const response = await api.post('/ai-agents', agentData);
    return response.data;
  },

  updateAgent: async (agentId: string, agentData: any) => {
    const response = await api.put(`/ai-agents/${agentId}`, agentData);
    return response.data;
  },

  deleteAgent: async (agentId: string) => {
    const response = await api.delete(`/ai-agents/${agentId}`);
    return response.data;
  },

  toggleAgent: async (agentId: string, isActive: boolean) => {
    const response = await api.patch(`/ai-agents/${agentId}/status`, { isActive });
    return response.data;
  },

  // Voice Workflows
  getWorkflows: async () => {
    const response = await api.get('/voice-workflows');
    return response.data;
  },

  getWorkflow: async (workflowId: string) => {
    const response = await api.get(`/voice-workflows/${workflowId}`);
    return response.data;
  },

  createWorkflow: async (workflowData: any) => {
    const response = await api.post('/voice-workflows', workflowData);
    return response.data;
  },

  updateWorkflow: async (workflowId: string, workflowData: any) => {
    const response = await api.put(`/voice-workflows/${workflowId}`, workflowData);
    return response.data;
  },

  deleteWorkflow: async (workflowId: string) => {
    const response = await api.delete(`/voice-workflows/${workflowId}`);
    return response.data;
  },

  toggleWorkflow: async (workflowId: string, isActive: boolean) => {
    const response = await api.patch(`/voice-workflows/${workflowId}/status`, { isActive });
    return response.data;
  },

  duplicateWorkflow: async (workflowId: string) => {
    const response = await api.post(`/voice-workflows/${workflowId}/duplicate`);
    return response.data;
  },

  // Voice Settings
  getVoiceOptions: async () => {
    const response = await api.get('/ai-agents/voice-options');
    return response.data;
  },

  previewVoice: async (voiceSettings: any, text: string) => {
    const response = await api.post('/ai-agents/voice-preview', { voiceSettings, text });
    return response.data;
  },

  // Agent Performance
  getAgentPerformance: async (agentId: string, dateRange?: string) => {
    const response = await api.get(`/ai-agents/${agentId}/performance`, {
      params: { dateRange }
    });
    return response.data;
  },

  // Workflow Analytics
  getWorkflowAnalytics: async (workflowId: string, dateRange?: string) => {
    const response = await api.get(`/voice-workflows/${workflowId}/analytics`, {
      params: { dateRange }
    });
    return response.data;
  },
};

// Messaging API
export const messagingApi = {
  // Messages
  getMessages: async (threadId?: string) => {
    const response = await api.get('/messages', { params: { threadId } });
    return response.data;
  },

  getThreads: async (filters?: any) => {
    const response = await api.get('/threads', { params: filters });
    return response.data;
  },

  sendMessage: async (messageData: any) => {
    const response = await api.post('/messages', messageData);
    return response.data;
  },

  // Templates
  getTemplates: async (filters?: any) => {
    const response = await api.get('/templates', { params: filters });
    return response.data;
  },

  createTemplate: async (templateData: any) => {
    const response = await api.post('/templates', templateData);
    return response.data;
  },

  updateTemplate: async (templateId: string, templateData: any) => {
    const response = await api.put(`/templates/${templateId}`, templateData);
    return response.data;
  },

  deleteTemplate: async (templateId: string) => {
    const response = await api.delete(`/templates/${templateId}`);
    return response.data;
  },

  // Channels
  getChannels: async () => {
    const response = await api.get('/channels');
    return response.data;
  },

  createChannel: async (channelData: any) => {
    const response = await api.post('/channels', channelData);
    return response.data;
  },

  updateChannel: async (channelId: string, channelData: any) => {
    const response = await api.put(`/channels/${channelId}`, channelData);
    return response.data;
  },

  deleteChannel: async (channelId: string) => {
    const response = await api.delete(`/channels/${channelId}`);
    return response.data;
  },

  toggleChannel: async (channelId: string, isActive: boolean) => {
    const response = await api.patch(`/channels/${channelId}/status`, { isActive });
    return response.data;
  },

  // Workflows
  getWorkflows: async () => {
    const response = await api.get('/message-workflows');
    return response.data;
  },

  createWorkflow: async (workflowData: any) => {
    const response = await api.post('/message-workflows', workflowData);
    return response.data;
  },

  updateWorkflow: async (workflowId: string, workflowData: any) => {
    const response = await api.put(`/message-workflows/${workflowId}`, workflowData);
    return response.data;
  },

  deleteWorkflow: async (workflowId: string) => {
    const response = await api.delete(`/message-workflows/${workflowId}`);
    return response.data;
  },

  toggleWorkflow: async (workflowId: string, isActive: boolean) => {
    const response = await api.patch(`/message-workflows/${workflowId}/status`, { isActive });
    return response.data;
  },

  // Campaigns
  getCampaigns: async (filters?: any) => {
    const response = await api.get('/campaigns', { params: filters });
    return response.data;
  },

  createCampaign: async (campaignData: any) => {
    const response = await api.post('/campaigns', campaignData);
    return response.data;
  },

  updateCampaign: async (campaignId: string, campaignData: any) => {
    const response = await api.put(`/campaigns/${campaignId}`, campaignData);
    return response.data;
  },

  deleteCampaign: async (campaignId: string) => {
    const response = await api.delete(`/campaigns/${campaignId}`);
    return response.data;
  },

  toggleCampaign: async (campaignId: string, status: string) => {
    const response = await api.patch(`/campaigns/${campaignId}/status`, { status });
    return response.data;
  },

  getCampaignAnalytics: async (campaignId: string, dateRange?: string) => {
    const response = await api.get(`/campaigns/${campaignId}/analytics`, {
      params: { dateRange }
    });
    return response.data;
  },

  // AI Features
  getAIFeatures: async () => {
    const response = await api.get('/ai-features');
    return response.data;
  },

  toggleAIFeature: async (featureId: string, isEnabled: boolean) => {
    const response = await api.patch(`/ai-features/${featureId}`, { isEnabled });
    return response.data;
  },

  getAIInsights: async (dateRange?: string) => {
    const response = await api.get('/ai-insights', { params: { dateRange } });
    return response.data;
  },
};

// Reporting API
export const reportingApi = {
  // Call Status Report
  getCallStatusReport: async (dateRange: { startDate: string; endDate: string }) => {
    const response = await api.get('/reports/call-status', { params: dateRange });
    return response.data;
  },

  // Abandon Rate Report
  getAbandonRateReport: async (dateRange: { startDate: string; endDate: string }) => {
    const response = await api.get('/reports/abandon-rate', { params: dateRange });
    return response.data;
  },

  // Outgoing Call Report
  getOutgoingCallReport: async (dateRange: { startDate: string; endDate: string }) => {
    const response = await api.get('/reports/outgoing-calls', { params: dateRange });
    return response.data;
  },

  // User Status Report
  getUserStatusReport: async (dateRange: { startDate: string; endDate: string }) => {
    const response = await api.get('/reports/user-status', { params: dateRange });
    return response.data;
  },

  // Call Report (General)
  getCallReport: async (dateRange: { startDate: string; endDate: string }, filters?: any) => {
    const response = await api.get('/reports/calls', { params: { ...dateRange, ...filters } });
    return response.data;
  },

  // Call Disposition Report
  getCallDispositionReport: async (dateRange: { startDate: string; endDate: string }) => {
    const response = await api.get('/reports/call-disposition', { params: dateRange });
    return response.data;
  },

  // Leaderboard
  getLeaderboard: async (dateRange: { startDate: string; endDate: string }, category?: string) => {
    const response = await api.get('/reports/leaderboard', { params: { ...dateRange, category } });
    return response.data;
  },

  // SMS/MMS Report
  getSMSMMSReport: async (dateRange: { startDate: string; endDate: string }) => {
    const response = await api.get('/reports/sms-mms', { params: dateRange });
    return response.data;
  },

  // Export Reports
  exportReport: async (reportType: string, format: 'pdf' | 'csv' | 'excel', params: any) => {
    const response = await api.post('/reports/export', {
      reportType,
      format,
      params
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Generate Report
  generateReport: async (reportConfig: any) => {
    const response = await api.post('/reports/generate', reportConfig);
    return response.data;
  },

  // Get Report Configs
  getReportConfigs: async () => {
    const response = await api.get('/reports/configs');
    return response.data;
  },

  // Save Report Config
  saveReportConfig: async (config: any) => {
    const response = await api.post('/reports/configs', config);
    return response.data;
  },
};

export default api;