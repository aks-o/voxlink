import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Users, 
  Phone, 
  Plus, 
  Trash2, 
  Settings, 
  Save,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  Shuffle,
  List,
  Activity
} from 'lucide-react';
import { numbersApi } from '@services/api';
import { DIDGroup, NumberInventoryItem } from '@shared/types/did-management';
import toast from 'react-hot-toast';

const DIDGroupManager: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('numbers');
  const [showAddNumberModal, setShowAddNumberModal] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
  const [routingConfig, setRoutingConfig] = useState({
    strategy: 'round_robin' as const,
    failoverEnabled: false,
    failoverNumbers: [] as string[],
    businessHoursRouting: {
      enabled: false,
      strategy: 'round_robin' as const,
      numbers: [] as string[],
    },
    afterHoursRouting: {
      enabled: false,
      strategy: 'round_robin' as const,
      numbers: [] as string[],
    },
  });

  // Fetch group details
  const { data: groupData, isLoading: groupLoading } = useQuery({
    queryKey: ['did-group', groupId],
    queryFn: () => numbersApi.getDIDGroup(groupId!),
    enabled: !!groupId,
  });

  // Fetch available numbers for adding to group
  const { data: availableNumbersData } = useQuery({
    queryKey: ['available-numbers'],
    queryFn: () => numbersApi.getAvailableNumbers(),
  });

  // Fetch numbers in this group
  const { data: groupNumbersData } = useQuery({
    queryKey: ['group-numbers', groupId],
    queryFn: () => numbersApi.getGroupNumbers(groupId!),
    enabled: !!groupId,
  });

  const updateGroupMutation = useMutation({
    mutationFn: async (updateData: Partial<DIDGroup>) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => resolve(updateData), 1000);
      });
    },
    onSuccess: () => {
      toast.success('Group updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['did-group', groupId] });
    },
    onError: () => {
      toast.error('Failed to update group');
    },
  });

  const addNumbersToGroupMutation = useMutation({
    mutationFn: async (numberIds: string[]) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => resolve(numberIds), 1000);
      });
    },
    onSuccess: () => {
      toast.success('Numbers added to group successfully!');
      setShowAddNumberModal(false);
      setSelectedNumbers([]);
      queryClient.invalidateQueries({ queryKey: ['group-numbers', groupId] });
    },
    onError: () => {
      toast.error('Failed to add numbers to group');
    },
  });

  const removeNumberFromGroupMutation = useMutation({
    mutationFn: async (numberId: string) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => resolve(numberId), 1000);
      });
    },
    onSuccess: () => {
      toast.success('Number removed from group successfully!');
      queryClient.invalidateQueries({ queryKey: ['group-numbers', groupId] });
    },
    onError: () => {
      toast.error('Failed to remove number from group');
    },
  });

  // Mock data for development
  const group: DIDGroup = groupData?.data || {
    id: groupId!,
    name: 'Sales Team',
    description: 'Primary sales numbers for lead routing',
    ownerId: 'current-user-id',
    numbers: ['1', '2', '3'],
    routingConfig: {
      strategy: 'round_robin',
      failoverEnabled: true,
      failoverNumbers: ['4'],
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  };

  const groupNumbers: NumberInventoryItem[] = groupNumbersData?.data || [
    {
      id: '1',
      phoneNumber: '+1 (555) 123-4567',
      countryCode: 'US',
      areaCode: '555',
      city: 'San Francisco',
      region: 'CA',
      status: 'active',
      assignedGroups: [groupId!],
      monthlyRate: 1000,
      setupFee: 500,
      features: ['VOICE', 'SMS'],
      purchaseDate: new Date('2024-01-10'),
      activationDate: new Date('2024-01-10'),
      lastUsed: new Date('2024-01-20'),
      usageStats: {
        totalCalls: 45,
        totalDuration: 2700,
        totalCost: 1350,
        lastMonth: {
          calls: 15,
          duration: 900,
          cost: 450,
        },
      },
      configuration: {
        callForwardingEnabled: true,
        primaryDestination: '+1 (555) 987-6543',
        voicemailEnabled: true,
      },
    },
    {
      id: '2',
      phoneNumber: '+1 (555) 234-5678',
      countryCode: 'US',
      areaCode: '555',
      city: 'San Francisco',
      region: 'CA',
      status: 'active',
      assignedGroups: [groupId!],
      monthlyRate: 1000,
      setupFee: 500,
      features: ['VOICE', 'SMS'],
      purchaseDate: new Date('2024-01-12'),
      activationDate: new Date('2024-01-12'),
      lastUsed: new Date('2024-01-19'),
      usageStats: {
        totalCalls: 32,
        totalDuration: 1920,
        totalCost: 960,
        lastMonth: {
          calls: 12,
          duration: 720,
          cost: 360,
        },
      },
      configuration: {
        callForwardingEnabled: true,
        primaryDestination: '+1 (555) 876-5432',
        voicemailEnabled: true,
      },
    },
  ];

  const availableNumbers: NumberInventoryItem[] = availableNumbersData?.data || [
    {
      id: '5',
      phoneNumber: '+1 (555) 345-6789',
      countryCode: 'US',
      areaCode: '555',
      city: 'San Francisco',
      region: 'CA',
      status: 'active',
      assignedGroups: [],
      monthlyRate: 1000,
      setupFee: 500,
      features: ['VOICE', 'SMS'],
      purchaseDate: new Date('2024-01-08'),
      activationDate: new Date('2024-01-08'),
      usageStats: {
        totalCalls: 0,
        totalDuration: 0,
        totalCost: 0,
        lastMonth: {
          calls: 0,
          duration: 0,
          cost: 0,
        },
      },
      configuration: {
        callForwardingEnabled: false,
        voicemailEnabled: true,
      },
    },
  ];

  React.useEffect(() => {
    if (group) {
      setRoutingConfig(group.routingConfig);
    }
  }, [group]);

  const handleSaveRoutingConfig = () => {
    updateGroupMutation.mutate({
      routingConfig,
    });
  };

  const handleAddNumbers = () => {
    if (selectedNumbers.length === 0) {
      toast.error('Please select at least one number');
      return;
    }
    addNumbersToGroupMutation.mutate(selectedNumbers);
  };

  const handleRemoveNumber = (numberId: string) => {
    if (window.confirm('Are you sure you want to remove this number from the group?')) {
      removeNumberFromGroupMutation.mutate(numberId);
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'round_robin':
        return <RotateCcw className="w-4 h-4" />;
      case 'sequential':
        return <List className="w-4 h-4" />;
      case 'random':
        return <Shuffle className="w-4 h-4" />;
      case 'least_used':
        return <Activity className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (groupLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="card">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/numbers')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-charcoal">{group.name}</h1>
          <p className="text-slate">{group.description}</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate">
          <Users className="w-4 h-4" />
          <span>{groupNumbers.length} numbers</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'numbers', label: 'Numbers', icon: Phone },
              { id: 'routing', label: 'Routing Config', icon: Settings },
              { id: 'analytics', label: 'Analytics', icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-voxlink-blue text-voxlink-blue'
                      : 'border-transparent text-slate hover:text-charcoal hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'numbers' && (
        <div className="space-y-6">
          {/* Numbers Header */}
          <div className="card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-charcoal">
                Group Numbers ({groupNumbers.length})
              </h2>
              <button
                onClick={() => setShowAddNumberModal(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Numbers
              </button>
            </div>
          </div>

          {/* Numbers List */}
          <div className="card">
            {groupNumbers.length === 0 ? (
              <div className="text-center py-12">
                <Phone className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-charcoal mb-2">No Numbers in Group</h3>
                <p className="text-slate mb-6">
                  Add numbers to this group to start routing calls.
                </p>
                <button
                  onClick={() => setShowAddNumberModal(true)}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Number
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage (30d)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Used
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupNumbers.map((number) => (
                      <tr key={number.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-3 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-charcoal">
                                {number.phoneNumber}
                              </div>
                              <div className="text-sm text-slate">
                                {number.city}, {number.region}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            number.status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {number.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                          <div>
                            <div>{number.usageStats.lastMonth.calls} calls</div>
                            <div className="text-xs text-slate">
                              {formatDuration(number.usageStats.lastMonth.duration)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-charcoal">
                          {number.lastUsed ? new Date(number.lastUsed).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleRemoveNumber(number.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'routing' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-charcoal mb-6">Routing Configuration</h2>
            
            {/* Basic Routing Strategy */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-3">
                  Routing Strategy
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'round_robin', label: 'Round Robin', description: 'Distribute calls evenly' },
                    { value: 'sequential', label: 'Sequential', description: 'Try numbers in order' },
                    { value: 'random', label: 'Random', description: 'Random selection' },
                    { value: 'least_used', label: 'Least Used', description: 'Route to least busy' },
                  ].map((strategy) => (
                    <button
                      key={strategy.value}
                      onClick={() => setRoutingConfig(prev => ({ ...prev, strategy: strategy.value as any }))}
                      className={`p-3 border rounded-lg text-left transition-colors ${
                        routingConfig.strategy === strategy.value
                          ? 'border-voxlink-blue bg-blue-50 text-voxlink-blue'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        {getStrategyIcon(strategy.value)}
                        <span className="ml-2 font-medium text-sm">{strategy.label}</span>
                      </div>
                      <div className="text-xs text-slate">{strategy.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Failover Configuration */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-charcoal">
                    Failover Protection
                  </label>
                  <button
                    onClick={() => setRoutingConfig(prev => ({ 
                      ...prev, 
                      failoverEnabled: !prev.failoverEnabled 
                    }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      routingConfig.failoverEnabled ? 'bg-voxlink-blue' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        routingConfig.failoverEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-sm text-slate mb-3">
                  Automatically route calls to backup numbers when primary numbers are unavailable
                </p>
                
                {routingConfig.failoverEnabled && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Failover Numbers
                    </label>
                    <p className="text-sm text-slate">
                      Configure failover numbers in the Numbers tab by adding them to this group.
                    </p>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveRoutingConfig}
                  disabled={updateGroupMutation.isPending}
                  className="btn-primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateGroupMutation.isPending ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="card">
          <div className="text-center py-12">
            <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-charcoal mb-2">Analytics Coming Soon</h3>
            <p className="text-slate">
              Detailed analytics and reporting for this DID group will be available soon.
            </p>
          </div>
        </div>
      )}

      {/* Add Numbers Modal */}
      {showAddNumberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-charcoal mb-4">
              Add Numbers to Group
            </h2>
            
            {availableNumbers.length === 0 ? (
              <div className="text-center py-8">
                <Phone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-slate">No available numbers to add to this group.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {availableNumbers.map((number) => (
                  <label
                    key={number.id}
                    className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedNumbers.includes(number.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNumbers(prev => [...prev, number.id]);
                        } else {
                          setSelectedNumbers(prev => prev.filter(id => id !== number.id));
                        }
                      }}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-charcoal">{number.phoneNumber}</div>
                      <div className="text-sm text-slate">{number.city}, {number.region}</div>
                    </div>
                    <div className="text-sm text-slate">
                      {formatPrice(number.monthlyRate)}/month
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAddNumberModal(false);
                  setSelectedNumbers([]);
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNumbers}
                disabled={selectedNumbers.length === 0 || addNumbersToGroupMutation.isPending}
                className="flex-1 btn-primary"
              >
                {addNumbersToGroupMutation.isPending 
                  ? 'Adding...' 
                  : `Add ${selectedNumbers.length} Number${selectedNumbers.length !== 1 ? 's' : ''}`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DIDGroupManager;