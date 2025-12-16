import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  DollarSign, 
  Phone, 
  TrendingUp,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneCall,
  UserCheck,
  FileText,
  Trophy,
  MessageSquare
} from 'lucide-react';
import UsageAnalytics from './UsageAnalytics';
import CostTracking from './CostTracking';
import CallStatistics from './CallStatistics';
import ReportsExport from './ReportsExport';
import CallStatusReport from '../Reports/CallStatusReport';

const Analytics: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('usage');
  const [dateRange, setDateRange] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // If we're on a specific report route, render that report
  if (location.pathname.includes('/call-status')) {
    return <CallStatusReport />;
  }
  if (location.pathname.includes('/abandon-rate')) {
    return <div className="p-6"><h1 className="text-2xl font-bold">Abandon Rate Report - Coming Soon</h1></div>;
  }
  if (location.pathname.includes('/outgoing-calls')) {
    return <div className="p-6"><h1 className="text-2xl font-bold">Outgoing Call Report - Coming Soon</h1></div>;
  }
  if (location.pathname.includes('/user-status')) {
    return <div className="p-6"><h1 className="text-2xl font-bold">User Status Report - Coming Soon</h1></div>;
  }
  if (location.pathname.includes('/call-disposition')) {
    return <div className="p-6"><h1 className="text-2xl font-bold">Call Disposition Report - Coming Soon</h1></div>;
  }
  if (location.pathname.includes('/leaderboard')) {
    return <div className="p-6"><h1 className="text-2xl font-bold">Leader Board - Coming Soon</h1></div>;
  }
  if (location.pathname.includes('/sms-mms')) {
    return <div className="p-6"><h1 className="text-2xl font-bold">SMS/MMS Report - Coming Soon</h1></div>;
  }

  // If we're at the base analytics route, show overview
  if (location.pathname === '/analytics') {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
          <p className="text-gray-600">Comprehensive insights and detailed reports</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Calls Today</p>
                <p className="text-2xl font-semibold text-gray-900">2,847</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Answer Rate</p>
                <p className="text-2xl font-semibold text-gray-900">87.3%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-semibold text-gray-900">3m 12s</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">SMS Sent</p>
                <p className="text-2xl font-semibold text-gray-900">1,456</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/analytics/call-status'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <PhoneIncoming className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Call Status Report</h3>
            </div>
            <p className="text-gray-600 text-sm">Detailed analysis of call statuses, completion rates, and performance metrics.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/analytics/abandon-rate'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <PhoneOutgoing className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Abandon Rate Report</h3>
            </div>
            <p className="text-gray-600 text-sm">Track call abandonment patterns and identify optimization opportunities.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/analytics/outgoing-calls'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <PhoneCall className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Outgoing Call Report</h3>
            </div>
            <p className="text-gray-600 text-sm">Monitor outbound call performance, success rates, and campaign effectiveness.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/analytics/user-status'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">User Status Report</h3>
            </div>
            <p className="text-gray-600 text-sm">Analyze agent performance, availability, and productivity metrics.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/analytics/calls'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Call Report</h3>
            </div>
            <p className="text-gray-600 text-sm">General call analytics with customizable filters and date ranges.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/analytics/call-disposition'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Call Disposition Report</h3>
            </div>
            <p className="text-gray-600 text-sm">Track call outcomes and disposition codes for quality analysis.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/analytics/leaderboard'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">Leader Board</h3>
            </div>
            <p className="text-gray-600 text-sm">Agent performance rankings and gamification metrics.</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => window.location.href = '/analytics/sms-mms'}>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="ml-4 text-lg font-semibold text-gray-900">SMS/MMS Report</h3>
            </div>
            <p className="text-gray-600 text-sm">Messaging analytics with delivery rates and engagement metrics.</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'usage', label: 'Usage Analytics', icon: BarChart3 },
    { id: 'costs', label: 'Cost Tracking', icon: DollarSign },
    { id: 'calls', label: 'Call Statistics', icon: Phone },
    { id: 'reports', label: 'Reports & Export', icon: Download }
  ];

  const dateRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' },
    { value: 'custom', label: 'Custom range' }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Analytics & Reporting</h1>
          <p className="text-slate mt-1">
            Comprehensive insights into your virtual number usage and costs
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input text-sm"
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-voxlink-blue text-voxlink-blue'
                    : 'border-transparent text-slate hover:text-charcoal hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'usage' && <UsageAnalytics dateRange={dateRange} />}
        {activeTab === 'costs' && <CostTracking dateRange={dateRange} />}
        {activeTab === 'calls' && <CallStatistics dateRange={dateRange} />}
        {activeTab === 'reports' && <ReportsExport dateRange={dateRange} />}
      </div>

      {/* Routes for nested pages */}
      <Routes>
        <Route path="usage" element={<UsageAnalytics dateRange={dateRange} />} />
        <Route path="costs" element={<CostTracking dateRange={dateRange} />} />
        <Route path="calls" element={<CallStatistics dateRange={dateRange} />} />
        <Route path="reports" element={<ReportsExport dateRange={dateRange} />} />
      </Routes>
    </div>
  );
};

export default Analytics;