import React, { useState, useEffect } from 'react';
import { Calendar, Download, RefreshCw, Target, TrendingUp, BarChart3, CheckCircle, XCircle } from 'lucide-react';
import { CallDisposition } from '../../../shared/src/types/call-records';

interface CallDispositionData {
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalCalls: number;
  dispositionBreakdown: Record<CallDisposition, number>;
  dispositionTrends: {
    date: string;
    dispositions: Record<CallDisposition, number>;
  }[];
  agentDispositions: {
    agentId: string;
    agentName: string;
    dispositions: Record<CallDisposition, number>;
    totalCalls: number;
    successRate: number;
  }[];
  outcomeAnalysis: {
    successful: number;
    unsuccessful: number;
    followUpRequired: number;
    escalated: number;
  };
}

const CallDispositionReport: React.FC = () => {
  const [reportData, setReportData] = useState<CallDispositionData | null>(null);
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
      const mockData: CallDispositionData = {
        period: {
          startDate: new Date(dateRange.startDate),
          endDate: new Date(dateRange.endDate)
        },
        totalCalls: 3456,
        dispositionBreakdown: {
          answered: 2156,
          voicemail: 542,
          busy: 289,
          no_answer: 234,
          failed: 156,
          transferred: 67,
          callback_requested: 12
        },
        dispositionTrends: [
          {
            date: '2024-01-14',
            dispositions: {
              answered: 298, voicemail: 78, busy: 45, no_answer: 34, failed: 23, transferred: 12, callback_requested: 2
            }
          },
          {
            date: '2024-01-15',
            dispositions: {
              answered: 312, voicemail: 89, busy: 41, no_answer: 38, failed: 19, transferred: 8, callback_requested: 1
            }
          },
          {
            date: '2024-01-16',
            dispositions: {
              answered: 289, voicemail: 67, busy: 52, no_answer: 29, failed: 28, transferred: 11, callback_requested: 3
            }
          },
          {
            date: '2024-01-17',
            dispositions: {
              answered: 334, voicemail: 92, busy: 38, no_answer: 41, failed: 21, transferred: 9, callback_requested: 2
            }
          },
          {
            date: '2024-01-18',
            dispositions: {
              answered: 321, voicemail: 85, busy: 43, no_answer: 36, failed: 24, transferred: 13, callback_requested: 1
            }
          },
          {
            date: '2024-01-19',
            dispositions: {
              answered: 306, voicemail: 71, busy: 39, no_answer: 31, failed: 18, transferred: 7, callback_requested: 2
            }
          },
          {
            date: '2024-01-20',
            dispositions: {
              answered: 296, voicemail: 60, busy: 31, no_answer: 25, failed: 23, transferred: 7, callback_requested: 1
            }
          }
        ],
        agentDispositions: [
          {
            agentId: '1',
            agentName: 'Sarah Johnson',
            dispositions: {
              answered: 298, voicemail: 67, busy: 34, no_answer: 23, failed: 12, transferred: 8, callback_requested: 3
            },
            totalCalls: 445,
            successRate: 66.9
          },
          {
            agentId: '2',
            agentName: 'Mike Chen',
            dispositions: {
              answered: 267, voicemail: 78, busy: 41, no_answer: 29, failed: 18, transferred: 12, callback_requested: 2
            },
            totalCalls: 447,
            successRate: 59.7
          },
          {
            agentId: '3',
            agentName: 'Emily Davis',
            dispositions: {
              answered: 312, voicemail: 89, busy: 38, no_answer: 31, failed: 15, transferred: 9, callback_requested: 1
            },
            totalCalls: 495,
            successRate: 63.0
          },
          {
            agentId: '4',
            agentName: 'David Wilson',
            dispositions: {
              answered: 234, voicemail: 56, busy: 29, no_answer: 27, failed: 21, transferred: 6, callback_requested: 2
            },
            totalCalls: 375,
            successRate: 62.4
          }
        ],
        outcomeAnalysis: {
          successful: 2156, // answered calls
          unsuccessful: 679, // busy + no_answer + failed
          followUpRequired: 542, // voicemail
          escalated: 79 // transferred + callback_requested
        }
      };
      
      setReportData(mockData);
    } catch (error) {
      console.error('Failed to fetch call disposition report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: 'pdf' | 'csv' | 'excel') => {
    console.log(`Exporting call disposition report as ${format}`);
  };

  const getDispositionColor = (disposition: CallDisposition) => {
    switch (disposition) {
      case 'answered': return 'bg-green-100 text-green-800';
      case 'voicemail': return 'bg-blue-100 text-blue-800';
      case 'transferred': return 'bg-purple-100 text-purple-800';
      case 'callback_requested': return 'bg-indigo-100 text-indigo-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'no_answer': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDispositionIcon = (disposition: CallDisposition) => {
    switch (disposition) {
      case 'answered': return <CheckCircle className="w-4 h-4" />;
      case 'transferred': return <TrendingUp className="w-4 h-4" />;
      case 'callback_requested': return <Target className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  const formatDispositionName = (disposition: CallDisposition) => {
    return disposition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
          <h1 className="text-2xl font-bold text-gray-900">Call Disposition Report</h1>
          <p className="text-gray-600 mt-1">Track call outcomes and analyze conversation results</p>
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

      {/* Outcome Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Successful</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.outcomeAnalysis.successful.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Follow-up Required</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.outcomeAnalysis.followUpRequired.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Escalated</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.outcomeAnalysis.escalated.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unsuccessful</p>
              <p className="text-2xl font-semibold text-gray-900">{reportData?.outcomeAnalysis.unsuccessful.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Disposition Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Disposition Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportData && Object.entries(reportData.dispositionBreakdown).map(([disposition, count]) => (
            <div key={disposition} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getDispositionColor(disposition as CallDisposition)}`}>
                    {getDispositionIcon(disposition as CallDisposition)}
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    {formatDispositionName(disposition as CallDisposition)}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-semibold text-gray-900 mb-1">
                {count.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                {reportData ? ((count / reportData.totalCalls) * 100).toFixed(1) : 0}% of total
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Disposition Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Calls</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Answered</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voicemail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No Answer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transferred</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData?.agentDispositions.map((agent) => (
                <tr key={agent.agentId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{agent.agentName}</div>
                    <div className="text-sm text-gray-500">ID: {agent.agentId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.totalCalls}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.dispositions.answered}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.dispositions.voicemail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.dispositions.no_answer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.dispositions.transferred}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      agent.successRate >= 70 ? 'bg-green-100 text-green-800' : 
                      agent.successRate >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {agent.successRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Disposition Trends</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Answered</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voicemail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Busy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No Answer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Failed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData?.dispositionTrends.map((day) => {
                const totalCalls = Object.values(day.dispositions).reduce((sum, count) => sum + count, 0);
                const successRate = (day.dispositions.answered / totalCalls) * 100;
                
                return (
                  <tr key={day.date}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.dispositions.answered}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.dispositions.voicemail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.dispositions.busy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.dispositions.no_answer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.dispositions.failed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        successRate >= 70 ? 'bg-green-100 text-green-800' : 
                        successRate >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {successRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CallDispositionReport;