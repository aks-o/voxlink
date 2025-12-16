import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Phone, 
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Users,
  MapPin,
  Activity,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react';
import { analyticsApi } from '@services/api';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface CallStatisticsProps {
  dateRange: string;
}

interface CallStats {
  totalCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  missedCalls: number;
  averageDuration: number;
  totalDuration: number;
  answerRate: number;
  callTrends: {
    date: string;
    inbound: number;
    outbound: number;
    missed: number;
  }[];
  durationTrends: {
    date: string;
    averageDuration: number;
  }[];
  geographicDistribution: {
    country: string;
    region: string;
    calls: number;
    percentage: number;
  }[];
  peakHours: {
    hour: number;
    calls: number;
    averageDuration: number;
  }[];
  callQuality: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  topCallers: {
    number: string;
    calls: number;
    duration: number;
    lastCall: string;
  }[];
  realTimeStats: {
    activeCalls: number;
    callsToday: number;
    averageWaitTime: number;
    onlineAgents: number;
  };
}

const CallStatistics: React.FC<CallStatisticsProps> = ({ dateRange }) => {
  const [realTimeData, setRealTimeData] = useState<any>(null);

  const { data: callData, isLoading } = useQuery({
    queryKey: ['call-statistics', dateRange],
    queryFn: () => analyticsApi.getCallStatistics(dateRange),
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData({
        activeCalls: Math.floor(Math.random() * 10) + 1,
        callsToday: Math.floor(Math.random() * 50) + 100,
        averageWaitTime: Math.floor(Math.random() * 30) + 10,
        onlineAgents: Math.floor(Math.random() * 5) + 8,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const stats: CallStats = callData?.data || {
    totalCalls: 0,
    inboundCalls: 0,
    outboundCalls: 0,
    missedCalls: 0,
    averageDuration: 0,
    totalDuration: 0,
    answerRate: 0,
    callTrends: [],
    durationTrends: [],
    geographicDistribution: [],
    peakHours: [],
    callQuality: { excellent: 0, good: 0, fair: 0, poor: 0 },
    topCallers: [],
    realTimeStats: realTimeData || { activeCalls: 0, callsToday: 0, averageWaitTime: 0, onlineAgents: 0 }
  };

  const callTrendsData = {
    labels: stats.callTrends.map(item => format(parseISO(item.date), 'MMM dd')),
    datasets: [
      {
        label: 'Inbound Calls',
        data: stats.callTrends.map(item => item.inbound),
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Outbound Calls',
        data: stats.callTrends.map(item => item.outbound),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Missed Calls',
        data: stats.callTrends.map(item => item.missed),
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const peakHoursData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Calls per Hour',
        data: Array.from({ length: 24 }, (_, hour) => {
          const hourData = stats.peakHours.find(h => h.hour === hour);
          return hourData ? hourData.calls : 0;
        }),
        backgroundColor: 'rgba(37, 99, 235, 0.8)',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
    ],
  };

  const callQualityData = {
    labels: ['Excellent', 'Good', 'Fair', 'Poor'],
    datasets: [
      {
        data: [
          stats.callQuality.excellent,
          stats.callQuality.good,
          stats.callQuality.fair,
          stats.callQuality.poor,
        ],
        backgroundColor: [
          '#059669',
          '#0891B2',
          '#D97706',
          '#DC2626',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const geographicData = {
    labels: stats.geographicDistribution.map(item => `${item.region}, ${item.country}`),
    datasets: [
      {
        label: 'Calls by Location',
        data: stats.geographicDistribution.map(item => item.calls),
        backgroundColor: [
          '#2563EB',
          '#0891B2',
          '#059669',
          '#D97706',
          '#DC2626',
          '#7C3AED',
          '#DB2777',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getChangeIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    
    return (
      <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
        {Math.abs(change).toFixed(1)}%
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Dashboard */}
      <div className="card bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="card-title text-blue-900">Real-time Call Center</h3>
              <p className="card-subtitle text-blue-700">Live statistics and monitoring</p>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Live</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <Phone className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-green-600">{stats.realTimeStats.activeCalls}</p>
            <p className="text-sm text-green-700">Active Calls</p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <Activity className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-blue-600">{stats.realTimeStats.callsToday}</p>
            <p className="text-sm text-blue-700">Calls Today</p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <Clock className="w-8 h-8 mx-auto mb-2 text-amber-600" />
            <p className="text-2xl font-bold text-amber-600">{stats.realTimeStats.averageWaitTime}s</p>
            <p className="text-sm text-amber-700">Avg Wait Time</p>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <Users className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold text-purple-600">{stats.realTimeStats.onlineAgents}</p>
            <p className="text-sm text-purple-700">Online Agents</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate">Total Calls</p>
              <p className="text-2xl font-bold text-charcoal">{formatNumber(stats.totalCalls)}</p>
              {getChangeIndicator(stats.totalCalls, stats.totalCalls * 0.85)}
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate">Answer Rate</p>
              <p className="text-2xl font-bold text-charcoal">{stats.answerRate.toFixed(1)}%</p>
              {getChangeIndicator(stats.answerRate, stats.answerRate * 0.95)}
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <PhoneCall className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate">Avg Duration</p>
              <p className="text-2xl font-bold text-charcoal">{formatDuration(stats.averageDuration)}</p>
              {getChangeIndicator(stats.averageDuration, stats.averageDuration * 1.1)}
            </div>
            <div className="p-3 bg-teal-100 rounded-lg">
              <Clock className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate">Missed Calls</p>
              <p className="text-2xl font-bold text-charcoal">{formatNumber(stats.missedCalls)}</p>
              {getChangeIndicator(stats.missedCalls, stats.missedCalls * 1.2)}
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <PhoneIncoming className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Trends */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Call Volume Trends</h3>
            <p className="card-subtitle">Inbound, outbound, and missed calls over time</p>
          </div>
          <div className="h-64">
            <Line data={callTrendsData} options={chartOptions} />
          </div>
        </div>

        {/* Peak Hours */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Peak Hours Analysis</h3>
            <p className="card-subtitle">Call volume by hour of day</p>
          </div>
          <div className="h-64">
            <Bar data={peakHoursData} options={chartOptions} />
          </div>
        </div>

        {/* Call Quality */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Call Quality Distribution</h3>
            <p className="card-subtitle">Quality ratings for completed calls</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48">
              <Doughnut 
                data={callQualityData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Geographic Distribution</h3>
            <p className="card-subtitle">Calls by location</p>
          </div>
          <div className="h-64">
            <Bar data={geographicData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Callers */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Callers</h3>
            <p className="card-subtitle">Most frequent callers</p>
          </div>
          <div className="space-y-3">
            {stats.topCallers.slice(0, 5).map((caller, index) => (
              <div key={caller.number} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-voxlink-blue text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-charcoal">{caller.number}</p>
                    <p className="text-sm text-slate">
                      Last call: {format(parseISO(caller.lastCall), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-charcoal">{caller.calls} calls</p>
                  <p className="text-sm text-slate">{formatDuration(caller.duration)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call Direction Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Call Direction</h3>
            <p className="card-subtitle">Inbound vs Outbound breakdown</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <PhoneIncoming className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Inbound Calls</p>
                  <p className="text-sm text-green-700">{formatNumber(stats.inboundCalls)} calls</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {((stats.inboundCalls / stats.totalCalls) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <PhoneOutgoing className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Outbound Calls</p>
                  <p className="text-sm text-blue-700">{formatNumber(stats.outboundCalls)} calls</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {((stats.outboundCalls / stats.totalCalls) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallStatistics;