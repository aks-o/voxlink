import React, { useState, useEffect } from 'react';
import { Calendar, Download, RefreshCw, PhoneOff, TrendingUp, TrendingDown, AlertTriangle, Clock } from 'lucide-react';
import { AbandonRateReport as AbandonRateReportType } from '../../../shared/src/types/call-records';

const AbandonRateReport: React.FC = () => {
  const [reportData, setReportData] = useState<AbandonRateReportType | null>(null);
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
      const mockData: AbandonRateReportType = {
        period: {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate)
        },
        totalCalls: 3456,
        abandonedCalls: 487,
        abandonRate: 14.1,
        abandonReasons: {
          'Long wait time': 234,
          'System disconnect': 89,
          'Customer hangup': 156,
          'Technical issues': 8
        },
        abandonByWaitTime: [
          { waitTimeRange: '0-30s', callCount: 1234, abandonCount: 45, abandonRate: 3.6 },
          { waitTimeRange: '30-60s', callCount: 987, abandonCount: 89, abandonRate: 9.0 },
          { waitTimeRange: '1-2min', callCount: 756, abandonCount: 134, abandonRate: 17.7 },
          { waitTimeRange: '2-5min', callCount: 345, abandonCount: 156, abandonRate: 45.2 },
          { waitTimeRange: '5min+', callCount: 134, abandonCount: 63, abandonRate: 47.0 }
        ],
        trendData: [
          { date: '2024-01-14', value: 12.3, change: -1.2 },
          { date: '2024-01-15', value: 13.8, change: 1.5 },
          { date: '2024-01-16', value: 11.9, change: -1.9 },
          { date: '2024-01-17', value: 15.2, change: 3.3 },
          { date: '2024-01-18', value: 13.6, change: -1.6 },
          { date: '2024-01-19', value: 14.8, change: 1.2 },
          { date: '2024-01-20', value: 14.1, change: -0.7 }
        ],
        recommendations: [
          'Consider adding more agents during peak hours (2-4 PM)',
          'Implement callback functionality to reduce wait times',
          'Review IVR menu to reduce navigation time',
          'Add queue position announcements to manage expectations'
        ]
      };
      
      setReportData(mockData);
    } catch (error) {
      console.error('Failed to fetch abandon rate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    console.log(`Exporting abandon rate report as ${format}`);
  };

  const getAbandonRateColor = (rate: number) => {
    if (rate <= 5) return 'text-green-600 bg-green-100';
    if (rate <= 10) return 'text-yellow-600 bg-yellow-100';
    if (rate <= 20) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getTrendIcon = (change?: number) => {
    if (!change) return null;
    return change > 0 ? 
      <TrendingUp className="w-4 h-4 text-red-500" /> : 
      <TrendingDown className="w-4 h-4 text-green-500" />;
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
          <h1 className="text-2xl font-bold text-gray-900">Abandon Rate Report</h1>
          <p className="text-gray-600 mt-1">Monitor call abandonment patterns and identify improvement opportunities</p>
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
              <PhoneOff className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Calls</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.totalCalls.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <PhoneOff className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Abandoned</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.abandonedCalls.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              reportData && reportData.abandonRate <= 10 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                reportData && reportData.abandonRate <= 10 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Abandon Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.abandonRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Wait Time</p>
              <p className="text-2xl font-semibold text-gray-900">2.3m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Abandon Rate Trend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Abandon Rate Trend</h3>
        <div className="space-y-3">
          {reportData?.trendData.map((point, index) => (
            <div key={point.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">
                  {new Date(point.date).toLocaleDateString()}
                </span>
                {getTrendIcon(point.change)}
              </div>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAbandonRateColor(point.value)}`}>
                  {point.value.toFixed(1)}%
                </span>
                {point.change && (
                  <span className={`text-xs font-medium ${point.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {point.change > 0 ? '+' : ''}{point.change.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Abandon Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Abandon Reasons</h3>
          <div className="space-y-3">
            {reportData && Object.entries(reportData.abandonReasons).map(([reason, count]) => (
              <div key={reason} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{reason}</span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">{count.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({((count / reportData.abandonedCalls) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Abandon by Wait Time</h3>
          <div className="space-y-3">
            {reportData?.abandonByWaitTime.map((waitTime) => (
              <div key={waitTime.waitTimeRange} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{waitTime.waitTimeRange}</span>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAbandonRateColor(waitTime.abandonRate)}`}>
                    {waitTime.abandonRate.toFixed(1)}%
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {waitTime.abandonCount} of {waitTime.callCount} calls
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <div className="space-y-3">
          {reportData?.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-start p-3 bg-blue-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-gray-700">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AbandonRateReport;