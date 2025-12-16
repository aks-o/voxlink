import React, { useState, useEffect } from 'react';
import { Calendar, Download, RefreshCw, Phone, Filter, BarChart3, TrendingUp, Clock, Users } from 'lucide-react';
import { CallAnalytics, CallRecord, CallDirection, CallStatus } from '../../../shared/src/types/call-records';

const CallReport: React.FC = () => {
  const [reportData, setReportData] = useState<CallAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    direction: 'all' as 'all' | CallDirection,
    status: 'all' as 'all' | CallStatus,
    agentId: 'all'
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange, filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockData: CallAnalytics = {
        totalCalls: 4523,
        inboundCalls: 2847,
        outboundCalls: 1676,
        answeredCalls: 3891,
        abandonedCalls: 632,
        averageDuration: 187,
        averageWaitTime: 23,
        answerRate: 86.0,
        abandonRate: 14.0,
        totalDuration: 728037, // in seconds
        totalCost: 2156.78,
        peakHours: [
          { hour: 9, callCount: 245, averageDuration: 180, answerRate: 0.85 },
          { hour: 10, callCount: 312, averageDuration: 195, answerRate: 0.88 },
          { hour: 11, callCount: 298, averageDuration: 172, answerRate: 0.82 },
          { hour: 12, callCount: 189, averageDuration: 165, answerRate: 0.79 },
          { hour: 13, callCount: 156, averageDuration: 158, answerRate: 0.76 },
          { hour: 14, callCount: 356, averageDuration: 201, answerRate: 0.91 },
          { hour: 15, callCount: 289, averageDuration: 188, answerRate: 0.87 },
          { hour: 16, callCount: 267, averageDuration: 192, answerRate: 0.84 },
          { hour: 17, callCount: 198, averageDuration: 175, answerRate: 0.81 }
        ],
        dailyStats: [
          {
            date: '2024-01-14',
            callCount: 645,
            inboundCount: 398,
            outboundCount: 247,
            averageDuration: 182,
            answerRate: 0.84,
            abandonRate: 0.16,
            totalCost: 298.45
          },
          {
            date: '2024-01-15',
            callCount: 678,
            inboundCount: 423,
            outboundCount: 255,
            averageDuration: 189,
            answerRate: 0.87,
            abandonRate: 0.13,
            totalCost: 312.67
          },
          {
            date: '2024-01-16',
            callCount: 592,
            inboundCount: 367,
            outboundCount: 225,
            averageDuration: 175,
            answerRate: 0.82,
            abandonRate: 0.18,
            totalCost: 273.89
          },
          {
            date: '2024-01-17',
            callCount: 734,
            inboundCount: 456,
            outboundCount: 278,
            averageDuration: 195,
            answerRate: 0.89,
            abandonRate: 0.11,
            totalCost: 339.12
          },
          {
            date: '2024-01-18',
            callCount: 689,
            inboundCount: 412,
            outboundCount: 277,
            averageDuration: 188,
            answerRate: 0.86,
            abandonRate: 0.14,
            totalCost: 318.45
          },
          {
            date: '2024-01-19',
            callCount: 612,
            inboundCount: 389,
            outboundCount: 223,
            averageDuration: 179,
            answerRate: 0.83,
            abandonRate: 0.17,
            totalCost: 283.67
          },
          {
            date: '2024-01-20',
            callCount: 573,
            inboundCount: 402,
            outboundCount: 171,
            averageDuration: 192,
            answerRate: 0.88,
            abandonRate: 0.12,
            totalCost: 330.53
          }
        ]
      };
      
      setReportData(mockData);
    } catch (error) {
      console.error('Failed to fetch call report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    console.log(`Exporting call report as ${format}`);
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

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
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
          <h1 className="text-2xl font-bold text-gray-900">Call Report</h1>
          <p className="text-gray-600 mt-1">Comprehensive call analytics and performance metrics</p>
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
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
          
          <div className="flex items-center space-x-4">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filters.direction}
              onChange={(e) => setFilters(prev => ({ ...prev, direction: e.target.value as any }))}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="all">All Directions</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
              className="text-sm border border-gray-300 rounded-md px-3 py-1"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
              <option value="failed">Failed</option>
              <option value="busy">Busy</option>
              <option value="no_answer">No Answer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Calls</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.totalCalls.toLocaleString()}</p>
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
              <p className="text-2xl font-semibold text-gray-900">{reportData?.answerRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
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
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Duration</p>
              <p className="text-2xl font-semibold text-gray-900">{formatTotalDuration(reportData?.totalDuration || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call Volume Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Volume by Direction</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Inbound Calls</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">{reportData?.inboundCalls.toLocaleString()}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({reportData ? ((reportData.inboundCalls / reportData.totalCalls) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Outbound Calls</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">{reportData?.outboundCalls.toLocaleString()}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({reportData ? ((reportData.outboundCalls / reportData.totalCalls) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Outcomes</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Answered</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">{reportData?.answeredCalls.toLocaleString()}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({reportData ? ((reportData.answeredCalls / reportData.totalCalls) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Abandoned</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">{reportData?.abandonedCalls.toLocaleString()}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({reportData ? ((reportData.abandonedCalls / reportData.totalCalls) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Call Trends</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Calls</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inbound</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outbound</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Answer Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData?.dailyStats.map((day) => (
                <tr key={day.date}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.callCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.inboundCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.outboundCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      day.answerRate >= 0.85 ? 'bg-green-100 text-green-800' : 
                      day.answerRate >= 0.75 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {(day.answerRate * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(day.averageDuration)}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${day.totalCost.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Peak Hours Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportData?.peakHours.map((hour) => (
            <div key={hour.hour} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-gray-900">{hour.hour}:00</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  hour.answerRate >= 0.85 ? 'bg-green-100 text-green-800' : 
                  hour.answerRate >= 0.75 ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {(hour.answerRate * 100).toFixed(1)}%
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Calls:</span>
                  <span className="font-medium">{hour.callCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Duration:</span>
                  <span className="font-medium">{Math.round(hour.averageDuration)}s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CallReport;