import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Phone,
  Settings,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { numbersApi } from '@services/api';
import { DIDGroup } from '@shared/types/did-management';
import toast from 'react-hot-toast';

const DIDGroups: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  // Mock user ID - replace with actual user context
  const userId = 'current-user-id';

  const { data: groupsData, isLoading } = useQuery({
    queryKey: ['did-groups', userId],
    queryFn: () => numbersApi.getDIDGroups(userId),
    refetchInterval: 30000,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: { name: string; description: string }) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: 'group-' + Date.now(),
            name: groupData.name,
            description: groupData.description,
            ownerId: userId,
            numbers: [],
            routingConfig: {
              strategy: 'round_robin',
              failoverEnabled: false,
              failoverNumbers: [],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }, 1000);
      });
    },
    onSuccess: () => {
      toast.success('DID Group created successfully!');
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
      queryClient.invalidateQueries({ queryKey: ['did-groups'] });
    },
    onError: () => {
      toast.error('Failed to create DID Group');
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => resolve(true), 1000);
      });
    },
    onSuccess: () => {
      toast.success('DID Group deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['did-groups'] });
    },
    onError: () => {
      toast.error('Failed to delete DID Group');
    },
  });

  // Mock data for development
  const groups: DIDGroup[] = groupsData?.data || [
    {
      id: 'group-1',
      name: 'Sales Team',
      description: 'Primary sales numbers for lead routing',
      ownerId: userId,
      numbers: ['1', '2', '3'],
      routingConfig: {
        strategy: 'round_robin',
        failoverEnabled: true,
        failoverNumbers: ['4'],
      },
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: 'group-2',
      name: 'Support Team',
      description: 'Customer support and technical assistance',
      ownerId: userId,
      numbers: ['5', '6'],
      routingConfig: {
        strategy: 'sequential',
        failoverEnabled: false,
        failoverNumbers: [],
      },
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
    },
  ];

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast.error('Group name is required');
      return;
    }
    createGroupMutation.mutate({
      name: newGroupName,
      description: newGroupDescription,
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this DID Group?')) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  const getRoutingStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'round_robin':
        return 'Round Robin';
      case 'sequential':
        return 'Sequential';
      case 'random':
        return 'Random';
      case 'least_used':
        return 'Least Used';
      default:
        return strategy;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-16 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search DID groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </button>
        </div>
      </div>

      {/* Groups Grid */}
      {filteredGroups.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-charcoal mb-2">
              {groups.length === 0 ? 'No DID Groups Yet' : 'No Groups Found'}
            </h3>
            <p className="text-slate mb-6">
              {groups.length === 0 
                ? 'Create your first DID group to organize and manage your numbers efficiently.'
                : 'Try adjusting your search criteria.'
              }
            </p>
            {groups.length === 0 && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Group
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div key={group.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-charcoal mb-1">
                    {group.name}
                  </h3>
                  {group.description && (
                    <p className="text-sm text-slate">{group.description}</p>
                  )}
                </div>
                <div className="relative">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Group Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded">
                <div className="text-center">
                  <div className="text-xl font-semibold text-charcoal">
                    {group.numbers.length}
                  </div>
                  <div className="text-xs text-slate">Numbers</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-charcoal">
                    {getRoutingStrategyLabel(group.routingConfig.strategy)}
                  </div>
                  <div className="text-xs text-slate">Strategy</div>
                </div>
              </div>

              {/* Routing Status */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate">Failover:</span>
                  <div className="flex items-center">
                    {group.routingConfig.failoverEnabled ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400 mr-1" />
                    )}
                    <span className={group.routingConfig.failoverEnabled ? 'text-green-600' : 'text-gray-400'}>
                      {group.routingConfig.failoverEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-slate">
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button 
                  onClick={() => navigate(`/numbers/groups/${group.id}`)}
                  className="flex-1 btn-secondary text-sm"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Manage
                </button>
                <button className="flex-1 btn-secondary text-sm">
                  <Activity className="w-3 h-3 mr-1" />
                  Analytics
                </button>
                <button 
                  onClick={() => handleDeleteGroup(group.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-charcoal mb-4">
              Create New DID Group
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="input"
                  placeholder="e.g., Sales Team"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Description
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Optional description for this group"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={createGroupMutation.isPending}
                className="flex-1 btn-primary"
              >
                {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DIDGroups;