import React, { useState, useEffect } from 'react';
import { Calendar, Download, RefreshCw, PhoneOutgoing, DollarSign, Target, Users, TrendingUp } from 'lucide-react';
import { OutgoingCallReport as OutgoingCallReportType } from '../../../shared/src/types/call-records';

const OutgoingCallReport: React.FC = () => {
  const [reportData, setReportData] = useState<OutgoingCallReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockData: OutgoingCallReportType = {
        period: {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate)
        },
        totalOutboundCalls: 2156,
        successfulCalls: 1834,
        failedCalls: 322,
        successRate: 85.1,
        averageDuration: 195,
        totalCost: 1247.89,
        costPerCall: 0.58,
        campaignBreakdown: [
          {
            campaignId: '1',
            campaignName: 'Q1 Sales Outreach',
            callCount: 856,
            successRate: 87.3,
            averageDuration: 210,
            totalCost: 496.48,
            conversionRate: 23.4
          },
          {
            campaignId: '2',
            campaignName: 'Customer Follow-up',
            callCount: 634,
            successRate: 91.2,
            averageDuration: 165,
            totalCost: 367.72,
            conversionRate: 45.6
          },
          {
            campaignId: '3',
            campaignName: 'Lead Qualification',
            callCount: 456,
            successRate: 78.9,
            averageDuration: 185,
            totalCost: 264.48,
            conversionRate: 18.7
          },
          {
            campaignId: '4',
            campaignName: 'Product Demo Calls',
            callCount: 210,
            successRate: 89.5,
            averageDuration: 245,
            totalCost: 119.21,
            conversionRate: 67.8
          }
        ],
        agentPerformance: [
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
            onlineTime: 28800, // 8 hours in seconds
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
          }
        ]
      };
      
      setReportData(mockData);
    } catch (error) {
      console.error('Failed to fetch outgoing call report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    console.log(`Exporting outgoing call report as ${format}`);
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600 bg-green-100';
    if (rate >= 80) return 'text-blue-600 bg-blue-100';
    if (rate >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConversionRateColor = (rate: number) => {
    if (rate >= 50) return 'text-green-600 bg-green-100';
    if (rate >= 30) return 'text-blue-600 bg-blue-100';
    if (rate >= 20) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Outgoing Call Report</h1>
          <p className="text-gray-600 mt-1">Track outbound call performance and campaign effectiveness</p>
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <PhoneOutgoing className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Outbound</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.totalOutboundCalls.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.successRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-2xl font-semibold text-gray-900">{Math.round(reportData?.averageDuration || 0)}s</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-2xl font-semibold text-gray-900">${reportData?.totalCost.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calls</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData?.campaignBreakdown.map((campaign) => (
                <tr key={campaign.campaignId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{campaign.campaignName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.callCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSuccessRateColor(campaign.successRate)}`}>
                      {campaign.successRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(campaign.averageDuration)}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConversionRateColor(campaign.conversionRate)}`}>
                      {campaign.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${campaign.totalCost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Agents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportData?.agentPerformance.slice(0, 6).map((agent) => (
            <div key={agent.agentId} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">{agent.agentName}</h4>
                    <p className="text-sm text-gray-500">Rank #{agent.ranking}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  agent.efficiency >= 85 ? 'bg-green-100 text-green-800' : 
                  agent.efficiency >= 75 ? 'bg-blue-100 text-blue-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {agent.efficiency.toFixed(1)}%
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Calls:</span>
                  <span className="font-medium">{agent.totalCalls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Answer Rate:</span>
                  <span className="font-medium">{((agent.answeredCalls / agent.totalCalls) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Duration:</span>
                  <span className="font-medium">{Math.round(agent.averageCallDuration)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CSAT Score:</span>
                  <span className="font-medium">{agent.customerSatisfactionScore.toFixed(1)}</span>
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

      {/* Cost Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Cost</span>
              <span className="text-lg font-semibold text-gray-900">${reportData?.totalCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Cost per Call</span>
              <span className="text-sm font-semibold text-gray-900">${reportData?.costPerCall.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Cost per Successful Call</span>
              <span className="text-sm font-semibold text-gray-900">
                ${reportData ? (reportData.totalCost / reportData.successfulCalls).toFixed(2) : '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Cost per Minute</span>
              <span className="text-sm font-semibold text-gray-900">
                ${reportData ? (reportData.totalCost / ((reportData.totalOutboundCalls * reportData.averageDuration) / 60)).toFixed(3) : '0.000'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Successful Calls</span>
              <span className="text-lg font-semibold text-green-600">{reportData?.successfulCalls.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Failed Calls</span>
              <span className="text-lg font-semibold text-red-600">{reportData?.failedCalls.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total Talk Time</span>
              <span className="text-sm font-semibold text-gray-900">
                {reportData ? Math.round((reportData.successfulCalls * reportData.averageDuration) / 3600) : 0}h
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Active Campaigns</span>
              <span className="text-sm font-semibold text-gray-900">{reportData?.campaignBreakdown.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutgoingCallReport;