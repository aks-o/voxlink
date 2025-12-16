import React, { useState, useEffect } from 'react';
import { Plus, Settings, MessageSquare, Mail, Phone, Globe, Smartphone, MoreVertical, Edit, Trash2, Power, AlertCircle } from 'lucide-react';
import { CommunicationChannel, MessageChannel } from '../../../shared/src/types/messaging';

const Channels: React.FC = () => {
  const [channels, setChannels] = useState<CommunicationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<CommunicationChannel | null>(null);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockChannels: CommunicationChannel[] = [
        {
          id: '1',
          type: 'sms',
          name: 'Primary SMS',
          config: {
            provider: 'twilio',
            phoneNumber: '+1 (555) 123-4567',
            accountSid: 'AC***************',
            authToken: '***************'
          },
          isActive: true,
          isDefault: true,
          rateLimits: [
            { period: 'minute', limit: 100, currentUsage: 23, resetAt: new Date() },
            { period: 'hour', limit: 1000, currentUsage: 456, resetAt: new Date() }
          ],
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20')
        },
        {
          id: '2',
          type: 'email',
          name: 'Support Email',
          config: {
            provider: 'sendgrid',
            fromEmail: 'support@voxlink.com',
            fromName: 'VoxLink Support',
            apiKey: '***************'
          },
          isActive: true,
          isDefault: false,
          rateLimits: [
            { period: 'hour', limit: 500, currentUsage: 89, resetAt: new Date() },
            { period: 'day', limit: 5000, currentUsage: 1234, resetAt: new Date() }
          ],
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-18')
        },
        {
          id: '3',
          type: 'whatsapp',
          name: 'WhatsApp Business',
          config: {
            provider: 'twilio',
            phoneNumber: '+1 (555) 987-6543',
            businessAccountId: 'BA***************'
          },
          isActive: false,
          isDefault: false,
          rateLimits: [
            { period: 'minute', limit: 50, currentUsage: 0, resetAt: new Date() }
          ],
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-12')
        },
        {
          id: '4',
          type: 'chat',
          name: 'Website Chat',
          config: {
            provider: 'internal',
            widgetId: 'widget_123',
            theme: 'blue',
            position: 'bottom-right'
          },
          isActive: true,
          isDefault: false,
          rateLimits: [],
          createdAt: new Date('2024-01-08'),
          updatedAt: new Date('2024-01-19')
        }
      ];
      
      setChannels(mockChannels);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (type: MessageChannel) => {
    switch (type) {
      case 'sms': return <MessageSquare className="w-5 h-5" />;
      case 'email': return <Mail className="w-5 h-5" />;
      case 'voice': return <Phone className="w-5 h-5" />;
      case 'whatsapp': return <Smartphone className="w-5 h-5" />;
      case 'chat': return <Globe className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getChannelColor = (type: MessageChannel) => {
    switch (type) {
      case 'sms': return 'bg-blue-100 text-blue-600';
      case 'email': return 'bg-green-100 text-green-600';
      case 'voice': return 'bg-purple-100 text-purple-600';
      case 'whatsapp': return 'bg-green-100 text-green-600';
      case 'chat': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleToggleChannel = async (channelId: string) => {
    try {
      const channel = channels.find(c => c.id === channelId);
      if (channel) {
        setChannels(prev => prev.map(c => 
          c.id === channelId ? { ...c, isActive: !c.isActive } : c
        ));
      }
    } catch (error) {
      console.error('Failed to toggle channel:', error);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (window.confirm('Are you sure you want to delete this channel?')) {
      try {
        setChannels(prev => prev.filter(channel => channel.id !== channelId));
      } catch (error) {
        console.error('Failed to delete channel:', error);
      }
    }
  };

  const getRateLimitStatus = (rateLimit: any) => {
    const percentage = (rateLimit.currentUsage / rateLimit.limit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communication Channels</h1>
          <p className="text-gray-600 mt-1">Manage your communication channels and integrations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Channel
        </button>
      </div>

      {/* Channels Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-voxlink-blue"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel) => (
            <div key={channel.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getChannelColor(channel.type)}`}>
                    {getChannelIcon(channel.type)}
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">{channel.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        channel.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {channel.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {channel.isDefault && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Channel Configuration */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Configuration</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  {channel.type === 'sms' && (
                    <>
                      <div>Provider: {channel.config.provider}</div>
                      <div>Number: {channel.config.phoneNumber}</div>
                    </>
                  )}
                  {channel.type === 'email' && (
                    <>
                      <div>Provider: {channel.config.provider}</div>
                      <div>From: {channel.config.fromEmail}</div>
                    </>
                  )}
                  {channel.type === 'whatsapp' && (
                    <>
                      <div>Provider: {channel.config.provider}</div>
                      <div>Number: {channel.config.phoneNumber}</div>
                    </>
                  )}
                  {channel.type === 'chat' && (
                    <>
                      <div>Provider: {channel.config.provider}</div>
                      <div>Widget ID: {channel.config.widgetId}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Rate Limits */}
              {channel.rateLimits && channel.rateLimits.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Rate Limits</h4>
                  <div className="space-y-2">
                    {channel.rateLimits.map((rateLimit, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 capitalize">{rateLimit.period}:</span>
                        <span className={getRateLimitStatus(rateLimit)}>
                          {rateLimit.currentUsage}/{rateLimit.limit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Health Status */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Health Status:</span>
                  <div className="flex items-center">
                    {channel.isActive ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-green-600">Healthy</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-gray-500">Disabled</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleToggleChannel(channel.id)}
                    className={`p-2 rounded-md transition-colors ${
                      channel.isActive
                        ? 'text-orange-600 hover:bg-orange-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={channel.isActive ? 'Disable Channel' : 'Enable Channel'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedChannel(channel)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    title="Edit Channel"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteChannel(channel.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Channel"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => setSelectedChannel(channel)}
                  className="text-sm text-voxlink-blue hover:text-blue-600 font-medium"
                >
                  Configure
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {channels.length === 0 && !loading && (
        <div className="text-center py-12">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No channels configured</h3>
          <p className="text-gray-500 mb-4">
            Add your first communication channel to start receiving messages
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Channel
          </button>
        </div>
      )}

      {/* Create/Edit Channel Modal */}
      {(showCreateModal || selectedChannel) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedChannel ? 'Edit Channel' : 'Add New Channel'}
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent">
                    <option value="">Select channel type</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="chat">Website Chat</option>
                    <option value="voice">Voice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter channel name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent">
                    <option value="">Select provider</option>
                    <option value="twilio">Twilio</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                    <option value="internal">Internal</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedChannel(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-voxlink-blue border border-transparent rounded-md hover:bg-blue-600">
                {selectedChannel ? 'Update' : 'Create'} Channel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Channels;