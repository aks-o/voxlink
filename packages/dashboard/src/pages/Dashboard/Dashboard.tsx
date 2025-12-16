import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Users, 
  TrendingUp, 
  Clock,
  MessageSquare,
  Activity
} from 'lucide-react';
import MetricCard from '@components/Dashboard/MetricCard';
import CallChart from '@components/Dashboard/CallChart';
import RecentActivity from '@components/Dashboard/RecentActivity';
import TopPerformers from '@components/Dashboard/TopPerformers';
import LiveCalls from '@components/Dashboard/LiveCalls';
import RealtimeMetrics from '@components/Dashboard/RealtimeMetrics';
import LiveCallMonitoring from '@components/Dashboard/LiveCallMonitoring';
import RealtimeNotifications from '@components/Dashboard/RealtimeNotifications';
import { useAnalytics } from '@utils/analytics';
import { useRealtime } from '../../hooks/useRealtime';
import { dashboardApi } from '@services/api';

const Dashboard: React.FC = () => {
  const { page } = useAnalytics();
  const { isConnected, connectionStatus } = useRealtime();

  // Fetch dashboard data
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: dashboardApi.getMetrics,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: dashboardApi.getRecentActivity,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: liveCalls } = useQuery({
    queryKey: ['live-calls'],
    queryFn: dashboardApi.getLiveCalls,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  useEffect(() => {
    page('Dashboard');
  }, [page]);

  if (metricsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const defaultMetrics = {
    totalInboundCalls: 1247,
    totalOutboundCalls: 892,
    totalAgentsCalled: 24,
    bestPerformer: 'Sarah Johnson',
    callDuration: 156,
    smsCount: 342,
    activeNumbers: 12,
    uptime: 99.9,
  };

  const currentMetrics = metrics || defaultMetrics;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Dashboard</h1>
          <p className="text-slate mt-1">
            Welcome back! Here's what's happening with your VoxLink system.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="flex items-center space-x-4 text-sm text-slate">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>System Status: </span>
              <span className="text-success-green font-medium">All Systems Operational</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-success-green' : 'bg-red-400'}`}></div>
              <span>Real-time: </span>
              <span className={`font-medium ${isConnected ? 'text-success-green' : 'text-red-600'}`}>
                {connectionStatus === 'connected' ? 'Connected' : 
                 connectionStatus === 'connecting' ? 'Connecting...' : 
                 connectionStatus === 'error' ? 'Error' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Inbound Calls"
          value={currentMetrics.totalInboundCalls.toLocaleString()}
          change="+12.5%"
          changeType="positive"
          icon={PhoneIncoming}
          color="blue"
        />
        <MetricCard
          title="Total Outbound Calls"
          value={currentMetrics.totalOutboundCalls.toLocaleString()}
          change="+8.2%"
          changeType="positive"
          icon={PhoneOutgoing}
          color="teal"
        />
        <MetricCard
          title="Total Agents Called"
          value={currentMetrics.totalAgentsCalled.toString()}
          change="+2"
          changeType="positive"
          icon={Users}
          color="green"
        />
        <MetricCard
          title="Best Performer"
          value={currentMetrics.bestPerformer}
          change="156 calls"
          changeType="neutral"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Avg Call Duration"
          value={`${Math.floor(currentMetrics.callDuration / 60)}:${(currentMetrics.callDuration % 60).toString().padStart(2, '0')}`}
          change="-5.3%"
          changeType="negative"
          icon={Clock}
          color="slate"
          small
        />
        <MetricCard
          title="SMS Messages"
          value={currentMetrics.smsCount.toLocaleString()}
          change="+23.1%"
          changeType="positive"
          icon={MessageSquare}
          color="slate"
          small
        />
        <MetricCard
          title="Active Numbers"
          value={currentMetrics.activeNumbers.toString()}
          change="No change"
          changeType="neutral"
          icon={Phone}
          color="slate"
          small
        />
        <MetricCard
          title="System Uptime"
          value={`${currentMetrics.uptime}%`}
          change="+0.1%"
          changeType="positive"
          icon={Activity}
          color="slate"
          small
        />
      </div>

      {/* Real-time Metrics */}
      <RealtimeMetrics className="mb-6" />

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Call Analytics Chart */}
        <div className="lg:col-span-2">
          <CallChart />
        </div>

        {/* Live Calls */}
        <div>
          <LiveCalls calls={liveCalls} />
        </div>
      </div>

      {/* Real-time Monitoring and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Call Monitoring */}
        <LiveCallMonitoring />

        {/* Real-time Notifications */}
        <RealtimeNotifications />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <RecentActivity activities={recentActivity} />

        {/* Top Performers */}
        <TopPerformers />
      </div>
    </div>
  );
};

export default Dashboard;