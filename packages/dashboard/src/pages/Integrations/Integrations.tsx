import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Settings, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Zap,
  ExternalLink,
  MoreVertical,
  Star,
  Info,
  Download,
  Users,
  Smartphone,
  Mail,
  BarChart3,
  MessageSquare,
  ShoppingCart,
  Building,
  Brain,
  Headphones,
  Calendar,
  FileText,
  Cloud,
  Shield,
  Palette
} from 'lucide-react';
import { Integration, IntegrationTemplate, IntegrationStats } from '@voxlink/shared/types/integrations';
import integrationService from '../../services/integrations';

// App marketplace data structure
interface AppMarketplaceItem {
  name: string;
  icon: string;
  color: string;
  status: 'available' | 'coming-soon' | 'premium';
  category: string;
  description?: string;
  isPopular?: boolean;
  isAiCompatible?: boolean;
  features?: string[];
  provider?: string;
}

// Comprehensive app marketplace data
const marketplaceApps: Record<string, AppMarketplaceItem[]> = {
  popular: [
    { name: 'Pipedrive', icon: '📊', color: '#FF6B35', status: 'available', category: 'crm', description: 'Sales CRM and pipeline management', isPopular: true },
    { name: 'HubSpot', icon: '🚀', color: '#FF7A33', status: 'available', category: 'crm', description: 'All-in-one marketing, sales, and service platform', isPopular: true },
    { name: 'Zoho', icon: '💼', color: '#E84142', status: 'available', category: 'crm', description: 'Complete business suite', isPopular: true },
    { name: 'Salesforce', icon: '☁️', color: '#00A1E0', status: 'available', category: 'crm', description: 'World\'s #1 CRM platform', isPopular: true },
    { name: 'Zendesk', icon: '🎧', color: '#03A696', status: 'available', category: 'helpdesk', description: 'Customer service and support platform', isPopular: true }
  ],
  ai: [
    { name: 'ChatGPT', icon: '🤖', color: '#10A37F', status: 'available', category: 'ai', description: 'AI-powered conversational assistant', isAiCompatible: true },
    { name: 'Dialogflow', icon: '💬', color: '#FF9800', status: 'available', category: 'ai', description: 'Google\'s conversational AI platform', isAiCompatible: true },
    { name: 'Watson', icon: '🧠', color: '#1261FE', status: 'available', category: 'ai', description: 'IBM\'s AI and machine learning platform', isAiCompatible: true },
    { name: 'Rasa', icon: '🎯', color: '#5A67D8', status: 'coming-soon', category: 'ai', description: 'Open source conversational AI', isAiCompatible: true },
    { name: 'Microsoft Bot Framework', icon: '🤖', color: '#0078D4', status: 'available', category: 'ai', description: 'Build and deploy intelligent bots', isAiCompatible: true }
  ],
  crm: [
    { name: 'Salesforce', icon: '☁️', color: '#00A1E0', status: 'available', category: 'crm', description: 'World\'s #1 CRM platform' },
    { name: 'HubSpot', icon: '🚀', color: '#FF7A33', status: 'available', category: 'crm', description: 'All-in-one marketing, sales, and service platform' },
    { name: 'Pipedrive', icon: '📊', color: '#FF6B35', status: 'available', category: 'crm', description: 'Sales CRM and pipeline management' },
    { name: 'Zoho CRM', icon: '💼', color: '#E84142', status: 'available', category: 'crm', description: 'Complete CRM solution' },
    { name: 'Freshworks', icon: '🌟', color: '#2ECC71', status: 'available', category: 'crm', description: 'Customer experience software' },
    { name: 'Monday.com', icon: '📅', color: '#FF5722', status: 'available', category: 'crm', description: 'Work management platform' }
  ],
  marketing: [
    { name: 'Mailchimp', icon: '📧', color: '#FFE01B', status: 'available', category: 'marketing', description: 'Email marketing platform' },
    { name: 'Marketo', icon: '🎯', color: '#5C4C9F', status: 'available', category: 'marketing', description: 'Marketing automation platform' },
    { name: 'Campaign Monitor', icon: '📱', color: '#509E2F', status: 'available', category: 'marketing', description: 'Email marketing and automation' },
    { name: 'Constant Contact', icon: '📬', color: '#1A73E8', status: 'available', category: 'marketing', description: 'Email marketing and online surveys' },
    { name: 'ActiveCampaign', icon: '⚡', color: '#356AE6', status: 'available', category: 'marketing', description: 'Customer experience automation' }
  ],
  communication: [
    { name: 'Microsoft Teams', icon: '💬', color: '#6264A7', status: 'available', category: 'communication', description: 'Team collaboration platform' },
    { name: 'Slack', icon: '💬', color: '#4A154B', status: 'available', category: 'communication', description: 'Business messaging platform' },
    { name: 'Zoom', icon: '📹', color: '#2D8CFF', status: 'available', category: 'communication', description: 'Video conferencing platform' },
    { name: 'WhatsApp Business', icon: '📱', color: '#25D366', status: 'available', category: 'communication', description: 'Business messaging on WhatsApp' },
    { name: 'Skype', icon: '📞', color: '#00AFF0', status: 'available', category: 'communication', description: 'Video calling and messaging' },
    { name: 'Discord', icon: '🎮', color: '#5865F2', status: 'available', category: 'communication', description: 'Voice, video and text communication' }
  ],
  productivity: [
    { name: 'Notion', icon: '📝', color: '#000000', status: 'available', category: 'productivity', description: 'All-in-one workspace' },
    { name: 'Trello', icon: '📋', color: '#0079BF', status: 'available', category: 'productivity', description: 'Project management boards' },
    { name: 'Asana', icon: '✅', color: '#F06A6A', status: 'available', category: 'productivity', description: 'Team project management' },
    { name: 'Monday.com', icon: '📅', color: '#FF5722', status: 'available', category: 'productivity', description: 'Work management platform' },
    { name: 'Jira', icon: '🐛', color: '#0052CC', status: 'available', category: 'productivity', description: 'Issue and project tracking' },
    { name: 'ClickUp', icon: '⚡', color: '#7B68EE', status: 'available', category: 'productivity', description: 'All-in-one productivity platform' }
  ],
  ecommerce: [
    { name: 'Shopify', icon: '🛍️', color: '#96BF48', status: 'available', category: 'ecommerce', description: 'E-commerce platform' },
    { name: 'WooCommerce', icon: '🛒', color: '#96588A', status: 'available', category: 'ecommerce', description: 'WordPress e-commerce plugin' },
    { name: 'Magento', icon: '🏪', color: '#EE672F', status: 'available', category: 'ecommerce', description: 'Open source e-commerce platform' },
    { name: 'BigCommerce', icon: '💰', color: '#121118', status: 'available', category: 'ecommerce', description: 'E-commerce platform for growing businesses' },
    { name: 'Square', icon: '⬜', color: '#3E4348', status: 'available', category: 'ecommerce', description: 'Payment processing and POS' }
  ],
  analytics: [
    { name: 'Google Analytics', icon: '📈', color: '#E37400', status: 'available', category: 'analytics', description: 'Web analytics platform' },
    { name: 'Mixpanel', icon: '🔢', color: '#7856FF', status: 'available', category: 'analytics', description: 'Product analytics platform' },
    { name: 'Amplitude', icon: '📊', color: '#0085FF', status: 'available', category: 'analytics', description: 'Digital analytics platform' },
    { name: 'Hotjar', icon: '🔥', color: '#FD3A5C', status: 'available', category: 'analytics', description: 'Website heatmaps and behavior analytics' },
    { name: 'Tableau', icon: '📊', color: '#E97627', status: 'available', category: 'analytics', description: 'Data visualization platform' }
  ],
  helpdesk: [
    { name: 'Zendesk', icon: '🎧', color: '#03A696', status: 'available', category: 'helpdesk', description: 'Customer service platform' },
    { name: 'Freshdesk', icon: '🌟', color: '#2ECC71', status: 'available', category: 'helpdesk', description: 'Customer support software' },
    { name: 'Intercom', icon: '💬', color: '#338EF7', status: 'available', category: 'helpdesk', description: 'Customer messaging platform' },
    { name: 'Help Scout', icon: '🆘', color: '#1292EE', status: 'available', category: 'helpdesk', description: 'Help desk software' }
  ],
  sales: [
    { name: 'Outreach', icon: '📞', color: '#5B45FF', status: 'available', category: 'sales', description: 'Sales engagement platform' },
    { name: 'SalesLoft', icon: '🎯', color: '#FF6B35', status: 'available', category: 'sales', description: 'Sales engagement and intelligence' },
    { name: 'Apollo', icon: '🚀', color: '#6C5CE7', status: 'available', category: 'sales', description: 'Sales intelligence and engagement' },
    { name: 'Gong', icon: '🎤', color: '#FF6B6B', status: 'premium', category: 'sales', description: 'Revenue intelligence platform' }
  ],
  erp: [
    { name: 'SAP', icon: '🏢', color: '#0FAAFF', status: 'available', category: 'erp', description: 'Enterprise resource planning' },
    { name: 'Oracle ERP', icon: '🔴', color: '#F80000', status: 'available', category: 'erp', description: 'Cloud ERP applications' },
    { name: 'NetSuite', icon: '☁️', color: '#FF6600', status: 'available', category: 'erp', description: 'Cloud business software suite' },
    { name: 'Microsoft Dynamics', icon: '🔷', color: '#0078D4', status: 'available', category: 'erp', description: 'Business applications' }
  ],
  cloud: [
    { name: 'Google Drive', icon: '📁', color: '#4285F4', status: 'available', category: 'cloud', description: 'Cloud storage and collaboration' },
    { name: 'Dropbox', icon: '📦', color: '#0061FF', status: 'available', category: 'cloud', description: 'Cloud storage platform' },
    { name: 'OneDrive', icon: '☁️', color: '#0078D4', status: 'available', category: 'cloud', description: 'Microsoft cloud storage' },
    { name: 'Box', icon: '📦', color: '#0061D5', status: 'available', category: 'cloud', description: 'Cloud content management' }
  ],
  sso: [
    { name: 'Okta', icon: '🔐', color: '#007DC1', status: 'available', category: 'sso', description: 'Identity and access management' },
    { name: 'Auth0', icon: '🛡️', color: '#EB5424', status: 'available', category: 'sso', description: 'Identity platform for developers' },
    { name: 'Azure AD', icon: '🔷', color: '#0078D4', status: 'available', category: 'sso', description: 'Microsoft identity platform' },
    { name: 'OneLogin', icon: '1️⃣', color: '#2D89EF', status: 'available', category: 'sso', description: 'Identity and access management' }
  ],
  mailings: [
    { name: 'Mailchimp', icon: '📧', color: '#FFE01B', status: 'available', category: 'mailings', description: 'Email marketing platform' },
    { name: 'SendGrid', icon: '📬', color: '#1A82E2', status: 'available', category: 'mailings', description: 'Email delivery service' },
    { name: 'Mailgun', icon: '🔫', color: '#F56565', status: 'available', category: 'mailings', description: 'Email API service' },
    { name: 'ConvertKit', icon: '📮', color: '#FB7185', status: 'available', category: 'mailings', description: 'Email marketing for creators' }
  ],
  data: [
    { name: 'Clearbit', icon: '🔍', color: '#6366F1', status: 'available', category: 'data', description: 'Business intelligence APIs' },
    { name: 'ZoomInfo', icon: '🎯', color: '#FF6B35', status: 'premium', category: 'data', description: 'B2B contact database' },
    { name: 'Apollo', icon: '🚀', color: '#6C5CE7', status: 'available', category: 'data', description: 'Sales intelligence platform' },
    { name: 'Hunter', icon: '🏹', color: '#FF6B6B', status: 'available', category: 'data', description: 'Email finder and verifier' }
  ],
  entertainment: [
    { name: 'Spotify', icon: '🎵', color: '#1DB954', status: 'coming-soon', category: 'entertainment', description: 'Music streaming service' },
    { name: 'YouTube', icon: '📺', color: '#FF0000', status: 'coming-soon', category: 'entertainment', description: 'Video sharing platform' },
    { name: 'Twitch', icon: '🎮', color: '#9146FF', status: 'coming-soon', category: 'entertainment', description: 'Live streaming platform' }
  ],
  recruitment: [
    { name: 'LinkedIn', icon: '💼', color: '#0077B5', status: 'available', category: 'recruitment', description: 'Professional networking' },
    { name: 'Indeed', icon: '🔍', color: '#2557A7', status: 'available', category: 'recruitment', description: 'Job search engine' },
    { name: 'Greenhouse', icon: '🌱', color: '#00B74A', status: 'available', category: 'recruitment', description: 'Hiring software' },
    { name: 'BambooHR', icon: '🎋', color: '#6CB33F', status: 'available', category: 'recruitment', description: 'HR management system' }
  ],
  custom: [
    { name: 'Webhook', icon: '🔗', color: '#6B7280', status: 'available', category: 'custom', description: 'Custom webhook integration' },
    { name: 'REST API', icon: '🔌', color: '#10B981', status: 'available', category: 'custom', description: 'Custom REST API integration' },
    { name: 'GraphQL', icon: '📊', color: '#E10098', status: 'available', category: 'custom', description: 'Custom GraphQL integration' },
    { name: 'Custom Script', icon: '📜', color: '#F59E0B', status: 'available', category: 'custom', description: 'Custom JavaScript integration' }
  ],
  others: [
    { name: 'IFTTT', icon: '🔄', color: '#33C3F0', status: 'available', category: 'others', description: 'Automation platform' },
    { name: 'Zapier', icon: '⚡', color: '#FF4A00', status: 'available', category: 'others', description: 'Workflow automation' },
    { name: 'Microsoft Power Automate', icon: '🔷', color: '#0078D4', status: 'available', category: 'others', description: 'Business process automation' },
    { name: 'n8n', icon: '🔗', color: '#EA4B71', status: 'available', category: 'others', description: 'Workflow automation tool' }
  ]
};

const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [templates, setTemplates] = useState<IntegrationTemplate[]>([]);
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMarketplace, setShowMarketplace] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [integrationsData, templatesData, statsData] = await Promise.all([
        integrationService.getIntegrations(),
        integrationService.getIntegrationTemplates(),
        integrationService.getIntegrationStats()
      ]);
      
      setIntegrations(integrationsData);
      setTemplates(templatesData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'syncing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || integration.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Apps', icon: '📱' },
    { value: 'ai', label: 'AI Voice Agent Compatible', icon: '🤖' },
    { value: 'popular', label: 'Popular', icon: '⭐' },
    { value: 'crm', label: 'CRM', icon: '👥' },
    { value: 'marketing', label: 'Marketing Automation', icon: '📧' },
    { value: 'sales', label: 'Sales Automation', icon: '💼' },
    { value: 'helpdesk', label: 'HelpDesk', icon: '🎧' },
    { value: 'communication', label: 'Communication', icon: '💬' },
    { value: 'productivity', label: 'Productivity', icon: '✅' },
    { value: 'ecommerce', label: 'E-commerce', icon: '🛒' },
    { value: 'erp', label: 'ERP', icon: '🏢' },
    { value: 'mailings', label: 'Mailings', icon: '📬' },
    { value: 'analytics', label: 'Analytics', icon: '📊' },
    { value: 'data', label: 'Data Enrichment', icon: '📈' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎮' },
    { value: 'recruitment', label: 'Recruitment', icon: '👔' },
    { value: 'cloud', label: 'Cloud Storage', icon: '☁️' },
    { value: 'sso', label: 'SSO', icon: '🔐' },
    { value: 'custom', label: 'Custom', icon: '⚙️' },
    { value: 'others', label: 'Others', icon: '📦' }
  ];

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'error', label: 'Error' },
    { value: 'pending', label: 'Pending' },
    { value: 'inactive', label: 'Inactive' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-voxlink-blue mx-auto mb-4" />
          <p className="text-gray-500">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-1">
            Connect VoxLink with your favorite tools and services
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={() => {
              setShowMarketplace(true);
              setShowTemplates(false);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showMarketplace 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            App Marketplace
          </button>
          <button
            onClick={() => {
              setShowMarketplace(false);
              setShowTemplates(false);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !showMarketplace && !showTemplates
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            My Integrations
          </button>
          <button
            onClick={() => {
              setShowTemplates(!showTemplates);
              setShowMarketplace(false);
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showTemplates 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Templates
          </button>
          <button
            onClick={loadData}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Zap className="w-8 h-8 text-voxlink-blue" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Integrations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalIntegrations}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeIntegrations}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.errorIntegrations}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <RefreshCw className="w-8 h-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sync Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.syncStats.totalSyncs > 0 
                    ? Math.round((stats.syncStats.successfulSyncs / stats.syncStats.totalSyncs) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={showMarketplace ? "Search integrations..." : "Search integrations..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {!showMarketplace && (
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
              
              {!showTemplates && (
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {showMarketplace ? (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar for categories - hidden on mobile, shown as dropdown */}
          <div className="lg:w-64">
            {/* Mobile category selector */}
            <div className="lg:hidden mb-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Desktop sidebar */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-fit">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              <ul className="space-y-2">
                {categories.map(category => (
                  <li
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      selectedCategory === category.value
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{category.icon}</span>
                    <span className="text-sm">{category.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1">
            <AppMarketplace searchTerm={searchTerm} selectedCategory={selectedCategory} />
          </div>
        </div>
      ) : showTemplates ? (
        <IntegrationTemplates templates={filteredTemplates} onInstall={loadData} />
      ) : (
        <ActiveIntegrations integrations={filteredIntegrations} onUpdate={loadData} />
      )}
    </div>
  );
};

// App Marketplace Component
const AppMarketplace: React.FC<{ 
  searchTerm: string; 
  selectedCategory: string; 
}> = ({ searchTerm, selectedCategory }) => {
  const [selectedApp, setSelectedApp] = useState<AppMarketplaceItem | null>(null);

  const getFilteredApps = () => {
    if (selectedCategory === 'all') {
      // Show all apps from all categories
      const allApps: AppMarketplaceItem[] = [];
      Object.values(marketplaceApps).forEach(categoryApps => {
        allApps.push(...categoryApps);
      });
      
      // Remove duplicates based on name
      const uniqueApps = allApps.filter((app, index, self) => 
        index === self.findIndex(a => a.name === app.name)
      );
      
      return uniqueApps.filter(app => 
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.description && app.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    } else {
      const categoryApps = marketplaceApps[selectedCategory] || [];
      return categoryApps.filter(app => 
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.description && app.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  };

  const filteredApps = getFilteredApps();

  const handleConnectApp = (app: AppMarketplaceItem) => {
    if (app.status === 'available') {
      setSelectedApp(app);
      // In a real implementation, this would open a configuration modal
      alert(`Connecting to ${app.name}... This would normally open the integration flow.`);
    } else if (app.status === 'coming-soon') {
      alert(`${app.name} is coming soon! We'll notify you when it's available.`);
    } else if (app.status === 'premium') {
      alert(`${app.name} is a premium integration. Please upgrade your plan to access this feature.`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Connect
          </span>
        );
      case 'coming-soon':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Coming Soon
          </span>
        );
      case 'premium':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Star className="w-3 h-3 mr-1" />
            Premium
          </span>
        );
      default:
        return null;
    }
  };

  const renderByCategory = () => {
    if (selectedCategory === 'all') {
      // Group apps by category for "All Apps" view
      const categorizedApps: Record<string, AppMarketplaceItem[]> = {};
      
      Object.entries(marketplaceApps).forEach(([category, apps]) => {
        const filtered = apps.filter(app => 
          app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (app.description && app.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        if (filtered.length > 0) {
          categorizedApps[category] = filtered;
        }
      });

      return (
        <div className="space-y-8">
          {Object.entries(categorizedApps).map(([category, apps]) => (
            <div key={category} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 capitalize border-b-2 border-blue-500 pb-2">
                {category === 'ai' ? 'AI Voice Agent Compatible' : 
                 category === 'ecommerce' ? 'E-commerce' :
                 category === 'helpdesk' ? 'Help Desk' :
                 category}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {apps.map((app, index) => (
                  <AppCard key={`${category}-${index}`} app={app} onConnect={handleConnectApp} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      // Show specific category
      const categoryLabel = categories.find(cat => cat.value === selectedCategory)?.label || selectedCategory;
      
      return (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 border-b-2 border-blue-500 pb-2">
            {categoryLabel}
          </h2>
          {filteredApps.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No apps found</h3>
              <p className="text-gray-500">
                Try adjusting your search or browse other categories.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredApps.map((app, index) => (
                <AppCard key={index} app={app} onConnect={handleConnectApp} />
              ))}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {renderByCategory()}
    </div>
  );
};

// App Card Component
const AppCard: React.FC<{ 
  app: AppMarketplaceItem; 
  onConnect: (app: AppMarketplaceItem) => void; 
}> = ({ app, onConnect }) => {
  return (
    <div 
      className="relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={() => onConnect(app)}
    >
      {/* Info icon */}
      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Info className="w-3 h-3 text-white" />
      </div>
      
      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {app.isPopular && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Star className="w-3 h-3 mr-1" />
            Popular
          </span>
        )}
        {app.isAiCompatible && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Brain className="w-3 h-3 mr-1" />
            AI
          </span>
        )}
      </div>
      
      {/* App icon */}
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-3 mx-auto"
        style={{ backgroundColor: app.color }}
      >
        <span className="text-white">{app.icon}</span>
      </div>
      
      {/* App name */}
      <h3 className="text-sm font-semibold text-gray-900 text-center mb-2 truncate">
        {app.name}
      </h3>
      
      {/* Status badge */}
      <div className="flex justify-center mb-2">
        {getStatusBadge(app.status)}
      </div>
      
      {/* Description */}
      {app.description && (
        <p className="text-xs text-gray-500 text-center overflow-hidden" style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {app.description}
        </p>
      )}
    </div>
  );
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'available':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Connect
        </span>
      );
    case 'coming-soon':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Coming Soon
        </span>
      );
    case 'premium':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Star className="w-3 h-3 mr-1" />
          Premium
        </span>
      );
    default:
      return null;
  }
};

// Active Integrations Component
const ActiveIntegrations: React.FC<{ 
  integrations: Integration[]; 
  onUpdate: () => void; 
}> = ({ integrations, onUpdate }) => {
  const handleSync = async (integrationId: string) => {
    try {
      await integrationService.triggerSync(integrationId);
      onUpdate();
    } catch (error) {
      console.error('Failed to sync integration:', error);
    }
  };

  const handleTest = async (integrationId: string) => {
    try {
      const result = await integrationService.testIntegration(integrationId);
      alert(result.success ? 'Test successful!' : `Test failed: ${result.message}`);
    } catch (error) {
      console.error('Failed to test integration:', error);
    }
  };

  if (integrations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations found</h3>
        <p className="text-gray-500 mb-6">
          Get started by browsing our integration templates and connecting your first service.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {integrations.map((integration) => (
        <div key={integration.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-voxlink-blue to-link-teal rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                <p className="text-sm text-gray-500">{integration.provider}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(integration.status)}
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">{integration.description}</p>
          
          <div className="flex items-center justify-between mb-4">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
              {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
            </span>
            <span className="text-xs text-gray-500">
              {integration.lastSync 
                ? `Last sync: ${new Date(integration.lastSync).toLocaleDateString()}`
                : 'Never synced'
              }
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSync(integration.id)}
              className="flex-1 px-3 py-2 bg-voxlink-blue text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Sync Now
            </button>
            <button
              onClick={() => handleTest(integration.id)}
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Test
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Integration Templates Component
const IntegrationTemplates: React.FC<{ 
  templates: IntegrationTemplate[]; 
  onInstall: () => void; 
}> = ({ templates, onInstall }) => {
  const handleInstall = async (templateId: string) => {
    try {
      // This would open a configuration modal in a real implementation
      const config = {}; // Placeholder
      await integrationService.createFromTemplate(templateId, config);
      onInstall();
    } catch (error) {
      console.error('Failed to install integration:', error);
    }
  };

  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
        <p className="text-gray-500">
          Try adjusting your search or category filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <img 
                  src={template.logoUrl} 
                  alt={template.name}
                  className="w-6 h-6"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                  }}
                />
                <Zap className="w-5 h-5 text-gray-400 hidden" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-500">{template.provider}</p>
              </div>
            </div>
            {template.isPopular && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                Popular
              </span>
            )}
          </div>
          
          <p className="text-gray-600 text-sm mb-4">{template.description}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {template.supportedFeatures.slice(0, 3).map((feature, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                {feature}
              </span>
            ))}
            {template.supportedFeatures.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                +{template.supportedFeatures.length - 3} more
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleInstall(template.id)}
              className="flex-1 px-3 py-2 bg-voxlink-blue text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Install
            </button>
            <a
              href={template.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="View Documentation"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Integrations;