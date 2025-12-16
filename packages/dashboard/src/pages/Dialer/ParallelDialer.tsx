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
  UserCheck,
  PhoneIncoming,
  PhoneOutgoing,
  Activity,
  Zap,
  Volume2,
  Mic,
  MicOff
} from 'lucide-react';
// Mock types for development
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  company?: string;
  status: 'dialing' | 'ringing' | 'connected' | 'answered';
  callAttempts: number;
  maxAttempts: number;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  doNotCall: boolean;
  customFields: Record<string, any>;
}

interface DialerCampaign {
  id: string;
  name: string;
  description: string;
  type: 'power' | 'parallel' | 'speed';
  status: 'active' | 'paused' | 'completed' | 'stopped';
  contactList: Contact[];
  statistics: {
    totalContacts: number;
    contactsDialed: number;
    contactsConnected: number;
    contactsCompleted: number;
    connectionRate: number;
    completionRate: number;
    averageCallDuration: number;
    callsPerHour: number;
    agentUtilization: number;
  };
  settings: {
    maxConcurrentCalls: number;
    connectionTimeout: number;
    callTimeout: number;
    answerMachineDetection: boolean;
    recordCalls: boolean;
    callerIdNumber: string;
    maxCallsPerContact: number;
  };
}

interface DialerSession {
  id: string;
  campaignId: string;
  agentId: string;
  status: 'active' | 'paused' | 'completed';
  callsHandled: number;
  contactsCompleted: number;
  sessionDuration: number;
  averageCallDuration: number;
  startTime: Date;
  lastActivity: Date;
}
import toast from 'react-hot-toast';

interface ActiveCall {
  id: string;
  contactId: string;
  contact: Contact;
  status: 'dialing' | 'ringing' | 'connected' | 'answered';
  startTime: Date;
  duration: number;
  agentId?: string;
}

const ParallelDialer: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [isDialing, setIsDialing] = useState(false);
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [maxConcurrentCalls, setMaxConcurrentCalls] = useState(5);
  const [showSettings, setShowSettings] = useState(false);

  // Mock user ID - replace with actual user context
  const agentId = 'current-agent-id';

  // Fetch active campaigns
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['parallel-dialer-campaigns'],
    queryFn: async () => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: [
              {
                id: 'campaign-1',
                name: 'Lead Generation Blitz',
                description: 'High-volume lead generation campaign',
                type: 'parallel',
                status: 'active',
                contactList: [],
                statistics: {
                  totalContacts: 1000,
                  contactsDialed: 450,
                  contactsConnected: 180,
                  contactsCompleted: 125,
                  connectionRate: 40.0,
                  completionRate: 69.4,
                  averageCallDuration: 120,
                  callsPerHour: 45,
                  agentUtilization: 92.3,
                },
                settings: {
                  maxConcurrentCalls: 8,
                  connectionTimeout: 25,
                  callTimeout: 30,
                  answerMachineDetection: true,
                  recordCalls: true,
                  callerIdNumber: '+1 (555) 123-4567',
                  maxCallsPerContact: 3,
                },
              },
              {
                id: 'campaign-2',
                name: 'Customer Retention',
                description: 'Reaching out to at-risk customers',
                type: 'parallel',
                status: 'paused',
                contactList: [],
                statistics: {
                  totalContacts: 300,
                  contactsDialed: 275,
                  contactsConnected: 165,
                  contactsCompleted: 148,
                  connectionRate: 60.0,
                  completionRate: 89.7,
                  averageCallDuration: 280,
                  callsPerHour: 25,
                  agentUtilization: 85.7,
                },
                settings: {
                  maxConcurrentCalls: 4,
                  connectionTimeout: 35,
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
    queryKey: ['parallel-dialer-session', agentId],
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
              callsHandled: 15,
              contactsCompleted: 12,
              sessionDuration: 2700,
              averageCallDuration: 145,
              startTime: new Date(Date.now() - 2700000),
              lastActivity: new Date(),
            },
          });
        }, 300);
      });
    },
    enabled: !!selectedCampaign && isDialing,
    refetchInterval: 1000,
  });

  // Start parallel dialing mutation
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
      toast.success('Parallel dialer started successfully!');
      queryClient.invalidateQueries({ queryKey: ['parallel-dialer-session'] });
      // Simulate starting multiple calls
      simulateParallelCalls();
    },
    onError: () => {
      toast.error('Failed to start parallel dialer');
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
      setActiveCalls([]);
      toast.success('Parallel dialer stopped');
      queryClient.invalidateQueries({ queryKey: ['parallel-dialer-session'] });
    },
    onError: () => {
      toast.error('Failed to stop parallel dialer');
    },
  });

  // Answer call mutation
  const answerCallMutation = useMutation({
    mutationFn: async (callId: string) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500);
      });
    },
    onSuccess: (_, callId) => {
      setActiveCalls(prev => prev.map(call => 
        call.id === callId 
          ? { ...call, status: 'answered' as const }
          : call
      ));
      toast.success('Call answered');
    },
  });

  // End call mutation
  const endCallMutation = useMutation({
    mutationFn: async (callId: string) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500);
      });
    },
    onSuccess: (_, callId) => {
      setActiveCalls(prev => prev.filter(call => call.id !== callId));
      toast.success('Call ended');
    },
  });

  const campaigns: DialerCampaign[] = campaignsData?.data || [];
  const session: DialerSession | null = sessionData?.data || null;
  const selectedCampaignData = campaigns.find(c => c.id === selectedCampaign);

  // Simulate parallel calls
  const simulateParallelCalls = () => {
    const mockContacts = [
      { id: '1', firstName: 'John', lastName: 'Smith', phoneNumber: '+1 (555) 123-4567', company: 'Acme Corp' },
      { id: '2', firstName: 'Jane', lastName: 'Doe', phoneNumber: '+1 (555) 987-6543', company: 'Tech Solutions' },
      { id: '3', firstName: 'Bob', lastName: 'Johnson', phoneNumber: '+1 (555) 456-7890', company: 'Innovation Labs' },
      { id: '4', firstName: 'Alice', lastName: 'Wilson', phoneNumber: '+1 (555) 321-0987', company: 'Digital Corp' },
      { id: '5', firstName: 'Charlie', lastName: 'Brown', phoneNumber: '+1 (555) 654-3210', company: 'Future Tech' },
    ];

    const newCalls: ActiveCall[] = mockContacts.slice(0, maxConcurrentCalls).map((contact, index) => ({
      id: `call-${Date.now()}-${index}`,
      contactId: contact.id,
      contact: {
        ...contact,
        status: 'dialing' as const,
        callAttempts: 1,
        maxAttempts: 3,
        priority: 'medium' as const,
        tags: ['prospect'],
        doNotCall: false,
        customFields: {},
      },
      status: 'dialing' as const,
      startTime: new Date(),
      duration: 0,
    }));

    setActiveCalls(newCalls);

    // Simulate call progression
    newCalls.forEach((call, index) => {
      setTimeout(() => {
        setActiveCalls(prev => prev.map(c => 
          c.id === call.id 
            ? { ...c, status: Math.random() > 0.3 ? 'connected' : 'ringing' as const }
            : c
        ));
      }, (index + 1) * 2000);
    });
  };

  // Update call durations
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCalls(prev => prev.map(call => ({
        ...call,
        duration: call.status === 'answered' 
          ? Math.floor((Date.now() - call.startTime.getTime()) / 1000)
          : call.duration
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

  const handleAnswerCall = (callId: string) => {
    answerCallMutation.mutate(callId);
  };

  const handleEndCall = (callId: string) => {
    endCallMutation.mutate(callId);
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

  const getCallStatusColor = (status: string) => {
    switch (status) {
      case 'dialing':
        return 'bg-blue-100 text-blue-800';
      case 'ringing':
        return 'bg-yellow-100 text-yellow-800';
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'answered':
        return 'bg-green-100 text-green-800';
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
          <h1 className="text-2xl font-bold text-charcoal">Parallel Dialer</h1>
          <p className="text-slate mt-1">
            Simultaneous multi-number dialing for maximum efficiency
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
                      <div className="grid grid-cols-4 gap-4 text-sm">
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
                        <div>
                          <div className="font-medium text-charcoal">{campaign.settings.maxConcurrentCalls || maxConcurrentCalls}</div>
                          <div className="text-slate">Max Concurrent</div>
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
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-slate">Max Concurrent:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxConcurrentCalls}
                    onChange={(e) => setMaxConcurrentCalls(parseInt(e.target.value))}
                    className="w-16 px-2 py-1 border rounded text-sm"
                    disabled={isDialing}
                  />
                </div>
                {isDialing && (
                  <span className="flex items-center text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse"></div>
                    Active ({activeCalls.length} calls)
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
                  Start Parallel Dialing
                </button>
              ) : (
                <button
                  onClick={handleStopDialing}
                  disabled={stopDialingMutation.isPending}
                  className="btn-danger text-lg px-6 py-3"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop All Calls
                </button>
              )}
            </div>
          </div>

          {/* Active Calls */}
          {activeCalls.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-charcoal mb-4">
                Active Calls ({activeCalls.length})
              </h2>
              <div className="space-y-3">
                {activeCalls.map((call) => (
                  <div key={call.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-charcoal">
                            {call.contact.firstName} {call.contact.lastName}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCallStatusColor(call.status)}`}>
                            {call.status}
                          </span>
                        </div>
                        <div className="text-sm text-slate space-y-1">
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            {call.contact.phoneNumber}
                          </div>
                          {call.contact.company && (
                            <div>{call.contact.company}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-charcoal">
                          {formatDuration(call.duration)}
                        </div>
                        <div className="text-xs text-slate">
                          {new Date(call.startTime).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {call.status === 'answered' && (
                          <>
                            <button className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                              <Mic className="w-4 h-4" />
                            </button>
                            <button className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {call.status === 'connected' && (
                          <button
                            onClick={() => handleAnswerCall(call.id)}
                            className="btn-primary text-sm"
                          >
                            <PhoneCall className="w-4 h-4 mr-1" />
                            Answer
                          </button>
                        )}
                        <button
                          onClick={() => handleEndCall(call.id)}
                          className="btn-danger text-sm"
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          End
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                  <span className="text-slate">Active Calls:</span>
                  <span className="font-medium text-charcoal">{activeCalls.length}</span>
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
                      {selectedCampaignData.statistics.callsPerHour}
                    </div>
                    <div className="text-slate">Calls/Hour</div>
                  </div>
                </div>

                <div className="space-y-2">
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

          {/* Call Distribution */}
          <div className="card">
            <h3 className="text-lg font-semibold text-charcoal mb-4">Call Distribution</h3>
            <div className="space-y-3">
              {['dialing', 'ringing', 'connected', 'answered'].map((status) => {
                const count = activeCalls.filter(call => call.status === status).length;
                const percentage = activeCalls.length > 0 ? (count / activeCalls.length) * 100 : 0;
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getCallStatusColor(status).replace('text-', 'bg-').replace('100', '500')}`}></div>
                      <span className="text-sm text-slate capitalize">{status.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-charcoal">{count}</span>
                      <span className="text-xs text-slate">({percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

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

export default ParallelDialer;