import React, { useState, useEffect } from 'react';
import { Calendar, Download, RefreshCw, Users, Clock, Award, TrendingUp, Star, Phone } from 'lucide-react';
import { UserStatusReport as UserStatusReportType } from '../../../shared/src/types/call-records';

const UserStatusReport: React.FC = () => {
  const [reportData, setReportData] = useState<UserStatusReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [sortBy, setSortBy] = useState<'efficiency' | 'totalCalls' | 'customerSatisfactionScore'>('efficiency');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockData: UserStatusReportType = {
        period: {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate)
        },
        agents: [
          {
            agentId: '1',
            agentName: 'Sarah Johnson',
            totalCalls: 345,
            answeredCalls: 298,
            averageCallDuration: 205,
            averageWrapUpTime: 45,
            customerSatisfactionScore: 4.6,
            firstCallResolutionRate: 78.5,
            transferRate: 12.3,
            onlineTime: 28800, // 8 hours
            availableTime: 25200, // 7 hours
            busyTime: 21600, // 6 hours
            breakTime: 3600, // 1 hour
            efficiency: 87.5,
            ranking: 1
          },
          {
            agentId: '2',
            agentName: 'Mike Chen',
            totalCalls: 312,
            answeredCalls: 267,
            averageCallDuration: 189,
            averageWrapUpTime: 52,
            customerSatisfactionScore: 4.3,
            firstCallResolutionRate: 72.1,
            transferRate: 15.7,
            onlineTime: 28800,
            availableTime: 24300,
            busyTime: 19800,
            breakTime: 4500,
            efficiency: 82.3,
            ranking: 2
          },
          {
            agentId: '3',
            agentName: 'Emily Davis',
            totalCalls: 289,
            answeredCalls: 251,
            averageCallDuration: 198,
            averageWrapUpTime: 38,
            customerSatisfactionScore: 4.8,
            firstCallResolutionRate: 81.2,
            transferRate: 9.8,
            onlineTime: 28800,
            availableTime: 26100,
            busyTime: 22500,
            breakTime: 2700,
            efficiency: 89.7,
            ranking: 3
          },
          {
            agentId: '4',
            agentName: 'David Wilson',
            totalCalls: 267,
            answeredCalls: 234,
            averageCallDuration: 176,
            averageWrapUpTime: 41,
            customerSatisfactionScore: 4.2,
            firstCallResolutionRate: 69.8,
            transferRate: 18.2,
            onlineTime: 28800,
            availableTime: 23400,
            busyTime: 18900,
            breakTime: 5400,
            efficiency: 79.1,
            ranking: 4
          },
          {
            agentId: '5',
            agentName: 'Lisa Rodriguez',
            totalCalls: 298,
            answeredCalls: 276,
            averageCallDuration: 212,
            averageWrapUpTime: 35,
            customerSatisfactionScore: 4.7,
            firstCallResolutionRate: 83.6,
            transferRate: 8.9,
            onlineTime: 28800,
            availableTime: 25920,
            busyTime: 23400,
            breakTime: 2880,
            efficiency: 91.2,
            ranking: 5
          },
          {
            agentId: '6',
            agentName: 'James Thompson',
            totalCalls: 234,
            answeredCalls: 198,
            averageCallDuration: 167,
            averageWrapUpTime: 48,
            customerSatisfactionScore: 4.1,
            firstCallResolutionRate: 65.4,
            transferRate: 21.3,
            onlineTime: 28800,
            availableTime: 22680,
            busyTime: 17280,
            breakTime: 6120,
            efficiency: 74.8,
            ranking: 6
          }
        ],
        teamMetrics: {
          totalAgents: 6,
          activeAgents: 6,
          averageOnlineTime: 28800,
          averageCallsPerAgent: 290.8,
          teamEfficiency: 84.1
        },
        topPerformers: [],
        improvementAreas: [
          'Reduce average wrap-up time across all agents',
          'Improve first call resolution rate for newer agents',
          'Provide additional training on complex issue handling',
          'Optimize break scheduling to maintain coverage'
        ]
      };

      // Sort top performers
      mockData.topPerformers = [...mockData.agents]
        .sort((a, b) => b.efficiency - a.efficiency)
        .slice(0, 3);

      setReportData(mockData);
    } catch (error) {
      console.error('Failed to fetch user status report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    console.log(`Exporting user status report as ${format}`);
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600 bg-green-100';
    if (efficiency >= 80) return 'text-blue-600 bg-blue-100';
    if (efficiency >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCSATColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-blue-600';
    if (score >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const sortedAgents = reportData?.agents.sort((a, b) => {
    switch (sortBy) {
      case 'efficiency':
        return b.efficiency - a.efficiency;
      case 'totalCalls':
        return b.totalCalls - a.totalCalls;
      case 'customerSatisfactionScore':
        return b.customerSatisfactionScore - a.customerSatisfactionScore;
      default:
        return 0;
    }
  }) || [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-voxlink-blue"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Status Report</h1>
          <p className="text-gray-600 mt-1">Monitor agent performance and team productivity</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchReportData}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-gray-400" />
            <select
              onChange={(e) => handleExport(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
              defaultValue=""
            >
              <option value="" disabled>Export</option>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
              <option value="excel">Excel</option>
            </select>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="efficiency">Efficiency</option>
              <option value="totalCalls">Total Calls</option>
              <option value="customerSatisfactionScore">CSAT Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Agents</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.teamMetrics.totalAgents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Team Efficiency</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.teamMetrics.teamEfficiency.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Calls/Agent</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.teamMetrics.averageCallsPerAgent.toFixed(0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Online Time</p>
              <p className="text-2xl font-semibold text-gray-900">{formatTime(reportData?.teamMetrics.averageOnlineTime || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reportData?.topPerformers.map((agent, index) => (
            <div key={agent.agentId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-gray-100' : 'bg-orange-100'
                  }`}>
                    {index === 0 ? (
                      <Award className="w-4 h-4 text-yellow-600" />
                    ) : (
                      <Star className={`w-4 h-4 ${index === 1 ? 'text-gray-600' : 'text-orange-600'}`} />
                    )}
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">{agent.agentName}</h4>
                    <p className="text-sm text-gray-500">#{index + 1} Performer</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Efficiency:</span>
                  <span className={`font-medium ${getEfficiencyColor(agent.efficiency).split(' ')[0]}`}>
                    {agent.efficiency.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CSAT Score:</span>
                  <span className={`font-medium ${getCSATColor(agent.customerSatisfactionScore)}`}>
                    {agent.customerSatisfactionScore.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Calls:</span>
                  <span className="font-medium">{agent.totalCalls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">FCR Rate:</span>
                  <span className="font-medium">{agent.firstCallResolutionRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Performance Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calls</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Answer Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CSAT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FCR Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Online Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAgents.map((agent) => (
                <tr key={agent.agentId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{agent.agentName}</div>
                        <div className="text-sm text-gray-500">ID: {agent.agentId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.totalCalls}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {((agent.answeredCalls / agent.totalCalls) * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(agent.averageCallDuration)}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getCSATColor(agent.customerSatisfactionScore)}`}>
                      {agent.customerSatisfactionScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.firstCallResolutionRate.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEfficiencyColor(agent.efficiency)}`}>
                      {agent.efficiency.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(agent.onlineTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Improvement Areas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Improvement Areas</h3>
        <div className="space-y-3">
          {reportData?.improvementAreas.map((area, index) => (
            <div key={index} className="flex items-start p-3 bg-yellow-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-gray-700">{area}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserStatusReport;