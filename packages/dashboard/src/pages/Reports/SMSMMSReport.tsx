import React, { useState, useEffect } from 'react';
import { Calendar, Download, RefreshCw, MessageSquare, Send, Inbox, TrendingUp, Users, DollarSign } from 'lucide-react';

interface SMSMMSReportData {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalMessages: number;
  sentMessages: number;
  receivedMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  deliveryRate: number;
  totalCost: number;
  costPerMessage: number;
  messagesByType: {
    sms: number;
    mms: number;
  };
  messagesByDirection: {
    inbound: number;
    outbound: number;
  };
  dailyStats: {
    date: string;
    sent: number;
    received: number;
    delivered: number;
    failed: number;
    cost: number;
  }[];
  topNumbers: {
    number: string;
    messageCount: number;
    deliveryRate: number;
    cost: number;
  }[];
  campaignPerformance: {
    campaignId: string;
    campaignName: string;
    messagesSent: number;
    deliveryRate: number;
    responseRate: number;
    cost: number;
    roi: number;
  }[];
  hourlyDistribution: {
    hour: number;
    messageCount: number;
    deliveryRate: number;
  }[];
}

const SMSMMSReport: React.FC = () => {
  const [reportData, setReportData] = useState<SMSMMSReportData | null>(null);
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
      const mockData: SMSMMSReportData = {
        period: {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate)
        },
        totalMessages: 15678,
        sentMessages: 9234,
        receivedMessages: 6444,
        deliveredMessages: 8891,
        failedMessages: 343,
        deliveryRate: 96.3,
        totalCost: 1567.89,
        costPerMessage: 0.10,
        messagesByType: {
          sms: 14234,
          mms: 1444
        },
        messagesByDirection: {
          inbound: 6444,
          outbound: 9234
        },
        dailyStats: [
          { date: '2024-01-14', sent: 1234, received: 892, delivered: 1189, failed: 45, cost: 123.40 },
          { date: '2024-01-15', sent: 1345, received: 967, delivered: 1298, failed: 47, cost: 134.50 },
          { date: '2024-01-16', sent: 1189, received: 834, delivered: 1145, failed: 44, cost: 118.90 },
          { date: '2024-01-17', sent: 1456, received: 1023, delivered: 1401, failed: 55, cost: 145.60 },
          { date: '2024-01-18', sent: 1298, received: 945, delivered: 1251, failed: 47, cost: 129.80 },
          { date: '2024-01-19', sent: 1167, received: 889, delivered: 1124, failed: 43, cost: 116.70 },
          { date: '2024-01-20', sent: 1545, received: 894, delivered: 1483, failed: 62, cost: 154.50 }
        ],
        topNumbers: [
          { number: '+1-555-0123', messageCount: 1234, deliveryRate: 97.2, cost: 123.40 },
          { number: '+1-555-0124', messageCount: 1089, deliveryRate: 95.8, cost: 108.90 },
          { number: '+1-555-0125', messageCount: 967, deliveryRate: 98.1, cost: 96.70 },
          { number: '+1-555-0126', messageCount: 834, deliveryRate: 94.5, cost: 83.40 },
          { number: '+1-555-0127', messageCount: 756, deliveryRate: 96.7, cost: 75.60 }
        ],
        campaignPerformance: [
          {
            campaignId: '1',
            campaignName: 'Welcome Series',
            messagesSent: 2345,
            deliveryRate: 97.8,
            responseRate: 23.4,
            cost: 234.50,
            roi: 340.2
          },
          {
            campaignId: '2',
            campaignName: 'Flash Sale Alert',
            messagesSent: 1876,
            deliveryRate: 96.2,
            responseRate: 18.7,
            cost: 187.60,
            roi: 280.5
          },
          {
            campaignId: '3',
            campaignName: 'Appointment Reminders',
            messagesSent: 1567,
            deliveryRate: 98.9,
            responseRate: 45.6,
            cost: 156.70,
            roi: 520.8
          },
          {
            campaignId: '4',
            campaignName: 'Customer Survey',
            messagesSent: 1234,
            deliveryRate: 95.4,
            responseRate: 12.3,
            cost: 123.40,
            roi: 150.2
          }
        ],
        hourlyDistribution: [
          { hour: 9, messageCount: 456, deliveryRate: 96.8 },
          { hour: 10, messageCount: 567, deliveryRate: 97.2 },
          { hour: 11, messageCount: 634, deliveryRate: 96.5 },
          { hour: 12, messageCount: 423, deliveryRate: 95.9 },
          { hour: 13, messageCount: 389, deliveryRate: 94.8 },
          { hour: 14, messageCount: 678, deliveryRate: 97.8 },
          { hour: 15, messageCount: 589, deliveryRate: 96.9 },
          { hour: 16, messageCount: 512, deliveryRate: 96.1 },
          { hour: 17, messageCount: 445, deliveryRate: 95.7 }
        ]
      };
      
      setReportData(mockData);
    } catch (error) {
      console.error('Failed to fetch SMS/MMS report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    console.log(`Exporting SMS/MMS report as ${format}`);
  };

  const getDeliveryRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600 bg-green-100';
    if (rate >= 90) return 'text-blue-600 bg-blue-100';
    if (rate >= 85) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getResponseRateColor = (rate: number) => {
    if (rate >= 30) return 'text-green-600 bg-green-100';
    if (rate >= 20) return 'text-blue-600 bg-blue-100';
    if (rate >= 10) return 'text-yellow-600 bg-yellow-100';
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
          <h1 className="text-2xl font-bold text-gray-900">SMS/MMS Report</h1>
          <p className="text-gray-600 mt-1">Comprehensive messaging analytics and performance metrics</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.totalMessages.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.deliveryRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Messages Sent</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.sentMessages.toLocaleString()}</p>
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

      {/* Message Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Types</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                <span className="text-sm font-medium text-gray-700">SMS Messages</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">{reportData?.messagesByType.sms.toLocaleString()}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({reportData ? ((reportData.messagesByType.sms / reportData.totalMessages) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                <span className="text-sm font-medium text-gray-700">MMS Messages</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">{reportData?.messagesByType.mms.toLocaleString()}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({reportData ? ((reportData.messagesByType.mms / reportData.totalMessages) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Direction</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-500 rounded mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Outbound</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">{reportData?.messagesByDirection.outbound.toLocaleString()}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({reportData ? ((reportData.messagesByDirection.outbound / reportData.totalMessages) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-500 rounded mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Inbound</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">{reportData?.messagesByDirection.inbound.toLocaleString()}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({reportData ? ((reportData.messagesByDirection.inbound / reportData.totalMessages) * 100).toFixed(1) : 0}%)
                </span>
              </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages Sent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData?.campaignPerformance.map((campaign) => (
                <tr key={campaign.campaignId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{campaign.campaignName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.messagesSent.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDeliveryRateColor(campaign.deliveryRate)}`}>
                      {campaign.deliveryRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResponseRateColor(campaign.responseRate)}`}>
                      {campaign.responseRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${campaign.cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.roi.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Message Trends</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Failed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData?.dailyStats.map((day) => {
                const deliveryRate = (day.delivered / day.sent) * 100;
                
                return (
                  <tr key={day.date}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.sent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.received.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.delivered.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.failed.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDeliveryRateColor(deliveryRate)}`}>
                        {deliveryRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${day.cost.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performing Numbers & Hourly Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Numbers</h3>
          <div className="space-y-3">
            {reportData?.topNumbers.map((number, index) => (
              <div key={number.number} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{number.number}</p>
                  <p className="text-xs text-gray-500">{number.messageCount} messages • ${number.cost.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDeliveryRateColor(number.deliveryRate)}`}>
                    {number.deliveryRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Distribution</h3>
          <div className="space-y-3">
            {reportData?.hourlyDistribution.map((hour) => (
              <div key={hour.hour} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{hour.hour}:00</p>
                  <p className="text-xs text-gray-500">{hour.messageCount} messages</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDeliveryRateColor(hour.deliveryRate)}`}>
                    {hour.deliveryRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SMSMMSReport;