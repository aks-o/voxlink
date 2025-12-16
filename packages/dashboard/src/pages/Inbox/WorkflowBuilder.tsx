import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Workflow, Play, Pause, Edit, Trash2, Copy, BarChart3, Zap, MessageSquare, Clock, User } from 'lucide-react';
import { MessageWorkflow, WorkflowTrigger, WorkflowAction } from '../../../shared/src/types/messaging';

const WorkflowBuilder: React.FC = () => {
  const [workflows, setWorkflows] = useState<MessageWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<MessageWorkflow | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockWorkflows: MessageWorkflow[] = [
        {
          id: '1',
          name: 'Welcome Series',
          description: 'Automated welcome message series for new customers',
          triggers: [
            {
              id: 'trigger1',
              type: 'customer_action',
              config: { action: 'signup', delay: 0 }
            }
          ],
          actions: [
            {
              id: 'action1',
              type: 'send_message',
              config: { templateId: 'welcome-template', delay: 0 }
            },
            {
              id: 'action2',
              type: 'send_message',
              config: { templateId: 'onboarding-template', delay: 86400 }
            }
          ],
          conditions: [],
          isActive: true,
          executionCount: 1245,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
          createdBy: 'user1'
        },
        {
          id: '2',
          name: 'Appointment Reminders',
          description: 'Send reminders for upcoming appointments',
          triggers: [
            {
              id: 'trigger2',
              type: 'time_based',
              config: { schedule: 'daily', time: '09:00' }
            }
          ],
          actions: [
            {
              id: 'action3',
              type: 'send_message',
              config: { templateId: 'appointment-reminder', delay: 0 }
            }
          ],
          conditions: [
            {
              id: 'condition1',
              field: 'appointment_date',
              operator: 'equals',
              value: 'tomorrow'
            }
          ],
          isActive: true,
          executionCount: 892,
          createdAt: new Date('2024-01-12'),
          updatedAt: new Date('2024-01-18'),
          createdBy: 'user1'
        },
        {
          id: '3',
          name: 'Support Escalation',
          description: 'Escalate unresolved support tickets',
          triggers: [
            {
              id: 'trigger3',
              type: 'message_received',
              config: { channel: 'sms', keywords: ['urgent', 'emergency'] }
            }
          ],
          actions: [
            {
              id: 'action4',
              type: 'assign_agent',
              config: { agentId: 'senior-agent', priority: 'high' }
            },
            {
              id: 'action5',
              type: 'send_message',
              config: { templateId: 'escalation-ack', delay: 0 }
            }
          ],
          conditions: [],
          isActive: true,
          executionCount: 156,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-19'),
          createdBy: 'user2'
        },
        {
          id: '4',
          name: 'Abandoned Cart Recovery',
          description: 'Re-engage customers who abandoned their cart',
          triggers: [
            {
              id: 'trigger4',
              type: 'customer_action',
              config: { action: 'cart_abandoned', delay: 3600 }
            }
          ],
          actions: [
            {
              id: 'action6',
              type: 'send_message',
              config: { templateId: 'cart-reminder', delay: 0 }
            },
            {
              id: 'action7',
              type: 'send_message',
              config: { templateId: 'discount-offer', delay: 86400 }
            }
          ],
          conditions: [
            {
              id: 'condition2',
              field: 'cart_value',
              operator: 'greater_than',
              value: 50
            }
          ],
          isActive: false,
          executionCount: 234,
          createdAt: new Date('2024-01-08'),
          updatedAt: new Date('2024-01-16'),
          createdBy: 'user2'
        },
        {
          id: '5',
          name: 'Feedback Collection',
          description: 'Collect feedback after service interactions',
          triggers: [
            {
              id: 'trigger5',
              type: 'customer_action',
              config: { action: 'service_completed', delay: 3600 }
            }
          ],
          actions: [
            {
              id: 'action8',
              type: 'send_message',
              config: { templateId: 'feedback-request', delay: 0 }
            }
          ],
          conditions: [],
          isActive: true,
          executionCount: 567,
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-14'),
          createdBy: 'user1'
        }
      ];
      
      setWorkflows(mockWorkflows);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && workflow.isActive) ||
                         (filterStatus === 'inactive' && !workflow.isActive);
    return matchesSearch && matchesFilter;
  });

  const getTriggerIcon = (type: WorkflowTrigger['type']) => {
    switch (type) {
      case 'message_received': return <MessageSquare className="w-4 h-4" />;
      case 'time_based': return <Clock className="w-4 h-4" />;
      case 'customer_action': return <User className="w-4 h-4" />;
      case 'keyword_detected': return <MessageSquare className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getActionIcon = (type: WorkflowAction['type']) => {
    switch (type) {
      case 'send_message': return <MessageSquare className="w-4 h-4" />;
      case 'assign_agent': return <User className="w-4 h-4" />;
      case 'add_tag': return <Zap className="w-4 h-4" />;
      case 'create_ticket': return <Zap className="w-4 h-4" />;
      case 'webhook': return <Zap className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const handleToggleWorkflow = async (workflowId: string) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (workflow) {
        setWorkflows(prev => prev.map(w => 
          w.id === workflowId ? { ...w, isActive: !w.isActive } : w
        ));
      }
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
    }
  };

  const handleDuplicateWorkflow = async (workflow: MessageWorkflow) => {
    try {
      const duplicatedWorkflow: MessageWorkflow = {
        ...workflow,
        id: `workflow_${Date.now()}`,
        name: `${workflow.name} (Copy)`,
        executionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setWorkflows(prev => [...prev, duplicatedWorkflow]);
    } catch (error) {
      console.error('Failed to duplicate workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        setWorkflows(prev => prev.filter(workflow => workflow.id !== workflowId));
      } catch (error) {
        console.error('Failed to delete workflow:', error);
      }
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Workflows</h1>
          <p className="text-gray-600 mt-1">Automate your messaging with intelligent workflows</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search workflows..."
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
              <option value="all">All Workflows</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Workflows Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-voxlink-blue"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => (
            <div key={workflow.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    workflow.isActive ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Workflow className={`w-5 h-5 ${
                      workflow.isActive ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      workflow.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {workflow.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">{workflow.description}</p>

              {/* Workflow Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {workflow.triggers.length}
                  </div>
                  <div className="text-xs text-gray-500">Triggers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {workflow.actions.length}
                  </div>
                  <div className="text-xs text-gray-500">Actions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {workflow.executionCount}
                  </div>
                  <div className="text-xs text-gray-500">Executions</div>
                </div>
              </div>

              {/* Triggers Preview */}
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-500 mb-2">TRIGGERS:</div>
                <div className="flex flex-wrap gap-1">
                  {workflow.triggers.slice(0, 2).map((trigger, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                    >
                      {getTriggerIcon(trigger.type)}
                      <span className="ml-1 capitalize">{trigger.type.replace('_', ' ')}</span>
                    </span>
                  ))}
                  {workflow.triggers.length > 2 && (
                    <span className="text-xs text-gray-500">+{workflow.triggers.length - 2} more</span>
                  )}
                </div>
              </div>

              {/* Actions Preview */}
              <div className="mb-4">
                <div className="text-xs font-medium text-gray-500 mb-2">ACTIONS:</div>
                <div className="flex flex-wrap gap-1">
                  {workflow.actions.slice(0, 2).map((action, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {getActionIcon(action.type)}
                      <span className="ml-1 capitalize">{action.type.replace('_', ' ')}</span>
                    </span>
                  ))}
                  {workflow.actions.length > 2 && (
                    <span className="text-xs text-gray-500">+{workflow.actions.length - 2} more</span>
                  )}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Executions:</span>
                  <span className="font-medium">{workflow.executionCount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">{workflow.updatedAt.toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleToggleWorkflow(workflow.id)}
                    className={`p-2 rounded-md transition-colors ${
                      workflow.isActive
                        ? 'text-orange-600 hover:bg-orange-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={workflow.isActive ? 'Pause Workflow' : 'Activate Workflow'}
                  >
                    {workflow.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setSelectedWorkflow(workflow)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    title="Edit Workflow"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateWorkflow(workflow)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    title="Duplicate Workflow"
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
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Workflow"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredWorkflows.length === 0 && !loading && (
        <div className="text-center py-12">
          <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first message workflow to automate your communications'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </button>
          )}
        </div>
      )}

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create New Workflow</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workflow Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter workflow name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe what this workflow does"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workflow Template
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent">
                    <option value="">Start from scratch</option>
                    <option value="welcome">Welcome Series</option>
                    <option value="reminder">Appointment Reminders</option>
                    <option value="escalation">Support Escalation</option>
                    <option value="cart">Abandoned Cart Recovery</option>
                    <option value="feedback">Feedback Collection</option>
                  </select>
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
                Create Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilder;