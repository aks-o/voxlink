import React, { useEffect, useState } from 'react';
import { useLiveMetrics, useAgentStatus } from '../../hooks/useRealtime';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  color 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  const changeColorClasses = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-gray-500'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${changeColorClasses[changeType]}`}>
                {changeType === 'increase' && '+'}
                {change}%
              </span>
              <span className="text-sm text-gray-500 ml-1">from last hour</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

interface AgentStatusGridProps {
  agentStatuses: any[];
}

const AgentStatusGrid: React.FC<AgentStatusGridProps> = ({ agentStatuses }) => {
  const getStatusCounts = () => {
    const counts = {
      online: 0,
      offline: 0,
      busy: 0,
      available: 0
    };

    agentStatuses.forEach(agent => {
      counts[agent.type as keyof typeof counts]++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  const statusItems = [
    { label: 'Available', count: statusCounts.available, color: 'bg-green-100 text-green-800' },
    { label: 'Busy', count: statusCounts.busy, color: 'bg-yellow-100 text-yellow-800' },
    { label: 'Online', count: statusCounts.online, color: 'bg-blue-100 text-blue-800' },
    { label: 'Offline', count: statusCounts.offline, color: 'bg-gray-100 text-gray-800' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Status</h3>
      <div className="grid grid-cols-2 gap-4">
        {statusItems.map(item => (
          <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.color}`}>
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface RealtimeMetricsProps {
  className?: string;
}

const RealtimeMetrics: React.FC<RealtimeMetricsProps> = ({ className = '' }) => {
  const { metrics, metricsHistory, subscribe, unsubscribe, isSubscribed } = useLiveMetrics();
  const { agentStatuses } = useAgentStatus();
  const [previousMetrics, setPreviousMetrics] = useState<any>(null);

  useEffect(() => {
    subscribe();
    return () => unsubscribe();
  }, [subscribe, unsubscribe]);

  useEffect(() => {
    if (metrics && metricsHistory.length > 1) {
      setPreviousMetrics(metricsHistory[1]);
    }
  }, [metrics, metricsHistory]);

  const calculateChange = (current: number, previous: number): { change: number; type: 'increase' | 'decrease' | 'neutral' } => {
    if (!previous || previous === 0) return { change: 0, type: 'neutral' };
    
    const change = ((current - previous) / previous) * 100;
    const type = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral';
    
    return { change: Math.abs(Math.round(change)), type };
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (!metrics) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading real-time metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  const activeCallsChange = previousMetrics ? calculateChange(metrics.activeCalls, previousMetrics.activeCalls) : { change: 0, type: 'neutral' as const };
  const queuedCallsChange = previousMetrics ? calculateChange(metrics.queuedCalls, previousMetrics.queuedCalls) : { change: 0, type: 'neutral' as const };
  const abandonRateChange = previousMetrics ? calculateChange(metrics.abandonRate, previousMetrics.abandonRate) : { change: 0, type: 'neutral' as const };

  return (
    <div className={className}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Real-time Metrics</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isSubscribed ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isSubscribed ? 'Live' : 'Disconnected'}
            </span>
            {metrics.timestamp && (
              <span className="text-sm text-gray-500">
                Updated: {new Date(metrics.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard
            title="Active Calls"
            value={metrics.activeCalls}
            change={activeCallsChange.change}
            changeType={activeCallsChange.type}
            color="blue"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            }
          />

          <MetricCard
            title="Queued Calls"
            value={metrics.queuedCalls}
            change={queuedCallsChange.change}
            changeType={queuedCallsChange.type}
            color="yellow"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <MetricCard
            title="Available Agents"
            value={metrics.availableAgents}
            color="green"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />

          <MetricCard
            title="Abandon Rate"
            value={formatPercentage(metrics.abandonRate)}
            change={abandonRateChange.change}
            changeType={abandonRateChange.type === 'increase' ? 'decrease' : abandonRateChange.type === 'decrease' ? 'increase' : 'neutral'}
            color="red"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Average Wait Time</span>
                <span className="text-sm font-bold text-gray-900">{formatTime(metrics.averageWaitTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Average Call Duration</span>
                <span className="text-sm font-bold text-gray-900">{formatTime(metrics.averageCallDuration)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Calls per Minute</span>
                <span className="text-sm font-bold text-gray-900">{metrics.callsPerMinute}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Busy Agents</span>
                <span className="text-sm font-bold text-gray-900">{metrics.busyAgents}</span>
              </div>
            </div>
          </div>

          <AgentStatusGrid agentStatuses={agentStatuses} />
        </div>
      </div>
    </div>
  );
};

export default RealtimeMetrics;