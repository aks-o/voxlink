import React, { useState, useEffect } from 'react';
import { Calendar, Download, Filter, RefreshCw, Phone, TrendingUp, TrendingDown } from 'lucide-react';
import { CallStatusReport as CallStatusReportType, CallRecord } from '../../../shared/src/types/call-records';

const CallStatusReport: React.FC = () => {
  const [reportData, setReportData] = useState<CallStatusReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // TODO: Fetch report data from API
    const mockData: CallStatusReportType = {
      period: {
        startDate: new Date(dateRange.startDate),
        endDate: new Date(dateRange.endDate)
      },
      totalCalls: 2847,
      callsByStatus: {
        completed: 2156,
        abandoned: 342,
        failed: 198,
        busy: 89,
        no_answer: 62,
        in_progress: 0
      },
      callsByDisposition: {
        answered: 2156,
        voicemail: 342,
        busy: 89,
        no_answer: 62,
        failed: 198,
        transferred: 156,
        callback_requested: 44
      },
      hourlyDistribution: [
        { hour: 9, callCount: 245, averageDuration: 180, answerRate: 0.85 },
        { hour: 10, callCount: 312, averageDuration: 195, answerRate: 0.88 },
        { hour: 11, callCount: 298, averageDuration: 172, answerRate: 0.82 },
        { hour: 14, callCount: 356, averageDuration: 201, answerRate: 0.91 },
        { hour: 15, callCount: 289, averageDuration: 188, answerRate: 0.87 }
      ],
      topNumbers: [
        { number: '+1-555-0123', callCount: 89, totalDuration: 15840, averageDuration: 178, answerRate: 0.89 },
        { number: '+1-555-0124', callCount: 76, totalDuration: 13680, averageDuration: 180, answerRate: 0.85 },
        { number: '+1-555-0125', callCount: 65, totalDuration: 11700, averageDuration: 180, answerRate: 0.92 }
      ],
      averageMetrics: {
        duration: 187,
        waitTime: 23,
        answerTime: 8
      }
    };

    setReportData(mockData);
    setLoading(false);
  }, [dateRange]);

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    // TODO: Implement export functionality
    console.log(`Exporting report as ${format}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'abandoned': return 'text-red-600';
      case 'failed': return 'text-red-600';
      case 'busy': return 'text-yellow-600';
      case 'no_answer': return 'text-gray-600';
      default: return 'text-gray-600';
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Call Status Report</h1>
          <p className="text-gray-600 mt-1">Detailed analysis of call statuses and performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.location.reload()}
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
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.callsByStatus.completed.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Abandoned</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.callsByStatus.abandoned.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Duration</p>
              <p className="text-2xl font-semibold text-gray-900">{Math.round(reportData?.averageMetrics.duration || 0)}s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Calls by Status</h3>
          <div className="space-y-3">
            {reportData && Object.entries(reportData.callsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(status).replace('text-', 'bg-')}`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">{count.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({((count / reportData.totalCalls) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Numbers</h3>
          <div className="space-y-3">
            {reportData?.topNumbers.map((number, index) => (
              <div key={number.number} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{number.number}</p>
                  <p className="text-xs text-gray-500">{number.callCount} calls • {(number.answerRate * 100).toFixed(1)}% answer rate</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{Math.round(number.totalDuration / 60)}m</p>
                  <p className="text-xs text-gray-500">total duration</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Call Distribution</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hour</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Call Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Answer Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData?.hourlyDistribution.map((hour) => (
                <tr key={hour.hour}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {hour.hour}:00
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {hour.callCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(hour.averageDuration)}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      hour.answerRate >= 0.8 ? 'bg-green-100 text-green-800' : 
                      hour.answerRate >= 0.6 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {(hour.answerRate * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CallStatusReport;