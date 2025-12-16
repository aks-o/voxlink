import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Megaphone, Play, Pause, Edit, Trash2, Copy, BarChart3, Users, Calendar, Target } from 'lucide-react';
import { Campaign, CampaignStatistics } from '../../../shared/src/types/messaging';

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Campaign['status']>('all');
  const [filterType, setFilterType] = useState<'all' | Campaign['type']>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Welcome Series 2024',
          description: 'Onboarding campaign for new customers',
          type: 'drip',
          channel: 'sms',
          templateId: 'welcome-template',
          targetAudience: {
            type: 'segment',
            criteria: [
              { field: 'signup_date', operator: 'greater_than', value: '2024-01-01' }
            ],
            estimatedSize: 1250
          },
          schedule: {
            type: 'immediate',
            timezone: 'America/New_York'
          },
          status: 'running',
          statistics: {
            totalSent: 1245,
            delivered: 1198,
            opened: 892,
            clicked: 234,
            replied: 89,
            unsubscribed: 12,
            bounced: 47,
            deliveryRate: 96.2,
            openRate: 74.5,
            clickRate: 26.2,
            replyRate: 10.0
          },
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
          createdBy: 'user1'
        },
        {
          id: '2',
          name: 'Flash Sale Alert',
          description: 'Limited time offer for premium customers',
          type: 'broadcast',
          channel: 'sms',
          templateId: 'flash-sale-template',
          targetAudience: {
            type: 'segment',
            criteria: [
              { field: 'customer_tier', operator: 'equals', value: 'premium' }
            ],
            estimatedSize: 567
          },
          schedule: {
            type: 'scheduled',
            startDate: new Date('2024-01-22T10:00:00'),
            timezone: 'America/New_York'
          },
          status: 'scheduled',
          statistics: {
            totalSent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            replied: 0,
            unsubscribed: 0,
            bounced: 0,
            deliveryRate: 0,
            openRate: 0,
            clickRate: 0,
            replyRate: 0
          },
          createdAt: new Date('2024-01-18'),
          updatedAt: new Date('2024-01-19'),
          createdBy: 'user2'
        },
        {
          id: '3',
          name: 'Customer Feedback Survey',
          description: 'Monthly satisfaction survey',
          type: 'triggered',
          channel: 'email',
          templateId: 'feedback-survey-template',
          targetAudience: {
            type: 'segment',
            criteria: [
              { field: 'last_purchase', operator: 'less_than', value: '30' }
            ],
            estimatedSize: 892
          },
          schedule: {
            type: 'recurring',
            frequency: 'monthly',
            timezone: 'America/New_York'
          },
          status: 'running',
          statistics: {
            totalSent: 892,
            delivered: 876,
            opened: 456,
            clicked: 123,
            replied: 67,
            unsubscribed: 8,
            bounced: 16,
            deliveryRate: 98.2,
            openRate: 52.1,
            clickRate: 27.0,
            replyRate: 14.7
          },
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-18'),
          createdBy: 'user1'
        },
        {
          id: '4',
          name: 'Holiday Promotion',
          description: 'Special holiday offers and discounts',
          type: 'promotional',
          channel: 'sms',
          templateId: 'holiday-promo-template',
          targetAudience: {
            type: 'all',
            estimatedSize: 2340
          },
          schedule: {
            type: 'scheduled',
            startDate: new Date('2024-01-25T09:00:00'),
            endDate: new Date('2024-01-31T23:59:59'),
            timezone: 'America/New_York'
          },
          status: 'draft',
          statistics: {
            totalSent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            replied: 0,
            unsubscribed: 0,
            bounced: 0,
            deliveryRate: 0,
            openRate: 0,
            clickRate: 0,
            replyRate: 0
          },
          createdAt: new Date('2024-01-16'),
          updatedAt: new Date('2024-01-17'),
          createdBy: 'user2'
        },
        {
          id: '5',
          name: 'Abandoned Cart Recovery',
          description: 'Re-engage customers who left items in cart',
          type: 'triggered',
          channel: 'sms',
          templateId: 'cart-recovery-template',
          targetAudience: {
            type: 'segment',
            criteria: [
              { field: 'cart_status', operator: 'equals', value: 'abandoned' }
            ],
            estimatedSize: 456
          },
          schedule: {
            type: 'immediate',
            timezone: 'America/New_York'
          },
          status: 'paused',
          statistics: {
            totalSent: 234,
            delivered: 228,
            opened: 167,
            clicked: 45,
            replied: 23,
            unsubscribed: 3,
            bounced: 6,
            deliveryRate: 97.4,
            openRate: 73.2,
            clickRate: 27.0,
            replyRate: 13.8
          },
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-19'),
          createdBy: 'user1'
        }
      ];
      
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
    const matchesType = filterType === 'all' || campaign.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: Campaign['type']) => {
    switch (type) {
      case 'broadcast': return 'bg-blue-100 text-blue-800';
      case 'drip': return 'bg-green-100 text-green-800';
      case 'triggered': return 'bg-orange-100 text-orange-800';
      case 'promotional': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleToggleCampaign = async (campaignId: string) => {
    try {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        const newStatus = campaign.status === 'running' ? 'paused' : 'running';
        setCampaigns(prev => prev.map(c => 
          c.id === campaignId ? { ...c, status: newStatus } : c
        ));
      }
    } catch (error) {
      console.error('Failed to toggle campaign:', error);
    }
  };

  const handleDuplicateCampaign = async (campaign: Campaign) => {
    try {
      const duplicatedCampaign: Campaign = {
        ...campaign,
        id: `campaign_${Date.now()}`,
        name: `${campaign.name} (Copy)`,
        status: 'draft',
        statistics: {
          totalSent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          replied: 0,
          unsubscribed: 0,
          bounced: 0,
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
          replyRate: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setCampaigns(prev => [...prev, duplicatedCampaign]);
    } catch (error) {
      console.error('Failed to duplicate campaign:', error);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
      } catch (error) {
        console.error('Failed to delete campaign:', error);
      }
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Campaigns</h1>
          <p className="text-gray-600 mt-1">Create and manage targeted messaging campaigns</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </button>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
              <p className="text-2xl font-semibold text-gray-900">
                {campaigns.filter(c => c.status === 'running').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reach</p>
              <p className="text-2xl font-semibold text-gray-900">
                {campaigns.reduce((sum, c) => sum + c.statistics.totalSent, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Open Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {campaigns.length > 0 
                  ? (campaigns.reduce((sum, c) => sum + c.statistics.openRate, 0) / campaigns.length).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Click Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {campaigns.length > 0 
                  ? (campaigns.reduce((sum, c) => sum + c.statistics.clickRate, 0) / campaigns.length).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="running">Running</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="broadcast">Broadcast</option>
              <option value="drip">Drip</option>
              <option value="triggered">Triggered</option>
              <option value="promotional">Promotional</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-voxlink-blue"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Megaphone className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(campaign.type)}`}>
                        {campaign.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">{campaign.description}</p>

              {/* Campaign Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {campaign.statistics.totalSent.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {campaign.statistics.openRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">Open Rate</div>
                </div>
              </div>

              {/* Performance Metrics */}
              {campaign.statistics.totalSent > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Delivered:</span>
                    <span className="font-medium">{campaign.statistics.deliveryRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Clicked:</span>
                    <span className="font-medium">{campaign.statistics.clickRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-gray-600">Replied:</span>
                    <span className="font-medium">{campaign.statistics.replyRate.toFixed(1)}%</span>
                  </div>
                </div>
              )}

              {/* Audience Info */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Target Audience:</span>
                  <span className="font-medium">{campaign.targetAudience.estimatedSize.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Channel:</span>
                  <span className="font-medium capitalize">{campaign.channel}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-1">
                  {(campaign.status === 'running' || campaign.status === 'paused') && (
                    <button
                      onClick={() => handleToggleCampaign(campaign.id)}
                      className={`p-2 rounded-md transition-colors ${
                        campaign.status === 'running'
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={campaign.status === 'running' ? 'Pause Campaign' : 'Resume Campaign'}
                    >
                      {campaign.status === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedCampaign(campaign)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    title="Edit Campaign"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateCampaign(campaign)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    title="Duplicate Campaign"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    title="View Analytics"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(campaign.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredCampaigns.length === 0 && !loading && (
        <div className="text-center py-12">
          <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first marketing campaign to get started'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </button>
          )}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Campaign</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter campaign name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent">
                    <option value="">Select campaign type</option>
                    <option value="broadcast">Broadcast</option>
                    <option value="drip">Drip Campaign</option>
                    <option value="triggered">Triggered</option>
                    <option value="promotional">Promotional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent">
                    <option value="">Select channel</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your campaign"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-voxlink-blue border border-transparent rounded-md hover:bg-blue-600">
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;