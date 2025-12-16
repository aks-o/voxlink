import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Play, 
  Pause, 
  Square, 
  Phone, 
  PhoneCall,
  Users, 
  Clock, 
  Target,
  TrendingUp,
  Settings,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Loader2,
  SkipForward,
  Volume2,
  Mic,
  MicOff
} from 'lucide-react';
import { DialerCampaign, DialerSession, Contact, PowerDialerConfig } from '@shared/types/dialer';
import toast from 'react-hot-toast';

const PowerDialer: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [isDialing, setIsDialing] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Mock user ID - replace with actual user context
  const agentId = 'current-agent-id';

  // Fetch active campaigns
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['power-dialer-campaigns'],
    queryFn: async () => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: [
              {
                id: 'campaign-1',
                name: 'Q1 Sales Outreach',
                description: 'Quarterly sales campaign targeting new prospects',
                type: 'power',
                status: 'active',
                contactList: [],
                statistics: {
                  totalContacts: 500,
                  contactsDialed: 125,
                  contactsConnected: 45,
                  contactsCompleted: 32,
                  connectionRate: 36.0,
                  completionRate: 71.1,
                  averageCallDuration: 180,
                  callsPerHour: 15,
                  agentUtilization: 85.5,
                },
                settings: {
                  dialRatio: 1.2,
                  maxRetries: 3,
                  retryInterval: 60,
                  callTimeout: 30,
                  answerMachineDetection: true,
                  recordCalls: true,
                  callerIdNumber: '+1 (555) 123-4567',
                  maxCallsPerContact: 3,
                },
              },
              {
                id: 'campaign-2',
                name: 'Customer Follow-up',
                description: 'Following up with existing customers',
                type: 'power',
                status: 'paused',
                contactList: [],
                statistics: {
                  totalContacts: 200,
                  contactsDialed: 180,
                  contactsConnected: 95,
                  contactsCompleted: 88,
                  connectionRate: 52.8,
                  completionRate: 92.6,
                  averageCallDuration: 240,
                  callsPerHour: 12,
                  agentUtilization: 78.2,
                },
                settings: {
                  dialRatio: 1.0,
                  maxRetries: 2,
                  retryInterval: 120,
                  callTimeout: 45,
                  answerMachineDetection: false,
                  recordCalls: true,
                  callerIdNumber: '+1 (555) 987-6543',
                  maxCallsPerContact: 2,
                },
              },
            ],
          });
        }, 500);
      });
    },
    refetchInterval: 5000,
  });

  // Fetch current session
  const { data: sessionData } = useQuery({
    queryKey: ['dialer-session', agentId],
    queryFn: async () => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              id: 'session-1',
              campaignId: selectedCampaign,
              agentId,
              status: 'active',
              callsHandled: 8,
              contactsCompleted: 6,
              sessionDuration: 3600,
              averageCallDuration: 195,
              startTime: new Date(Date.now() - 3600000),
              lastActivity: new Date(),
            },
          });
        }, 300);
      });
    },
    enabled: !!selectedCampaign && isDialing,
    refetchInterval: 1000,
  });

  // Start dialing mutation
  const startDialingMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1000);
      });
    },
    onSuccess: () => {
      setIsDialing(true);
      toast.success('Power dialer started successfully!');
      queryClient.invalidateQueries({ queryKey: ['dialer-session'] });
    },
    onError: () => {
      toast.error('Failed to start power dialer');
    },
  });

  // Stop dialing mutation
  const stopDialingMutation = useMutation({
    mutationFn: async () => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500);
      });
    },
    onSuccess: () => {
      setIsDialing(false);
      setCurrentContact(null);
      setCallDuration(0);
      toast.success('Power dialer stopped');
      queryClient.invalidateQueries({ queryKey: ['dialer-session'] });
    },
    onError: () => {
      toast.error('Failed to stop power dialer');
    },
  });

  // Skip contact mutation
  const skipContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500);
      });
    },
    onSuccess: () => {
      toast.success('Contact skipped');
      // Simulate getting next contact
      setTimeout(() => {
        setCurrentContact({
          id: 'contact-' + Date.now(),
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+1 (555) 123-4567',
          company: 'Acme Corp',
          status: 'dialing',
          callAttempts: 0,
          maxAttempts: 3,
          priority: 'medium',
          tags: ['prospect'],
          doNotCall: false,
          customFields: {},
        });
      }, 1000);
    },
  });

  const campaigns: DialerCampaign[] = campaignsData?.data || [];
  const session: DialerSession | null = sessionData?.data || null;
  const selectedCampaignData = campaigns.find(c => c.id === selectedCampaign);

  // Simulate call timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDialing && currentContact?.status === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isDialing, currentContact?.status]);

  // Simulate getting next contact when dialing starts
  useEffect(() => {
    if (isDialing && !currentContact) {
      setTimeout(() => {
        setCurrentContact({
          id: 'contact-1',
          firstName: 'Jane',
          lastName: 'Smith',
          phoneNumber: '+1 (555) 987-6543',
          company: 'Tech Solutions Inc',
          status: 'dialing',
          callAttempts: 1,
          maxAttempts: 3,
          priority: 'high',
          tags: ['hot-lead'],
          doNotCall: false,
          customFields: {
            lastPurchase: '2023-12-15',
            value: '$5,000',
          },
        });
      }, 2000);
    }
  }, [isDialing, currentContact]);

  const handleStartDialing = () => {
    if (!selectedCampaign) {
      toast.error('Please select a campaign first');
      return;
    }
    startDialingMutation.mutate(selectedCampaign);
  };

  const handleStopDialing = () => {
    stopDialingMutation.mutate();
  };

  const handleSkipContact = () => {
    if (currentContact) {
      skipContactMutation.mutate(currentContact.id);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'stopped':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContactStatusColor = (status: string) => {
    switch (status) {
      case 'dialing':
        return 'bg-blue-100 text-blue-800';
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'no_answer':
        return 'bg-yellow-100 text-yellow-800';
      case 'busy':
        return 'bg-orange-100 text-orange-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (campaignsLoading) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Power Dialer</h1>
          <p className="text-slate mt-1">
            Automated sequential dialing with intelligent call management
          </p>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="btn-secondary"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Dialer Interface */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold text-charcoal mb-4">Select Campaign</h2>
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedCampaign === campaign.id
                      ? 'border-voxlink-blue bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCampaign(campaign.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-charcoal">{campaign.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate mb-3">{campaign.description}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-charcoal">{campaign.statistics.totalContacts}</div>
                          <div className="text-slate">Total Contacts</div>
                        </div>
                        <div>
                          <div className="font-medium text-charcoal">{campaign.statistics.connectionRate.toFixed(1)}%</div>
                          <div className="text-slate">Connection Rate</div>
                        </div>
                        <div>
                          <div className="font-medium text-charcoal">{campaign.statistics.callsPerHour}</div>
                          <div className="text-slate">Calls/Hour</div>
                        </div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="campaign"
                      checked={selectedCampaign === campaign.id}
                      onChange={() => setSelectedCampaign(campaign.id)}
                      className="ml-4"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dialer Controls */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-charcoal">Dialer Controls</h2>
              <div className="flex items-center space-x-2">
                {isDialing && (
                  <span className="flex items-center text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
                    Active
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4 mb-6">
              {!isDialing ? (
                <button
                  onClick={handleStartDialing}
                  disabled={!selectedCampaign || startDialingMutation.isPending}
                  className="btn-primary text-lg px-8 py-4"
                >
                  {startDialingMutation.isPending ? (
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-6 h-6 mr-2" />
                  )}
                  Start Dialing
                </button>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleStopDialing}
                    disabled={stopDialingMutation.isPending}
                    className="btn-danger text-lg px-6 py-3"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Stop
                  </button>
                  <button
                    onClick={handleSkipContact}
                    disabled={!currentContact || skipContactMutation.isPending}
                    className="btn-secondary text-lg px-6 py-3"
                  >
                    <SkipForward className="w-5 h-5 mr-2" />
                    Skip
                  </button>
                </div>
              )}
            </div>

            {/* Current Contact */}
            {currentContact && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-charcoal">
                      {currentContact.firstName} {currentContact.lastName}
                    </h3>
                    <div className="text-sm text-slate space-y-1">
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {currentContact.phoneNumber}
                      </div>
                      {currentContact.company && (
                        <div>{currentContact.company}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getContactStatusColor(currentContact.status)}`}>
                      {currentContact.status.replace('_', ' ')}
                    </span>
                    <div className="text-sm text-slate mt-1">
                      Attempt {currentContact.callAttempts} of {currentContact.maxAttempts}
                    </div>
                  </div>
                </div>

                {currentContact.status === 'connected' && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-lg font-semibold text-green-800">
                        {formatDuration(callDuration)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className={`p-2 rounded-lg ${isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                        <button className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <button className="btn-danger">
                      <Phone className="w-4 h-4 mr-2" />
                      End Call
                    </button>
                  </div>
                )}

                {/* Contact Details */}
                {Object.keys(currentContact.customFields).length > 0 && (
                  <div className="mt-4 p-3 bg-white rounded-lg">
                    <h4 className="font-medium text-charcoal mb-2">Contact Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(currentContact.customFields).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-slate">{key}:</span>
                          <span className="ml-2 text-charcoal">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          {/* Session Stats */}
          {session && (
            <div className="card">
              <h3 className="text-lg font-semibold text-charcoal mb-4">Current Session</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate">Duration:</span>
                  <span className="font-medium text-charcoal">
                    {formatDuration(session.sessionDuration)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate">Calls Handled:</span>
                  <span className="font-medium text-charcoal">{session.callsHandled}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate">Completed:</span>
                  <span className="font-medium text-charcoal">{session.contactsCompleted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate">Avg Call Time:</span>
                  <span className="font-medium text-charcoal">
                    {formatDuration(session.averageCallDuration)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Campaign Stats */}
          {selectedCampaignData && (
            <div className="card">
              <h3 className="text-lg font-semibold text-charcoal mb-4">Campaign Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate">Contacts Dialed</span>
                    <span className="text-sm font-medium text-charcoal">
                      {selectedCampaignData.statistics.contactsDialed} / {selectedCampaignData.statistics.totalContacts}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-voxlink-blue h-2 rounded-full" 
                      style={{ 
                        width: `${(selectedCampaignData.statistics.contactsDialed / selectedCampaignData.statistics.totalContacts) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-charcoal">
                      {selectedCampaignData.statistics.connectionRate.toFixed(1)}%
                    </div>
                    <div className="text-slate">Connection Rate</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-charcoal">
                      {selectedCampaignData.statistics.completionRate.toFixed(1)}%
                    </div>
                    <div className="text-slate">Completion Rate</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate">Calls/Hour:</span>
                    <span className="font-medium text-charcoal">{selectedCampaignData.statistics.callsPerHour}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate">Avg Duration:</span>
                    <span className="font-medium text-charcoal">
                      {formatDuration(selectedCampaignData.statistics.averageCallDuration)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate">Utilization:</span>
                    <span className="font-medium text-charcoal">
                      {selectedCampaignData.statistics.agentUtilization.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full btn-secondary text-sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </button>
              <button className="w-full btn-secondary text-sm">
                <Users className="w-4 h-4 mr-2" />
                Manage Contacts
              </button>
              <button className="w-full btn-secondary text-sm">
                <Target className="w-4 h-4 mr-2" />
                Campaign Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerDialer;