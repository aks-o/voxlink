declare const api: import("axios").AxiosInstance;
export declare const dashboardApi: {
    getMetrics: () => Promise<unknown>;
    getRecentActivity: () => Promise<unknown>;
    getLiveCalls: () => Promise<unknown>;
};
export declare const numbersApi: {
    searchNumbers: (criteria: any) => Promise<any>;
    getNumbers: (ownerId: string) => Promise<any>;
    getNumberDetails: (phoneNumber: string) => Promise<any>;
    reserveNumber: (phoneNumber: string, userId: string) => Promise<any>;
    releaseReservation: (phoneNumber: string) => Promise<any>;
    checkBulkAvailability: (phoneNumbers: string[]) => Promise<any>;
    getSearchSuggestions: (criteria: any) => Promise<any>;
    getDIDGroups: (userId: string) => Promise<any>;
    getDIDGroup: (groupId: string) => Promise<any>;
    createDIDGroup: (groupData: any) => Promise<any>;
    updateDIDGroup: (groupId: string, updates: any) => Promise<any>;
    deleteDIDGroup: (groupId: string) => Promise<any>;
    getGroupNumbers: (groupId: string) => Promise<any>;
    addNumbersToGroup: (groupId: string, numberIds: string[]) => Promise<any>;
    removeNumberFromGroup: (groupId: string, numberId: string) => Promise<any>;
    getAvailableNumbers: () => Promise<any>;
    getRoutingRules: (userId: string) => Promise<any>;
    createRoutingRule: (ruleData: any) => Promise<any>;
    updateRoutingRule: (ruleId: string, updates: any) => Promise<any>;
    deleteRoutingRule: (ruleId: string) => Promise<any>;
    testRoutingRule: (ruleId: string, testData: any) => Promise<any>;
    getDialerCampaigns: (dialerType?: string) => Promise<any>;
    createDialerCampaign: (campaignData: any) => Promise<any>;
    updateDialerCampaign: (campaignId: string, updates: any) => Promise<any>;
    deleteDialerCampaign: (campaignId: string) => Promise<any>;
    startDialerCampaign: (campaignId: string, agentIds?: string[]) => Promise<any>;
    stopDialerCampaign: (campaignId: string) => Promise<any>;
    getDialerSession: (agentId: string) => Promise<any>;
    getDialerMetrics: () => Promise<any>;
    getSpeedDialEntries: (userId: string) => Promise<any>;
    createSpeedDialEntry: (entryData: any) => Promise<any>;
    updateSpeedDialEntry: (entryId: string, updates: any) => Promise<any>;
    deleteSpeedDialEntry: (entryId: string) => Promise<any>;
    makeSpeedDialCall: (entryId: string) => Promise<any>;
    getDialerSettings: (dialerType: string) => Promise<any>;
    updateDialerSettings: (dialerType: string, settings: any) => Promise<any>;
    getComplianceRules: () => Promise<any>;
    updateComplianceRule: (ruleId: string, updates: any) => Promise<any>;
    getNumberConfiguration: (phoneNumber: string) => Promise<unknown>;
    updateNumberConfiguration: (phoneNumber: string, configuration: any) => Promise<unknown>;
    testNumberConfiguration: (phoneNumber: string) => Promise<unknown>;
};
export declare const analyticsApi: {
    getCallAnalytics: (period: string) => Promise<unknown>;
    getUsageAnalytics: (dateRange: string) => Promise<unknown>;
    getCostAnalytics: (dateRange: string) => Promise<unknown>;
    getCallStatistics: (dateRange: string) => Promise<unknown>;
    exportReport: (exportData: any) => Promise<unknown>;
};
export declare const aiAgentApi: {
    getAgents: () => Promise<any>;
    getAgent: (agentId: string) => Promise<any>;
    createAgent: (agentData: any) => Promise<any>;
    updateAgent: (agentId: string, agentData: any) => Promise<any>;
    deleteAgent: (agentId: string) => Promise<any>;
    toggleAgent: (agentId: string, isActive: boolean) => Promise<any>;
    getWorkflows: () => Promise<any>;
    getWorkflow: (workflowId: string) => Promise<any>;
    createWorkflow: (workflowData: any) => Promise<any>;
    updateWorkflow: (workflowId: string, workflowData: any) => Promise<any>;
    deleteWorkflow: (workflowId: string) => Promise<any>;
    toggleWorkflow: (workflowId: string, isActive: boolean) => Promise<any>;
    duplicateWorkflow: (workflowId: string) => Promise<any>;
    getVoiceOptions: () => Promise<any>;
    previewVoice: (voiceSettings: any, text: string) => Promise<any>;
    getAgentPerformance: (agentId: string, dateRange?: string) => Promise<any>;
    getWorkflowAnalytics: (workflowId: string, dateRange?: string) => Promise<any>;
};
export declare const messagingApi: {
    getMessages: (threadId?: string) => Promise<any>;
    getThreads: (filters?: any) => Promise<any>;
    sendMessage: (messageData: any) => Promise<any>;
    getTemplates: (filters?: any) => Promise<any>;
    createTemplate: (templateData: any) => Promise<any>;
    updateTemplate: (templateId: string, templateData: any) => Promise<any>;
    deleteTemplate: (templateId: string) => Promise<any>;
    getChannels: () => Promise<any>;
    createChannel: (channelData: any) => Promise<any>;
    updateChannel: (channelId: string, channelData: any) => Promise<any>;
    deleteChannel: (channelId: string) => Promise<any>;
    toggleChannel: (channelId: string, isActive: boolean) => Promise<any>;
    getWorkflows: () => Promise<any>;
    createWorkflow: (workflowData: any) => Promise<any>;
    updateWorkflow: (workflowId: string, workflowData: any) => Promise<any>;
    deleteWorkflow: (workflowId: string) => Promise<any>;
    toggleWorkflow: (workflowId: string, isActive: boolean) => Promise<any>;
    getCampaigns: (filters?: any) => Promise<any>;
    createCampaign: (campaignData: any) => Promise<any>;
    updateCampaign: (campaignId: string, campaignData: any) => Promise<any>;
    deleteCampaign: (campaignId: string) => Promise<any>;
    toggleCampaign: (campaignId: string, status: string) => Promise<any>;
    getCampaignAnalytics: (campaignId: string, dateRange?: string) => Promise<any>;
    getAIFeatures: () => Promise<any>;
    toggleAIFeature: (featureId: string, isEnabled: boolean) => Promise<any>;
    getAIInsights: (dateRange?: string) => Promise<any>;
};
export declare const reportingApi: {
    getCallStatusReport: (dateRange: {
        startDate: string;
        endDate: string;
    }) => Promise<any>;
    getAbandonRateReport: (dateRange: {
        startDate: string;
        endDate: string;
    }) => Promise<any>;
    getOutgoingCallReport: (dateRange: {
        startDate: string;
        endDate: string;
    }) => Promise<any>;
    getUserStatusReport: (dateRange: {
        startDate: string;
        endDate: string;
    }) => Promise<any>;
    getCallReport: (dateRange: {
        startDate: string;
        endDate: string;
    }, filters?: any) => Promise<any>;
    getCallDispositionReport: (dateRange: {
        startDate: string;
        endDate: string;
    }) => Promise<any>;
    getLeaderboard: (dateRange: {
        startDate: string;
        endDate: string;
    }, category?: string) => Promise<any>;
    getSMSMMSReport: (dateRange: {
        startDate: string;
        endDate: string;
    }) => Promise<any>;
    exportReport: (reportType: string, format: "pdf" | "csv" | "excel", params: any) => Promise<any>;
    generateReport: (reportConfig: any) => Promise<any>;
    getReportConfigs: () => Promise<any>;
    saveReportConfig: (config: any) => Promise<any>;
};
export default api;
