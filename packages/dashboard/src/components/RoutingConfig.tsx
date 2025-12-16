import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  Clock,
  Calendar,
  Phone,
  Users,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  MoreVertical,
  Play,
  Pause
} from 'lucide-react';
import { numbersApi } from '@services/api';
import { RoutingRule, RoutingCondition, RoutingAction } from '@shared/types/did-management';
import toast from 'react-hot-toast';

const RoutingConfig: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<RoutingRule | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    priority: 1,
    conditions: [] as RoutingCondition[],
    actions: [] as RoutingAction[],
    enabled: true,
  });

  // Mock user ID - replace with actual user context
  const userId = 'current-user-id';

  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['routing-rules', userId],
    queryFn: () => numbersApi.getRoutingRules(userId),
    refetchInterval: 30000,
  });

  const createRuleMutation = useMutation({
    mutationFn: async (ruleData: typeof newRule) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: 'rule-' + Date.now(),
            ...ruleData,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }, 1000);
      });
    },
    onSuccess: () => {
      toast.success('Routing rule created successfully!');
      setShowCreateModal(false);
      resetNewRule();
      queryClient.invalidateQueries({ queryKey: ['routing-rules'] });
    },
    onError: () => {
      toast.error('Failed to create routing rule');
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ ruleId, updates }: { ruleId: string; updates: Partial<RoutingRule> }) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => resolve(updates), 1000);
      });
    },
    onSuccess: () => {
      toast.success('Routing rule updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['routing-rules'] });
    },
    onError: () => {
      toast.error('Failed to update routing rule');
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => resolve(true), 1000);
      });
    },
    onSuccess: () => {
      toast.success('Routing rule deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['routing-rules'] });
    },
    onError: () => {
      toast.error('Failed to delete routing rule');
    },
  });

  // Mock data for development
  const rules: RoutingRule[] = rulesData?.data || [
    {
      id: 'rule-1',
      name: 'Business Hours Routing',
      description: 'Route calls during business hours to sales team',
      priority: 1,
      conditions: [
        {
          type: 'time_of_day',
          operator: 'greater_than',
          value: '09:00',
        },
        {
          type: 'time_of_day',
          operator: 'less_than',
          value: '17:00',
        },
        {
          type: 'day_of_week',
          operator: 'not_equals',
          value: 'weekend',
        },
      ],
      actions: [
        {
          type: 'forward_to_group',
          target: 'group-1',
          timeout: 30,
        },
      ],
      enabled: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: 'rule-2',
      name: 'After Hours Voicemail',
      description: 'Send calls to voicemail outside business hours',
      priority: 2,
      conditions: [
        {
          type: 'time_of_day',
          operator: 'less_than',
          value: '09:00',
        },
      ],
      actions: [
        {
          type: 'send_to_voicemail',
          target: 'After hours voicemail message',
        },
      ],
      enabled: true,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
    },
    {
      id: 'rule-3',
      name: 'VIP Customer Routing',
      description: 'Priority routing for VIP customers',
      priority: 0,
      conditions: [
        {
          type: 'caller_id',
          operator: 'contains',
          value: '+1555',
        },
      ],
      actions: [
        {
          type: 'forward_to_number',
          target: '+1 (555) 999-8888',
          timeout: 15,
        },
      ],
      enabled: false,
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-19'),
    },
  ];

  const resetNewRule = () => {
    setNewRule({
      name: '',
      description: '',
      priority: 1,
      conditions: [],
      actions: [],
      enabled: true,
    });
  };

  const addCondition = () => {
    setNewRule(prev => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          type: 'time_of_day',
          operator: 'equals',
          value: '',
        },
      ],
    }));
  };

  const addAction = () => {
    setNewRule(prev => ({
      ...prev,
      actions: [
        ...prev.actions,
        {
          type: 'forward_to_number',
          target: '',
        },
      ],
    }));
  };

  const removeCondition = (index: number) => {
    setNewRule(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const removeAction = (index: number) => {
    setNewRule(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (index: number, field: keyof RoutingCondition, value: any) => {
    setNewRule(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      ),
    }));
  };

  const updateAction = (index: number, field: keyof RoutingAction, value: any) => {
    setNewRule(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) =>
        i === index ? { ...action, [field]: value } : action
      ),
    }));
  };

  const handleCreateRule = () => {
    if (!newRule.name.trim()) {
      toast.error('Rule name is required');
      return;
    }
    if (newRule.conditions.length === 0) {
      toast.error('At least one condition is required');
      return;
    }
    if (newRule.actions.length === 0) {
      toast.error('At least one action is required');
      return;
    }
    createRuleMutation.mutate(newRule);
  };

  const toggleRuleEnabled = (ruleId: string, enabled: boolean) => {
    updateRuleMutation.mutate({
      ruleId,
      updates: { enabled },
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this routing rule?')) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  const getConditionLabel = (condition: RoutingCondition) => {
    const typeLabels = {
      time_of_day: 'Time',
      day_of_week: 'Day',
      caller_id: 'Caller ID',
      number_called: 'Number Called',
      call_queue_length: 'Queue Length',
    };
    
    const operatorLabels = {
      equals: '=',
      not_equals: '≠',
      contains: 'contains',
      starts_with: 'starts with',
      greater_than: '>',
      less_than: '<',
    };

    return `${typeLabels[condition.type]} ${operatorLabels[condition.operator]} ${condition.value}`;
  };

  const getActionLabel = (action: RoutingAction) => {
    const typeLabels = {
      forward_to_number: 'Forward to',
      forward_to_group: 'Forward to group',
      send_to_voicemail: 'Voicemail',
      play_message: 'Play message',
      hangup: 'Hang up',
    };

    return `${typeLabels[action.type]} ${action.target || ''}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-charcoal">Call Routing Rules</h2>
            <p className="text-sm text-slate mt-1">
              Configure flexible call routing and forwarding rules for your numbers
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Rule
          </button>
        </div>
      </div>

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-charcoal mb-2">No Routing Rules Yet</h3>
            <p className="text-slate mb-6">
              Create your first routing rule to automatically handle incoming calls based on conditions.
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Rule
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {rules
            .sort((a, b) => a.priority - b.priority)
            .map((rule) => (
              <div key={rule.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-charcoal">{rule.name}</h3>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                        Priority {rule.priority}
                      </span>
                      <button
                        onClick={() => toggleRuleEnabled(rule.id, !rule.enabled)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          rule.enabled ? 'bg-voxlink-blue' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                            rule.enabled ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-slate mb-3">{rule.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1 hover:bg-gray-100 rounded text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rule Logic Flow */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    {/* Conditions */}
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        When
                      </div>
                      <div className="space-y-1">
                        {rule.conditions.map((condition, index) => (
                          <div key={index} className="flex items-center text-sm">
                            {index > 0 && <span className="text-gray-400 mr-2">AND</span>}
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {getConditionLabel(condition)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <ArrowRight className="w-5 h-5 text-gray-400" />

                    {/* Actions */}
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Then
                      </div>
                      <div className="space-y-1">
                        {rule.actions.map((action, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              {getActionLabel(action)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rule Status */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-slate">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      {rule.enabled ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                      ) : (
                        <Pause className="w-4 h-4 text-gray-400 mr-1" />
                      )}
                      <span>{rule.enabled ? 'Active' : 'Disabled'}</span>
                    </div>
                    <div>
                      Created {new Date(rule.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-charcoal mb-6">
              Create New Routing Rule
            </h2>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={newRule.name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                    placeholder="e.g., Business Hours Routing"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={newRule.priority}
                    onChange={(e) => setNewRule(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                    className="input"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Description
                </label>
                <textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                  className="input"
                  rows={2}
                  placeholder="Optional description for this rule"
                />
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-charcoal">
                    Conditions *
                  </label>
                  <button
                    onClick={addCondition}
                    className="btn-secondary text-sm"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Condition
                  </button>
                </div>
                
                {newRule.conditions.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-slate">No conditions added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {newRule.conditions.map((condition, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        {index > 0 && (
                          <span className="text-sm font-medium text-gray-500">AND</span>
                        )}
                        
                        <select
                          value={condition.type}
                          onChange={(e) => updateCondition(index, 'type', e.target.value)}
                          className="input flex-1"
                        >
                          <option value="time_of_day">Time of Day</option>
                          <option value="day_of_week">Day of Week</option>
                          <option value="caller_id">Caller ID</option>
                          <option value="number_called">Number Called</option>
                          <option value="call_queue_length">Queue Length</option>
                        </select>

                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                          className="input flex-1"
                        >
                          <option value="equals">Equals</option>
                          <option value="not_equals">Not Equals</option>
                          <option value="contains">Contains</option>
                          <option value="starts_with">Starts With</option>
                          <option value="greater_than">Greater Than</option>
                          <option value="less_than">Less Than</option>
                        </select>

                        <input
                          type="text"
                          value={condition.value}
                          onChange={(e) => updateCondition(index, 'value', e.target.value)}
                          className="input flex-1"
                          placeholder="Value"
                        />

                        <button
                          onClick={() => removeCondition(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-charcoal">
                    Actions *
                  </label>
                  <button
                    onClick={addAction}
                    className="btn-secondary text-sm"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Action
                  </button>
                </div>
                
                {newRule.actions.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <Phone className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-slate">No actions added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {newRule.actions.map((action, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <select
                          value={action.type}
                          onChange={(e) => updateAction(index, 'type', e.target.value)}
                          className="input flex-1"
                        >
                          <option value="forward_to_number">Forward to Number</option>
                          <option value="forward_to_group">Forward to Group</option>
                          <option value="send_to_voicemail">Send to Voicemail</option>
                          <option value="play_message">Play Message</option>
                          <option value="hangup">Hang Up</option>
                        </select>

                        <input
                          type="text"
                          value={action.target || ''}
                          onChange={(e) => updateAction(index, 'target', e.target.value)}
                          className="input flex-1"
                          placeholder={
                            action.type === 'forward_to_number' ? 'Phone number' :
                            action.type === 'forward_to_group' ? 'Group ID' :
                            action.type === 'send_to_voicemail' ? 'Voicemail message' :
                            action.type === 'play_message' ? 'Message text' :
                            'Target'
                          }
                        />

                        {(action.type === 'forward_to_number' || action.type === 'forward_to_group') && (
                          <input
                            type="number"
                            value={action.timeout || ''}
                            onChange={(e) => updateAction(index, 'timeout', parseInt(e.target.value))}
                            className="input w-24"
                            placeholder="Timeout (s)"
                          />
                        )}

                        <button
                          onClick={() => removeAction(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetNewRule();
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRule}
                disabled={createRuleMutation.isPending}
                className="flex-1 btn-primary"
              >
                {createRuleMutation.isPending ? 'Creating...' : 'Create Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutingConfig;