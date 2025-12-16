import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  Download, 
  FileText, 
  Calendar, 
  Filter,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  BarChart3,
  DollarSign,
  Phone,
  MessageSquare,
  Settings,
  Share,
  Plus
} from 'lucide-react';
import { analyticsApi } from '@services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface ReportsExportProps {
  dateRange: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  type: 'usage' | 'cost' | 'calls' | 'custom';
  formats: string[];
  estimatedSize: string;
}

interface ExportJob {
  id: string;
  reportName: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  fileSize?: string;
}

const ReportsExport: React.FC<ReportsExportProps> = ({ dateRange }) => {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [customFilters, setCustomFilters] = useState({
    includeCallDetails: true,
    includeCostBreakdown: true,
    includeUsageMetrics: true,
    includeCharts: true,
    groupBy: 'day',
    phoneNumbers: [] as string[],
  });
  const [emailDelivery, setEmailDelivery] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [scheduledReports, setScheduledReports] = useState(false);

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'usage-summary',
      name: 'Usage Summary Report',
      description: 'Comprehensive overview of call and SMS usage',
      icon: BarChart3,
      type: 'usage',
      formats: ['pdf', 'excel', 'csv'],
      estimatedSize: '2-5 MB'
    },
    {
      id: 'cost-analysis',
      name: 'Cost Analysis Report',
      description: 'Detailed cost breakdown and billing analysis',
      icon: DollarSign,
      type: 'cost',
      formats: ['pdf', 'excel'],
      estimatedSize: '1-3 MB'
    },
    {
      id: 'call-details',
      name: 'Call Detail Records (CDR)',
      description: 'Individual call records with timestamps and durations',
      icon: Phone,
      type: 'calls',
      formats: ['csv', 'excel', 'json'],
      estimatedSize: '5-20 MB'
    },
    {
      id: 'sms-logs',
      name: 'SMS Activity Report',
      description: 'SMS sending and receiving logs',
      icon: MessageSquare,
      type: 'usage',
      formats: ['csv', 'excel'],
      estimatedSize: '1-5 MB'
    },
    {
      id: 'performance-metrics',
      name: 'Performance Metrics',
      description: 'KPIs, answer rates, and quality metrics',
      icon: BarChart3,
      type: 'calls',
      formats: ['pdf', 'excel'],
      estimatedSize: '2-4 MB'
    },
    {
      id: 'custom-report',
      name: 'Custom Report',
      description: 'Build your own report with custom filters',
      icon: Settings,
      type: 'custom',
      formats: ['pdf', 'excel', 'csv'],
      estimatedSize: 'Variable'
    }
  ];

  const [exportJobs, setExportJobs] = useState<ExportJob[]>([
    {
      id: '1',
      reportName: 'Usage Summary Report',
      format: 'PDF',
      status: 'completed',
      createdAt: '2024-01-15T10:30:00Z',
      completedAt: '2024-01-15T10:32:00Z',
      downloadUrl: '#',
      fileSize: '3.2 MB'
    },
    {
      id: '2',
      reportName: 'Call Detail Records',
      format: 'Excel',
      status: 'processing',
      createdAt: '2024-01-15T11:00:00Z',
    },
    {
      id: '3',
      reportName: 'Cost Analysis Report',
      format: 'PDF',
      status: 'failed',
      createdAt: '2024-01-15T09:15:00Z',
    }
  ]);

  const exportMutation = useMutation({
    mutationFn: async (exportData: any) => {
      return analyticsApi.exportReport(exportData);
    },
    onSuccess: (data) => {
      toast.success('Report export started successfully');
      // Add new job to the list
      const newJob: ExportJob = {
        id: Date.now().toString(),
        reportName: reportTemplates.find(t => t.id === selectedReport)?.name || 'Custom Report',
        format: selectedFormat.toUpperCase(),
        status: 'processing',
        createdAt: new Date().toISOString(),
      };
      setExportJobs(prev => [newJob, ...prev]);
    },
    onError: () => {
      toast.error('Failed to start report export');
    },
  });

  const handleExport = () => {
    if (!selectedReport) {
      toast.error('Please select a report template');
      return;
    }

    const exportData = {
      reportId: selectedReport,
      format: selectedFormat,
      dateRange,
      filters: customFilters,
      emailDelivery,
      recipientEmail: emailDelivery ? recipientEmail : undefined,
    };

    exportMutation.mutate(exportData);
  };

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedTemplate = reportTemplates.find(t => t.id === selectedReport);

  return (
    <div className="space-y-6">
      {/* Report Templates */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Report Templates</h3>
          <p className="card-subtitle">Choose a pre-built report or create a custom one</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <div
                key={template.id}
                onClick={() => setSelectedReport(template.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedReport === template.id
                    ? 'border-voxlink-blue bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    selectedReport === template.id ? 'bg-voxlink-blue text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-charcoal">{template.name}</h4>
                    <p className="text-sm text-slate mt-1">{template.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex space-x-1">
                        {template.formats.map((format) => (
                          <span key={format} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {format.toUpperCase()}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-slate">{template.estimatedSize}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Configuration */}
      {selectedReport && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Export Configuration</h3>
            <p className="card-subtitle">Customize your report export settings</p>
          </div>
          
          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Export Format
              </label>
              <div className="flex space-x-3">
                {selectedTemplate?.formats.map((format) => (
                  <label key={format} className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value={format}
                      checked={selectedFormat === format}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">{format.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Filters for Custom Report */}
            {selectedReport === 'custom-report' && (
              <div className="border-t pt-6">
                <h4 className="font-medium text-charcoal mb-4">Custom Filters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Include Sections
                    </label>
                    <div className="space-y-2">
                      {[
                        { key: 'includeCallDetails', label: 'Call Details' },
                        { key: 'includeCostBreakdown', label: 'Cost Breakdown' },
                        { key: 'includeUsageMetrics', label: 'Usage Metrics' },
                        { key: 'includeCharts', label: 'Charts & Graphs' },
                      ].map((option) => (
                        <label key={option.key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={customFilters[option.key as keyof typeof customFilters] as boolean}
                            onChange={(e) => setCustomFilters(prev => ({
                              ...prev,
                              [option.key]: e.target.checked
                            }))}
                            className="mr-2"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Group Data By
                    </label>
                    <select
                      value={customFilters.groupBy}
                      onChange={(e) => setCustomFilters(prev => ({ ...prev, groupBy: e.target.value }))}
                      className="input"
                    >
                      <option value="hour">Hour</option>
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Email Delivery */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium text-charcoal">Email Delivery</h4>
                  <p className="text-sm text-slate">Send the report directly to your email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailDelivery}
                    onChange={(e) => setEmailDelivery(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-voxlink-blue"></div>
                </label>
              </div>
              
              {emailDelivery && (
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="input max-w-md"
                  />
                </div>
              )}
            </div>

            {/* Export Button */}
            <div className="border-t pt-6">
              <button
                onClick={handleExport}
                disabled={exportMutation.isPending}
                className="btn-primary"
              >
                {exportMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {exportMutation.isPending ? 'Starting Export...' : 'Export Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export History */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="card-title">Export History</h3>
              <p className="card-subtitle">Recent report exports and downloads</p>
            </div>
            <button className="btn-secondary text-sm">
              <Filter className="w-3 h-3 mr-1" />
              Filter
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {exportJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(job.status)}
                <div>
                  <h4 className="font-medium text-charcoal">{job.reportName}</h4>
                  <p className="text-sm text-slate">
                    {format(new Date(job.createdAt), 'MMM dd, yyyy HH:mm')} • {job.format}
                    {job.fileSize && ` • ${job.fileSize}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
                
                {job.status === 'completed' && job.downloadUrl && (
                  <button className="btn-secondary text-sm">
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </button>
                )}
                
                {job.status === 'failed' && (
                  <button className="btn-secondary text-sm">
                    <Share className="w-3 h-3 mr-1" />
                    Retry
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="card-title">Scheduled Reports</h3>
              <p className="card-subtitle">Automate regular report generation</p>
            </div>
            <button className="btn-primary text-sm">
              <Calendar className="w-3 h-3 mr-1" />
              Schedule Report
            </button>
          </div>
        </div>
        
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-medium text-charcoal mb-2">No Scheduled Reports</h4>
          <p className="text-slate mb-4">
            Set up automated reports to be generated and delivered on a regular schedule.
          </p>
          <button className="btn-secondary">
            <Plus className="w-4 h-4 mr-2" />
            Create Schedule
          </button>
        </div>
      </div>

      {/* Quick Export Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Export</h3>
          <p className="card-subtitle">One-click exports for common reports</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-secondary flex items-center justify-center">
            <FileText className="w-4 h-4 mr-2" />
            Export Call Logs (CSV)
          </button>
          <button className="btn-secondary flex items-center justify-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Export Billing (PDF)
          </button>
          <button className="btn-secondary flex items-center justify-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Export Usage (Excel)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsExport;