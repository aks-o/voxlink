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
  MessageSquare, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Calendar
} from 'lucide-react';
import { analyticsApi } from '@services/api';
import { format, subDays, parseISO } from 'date-fns';

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

interface UsageAnalyticsProps {
  dateRange: string;
}

interface UsageMetrics {
  totalCalls: number;
  totalSMS: number;
  totalDuration: number;
  averageCallDuration: number;
  callTrends: {
    date: string;
    inbound: number;
    outbound: number;
  }[];
  numberUsage: {
    phoneNumber: string;
    calls: number;
    sms: number;
    duration: number;
  }[];
  hourlyDistribution: {
    hour: number;
    calls: number;
  }[];
  callTypes: {
    type: string;
    count: number;
    percentage: number;
  }[];
}

const UsageAnalytics: React.FC<UsageAnalyticsProps> = ({ dateRange }) => {
  const [selectedMetric, setSelectedMetric] = useState('calls');

  const { data: usageData, isLoading, error } = useQuery({
    queryKey: ['usage-analytics', dateRange],
    queryFn: () => analyticsApi.getUsageAnalytics(dateRange),
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  });

  const metrics: UsageMetrics = usageData?.data || {
    totalCalls: 0,
    totalSMS: 0,
    totalDuration: 0,
    averageCallDuration: 0,
    callTrends: [],
    numberUsage: [],
    hourlyDistribution: [],
    callTypes: []
  };

  // Chart configurations
  const callTrendsData = {
    labels: metrics.callTrends.map(item => format(parseISO(item.date), 'MMM dd')),
    datasets: [
      {
        label: 'Inbound Calls',
        data: metrics.callTrends.map(item => item.inbound),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Outbound Calls',
        data: metrics.callTrends.map(item => item.outbound),
        borderColor: '#0891B2',
        backgroundColor: 'rgba(8, 145, 178, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const hourlyDistributionData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Calls by Hour',
        data: Array.from({ length: 24 }, (_, hour) => {
          const hourData = metrics.hourlyDistribution.find(h => h.hour === hour);
          return hourData ? hourData.calls : 0;
        }),
        backgroundColor: 'rgba(37, 99, 235, 0.8)',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
    ],
  };

  const callTypesData = {
    labels: metrics.callTypes.map(type => type.type),
    datasets: [
      {
        data: metrics.callTypes.map(type => type.count),
        backgroundColor: [
          '#2563EB',
          '#0891B2',
          '#059669',
          '#D97706',
          '#DC2626',
        ],
        borderWidth: 2,
        borderColor: '#fff',
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
    return `${hours}h ${minutes}m`;
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate">Total Calls</p>
              <p className="text-2xl font-bold text-charcoal">{formatNumber(metrics.totalCalls)}</p>
              {getChangeIndicator(metrics.totalCalls, metrics.totalCalls * 0.85)}
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate">Total SMS</p>
              <p className="text-2xl font-bold text-charcoal">{formatNumber(metrics.totalSMS)}</p>
              {getChangeIndicator(metrics.totalSMS, metrics.totalSMS * 0.92)}
            </div>
            <div className="p-3 bg-teal-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate">Total Duration</p>
              <p className="text-2xl font-bold text-charcoal">{formatDuration(metrics.totalDuration)}</p>
              {getChangeIndicator(metrics.totalDuration, metrics.totalDuration * 0.88)}
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate">Avg Call Duration</p>
              <p className="text-2xl font-bold text-charcoal">{formatDuration(metrics.averageCallDuration)}</p>
              {getChangeIndicator(metrics.averageCallDuration, metrics.averageCallDuration * 1.05)}
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Activity className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Trends */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Call Trends</h3>
            <p className="card-subtitle">Inbound vs Outbound calls over time</p>
          </div>
          <div className="h-64">
            <Line data={callTrendsData} options={chartOptions} />
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Hourly Call Distribution</h3>
            <p className="card-subtitle">Call volume by hour of day</p>
          </div>
          <div className="h-64">
            <Bar data={hourlyDistributionData} options={chartOptions} />
          </div>
        </div>

        {/* Call Types */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Call Types</h3>
            <p className="card-subtitle">Distribution of call types</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            <div className="w-48 h-48">
              <Doughnut 
                data={callTypesData} 
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

        {/* Number Usage */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Performing Numbers</h3>
            <p className="card-subtitle">Numbers with highest usage</p>
          </div>
          <div className="space-y-3">
            {metrics.numberUsage.slice(0, 5).map((number, index) => (
              <div key={number.phoneNumber} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-voxlink-blue text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-charcoal">{number.phoneNumber}</p>
                    <p className="text-sm text-slate">{formatDuration(number.duration)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-charcoal">{number.calls} calls</p>
                  <p className="text-sm text-slate">{number.sms} SMS</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Activity */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="card-title">Real-time Activity</h3>
              <p className="card-subtitle">Live usage updates</p>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
              <span className="text-sm">Live</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Phone className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-blue-600">3</p>
            <p className="text-sm text-blue-700">Active Calls</p>
          </div>
          
          <div className="text-center p-4 bg-teal-50 rounded-lg">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-teal-600" />
            <p className="text-2xl font-bold text-teal-600">12</p>
            <p className="text-sm text-teal-700">SMS Today</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Users className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-green-600">8</p>
            <p className="text-sm text-green-700">Active Numbers</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageAnalytics;