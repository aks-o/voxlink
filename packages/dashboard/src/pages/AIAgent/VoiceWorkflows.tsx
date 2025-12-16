import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Workflow, Search, Filter, Play, Pause, Edit, Trash2, Copy, BarChart3 } from 'lucide-react';
import { VoiceWorkflow, CreateVoiceWorkflowRequest } from '../../../shared/src/types/ai-agent';
import { aiAgentApi } from '../../services/api';
import WorkflowDesigner from '../../components/AIAgent/WorkflowDesigner';

const VoiceWorkflows: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [workflows, setWorkflows] = useState<VoiceWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      // For now, use mock data - replace with actual API call when backend is ready
      const mockWorkflows: VoiceWorkflow[] = [
      {
        id: '1',
        name: 'Customer Support Flow',
        description: 'Standard customer support conversation flow',
        steps: [
          {
            id: 'step1',
            type: 'greeting',
            name: 'Welcome Greeting',
            content: 'Hello! Thank you for calling. How can I help you today?',
            conditions: [],
            nextSteps: ['step2']
          },
          {
            id: 'step2',
            type: 'question',
            name: 'Issue Identification',
            content: 'Can you please describe the issue you\'re experiencing?',
            conditions: [],
            nextSteps: ['step3']
          }
        ],
        conditions: [],
        escalationRules: [],
        analytics: {
          totalExecutions: 1250,
          successRate: 0.88,
          averageCompletionTime: 180,
          commonExitPoints: { 'step2': 150, 'step3': 100 },
          userSatisfactionScore: 4.2
        },
        isActive: true,
        version: 1,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        createdBy: 'user1',
        tags: ['customer-service', 'support']
      },
      {
        id: '2',
        name: 'Lead Qualification Flow',
        description: 'Qualifies potential leads and gathers contact information',
        steps: [
          {
            id: 'step1',
            type: 'greeting',
            name: 'Sales Greeting',
            content: 'Hi! I\'m calling about your interest in our services. Do you have a few minutes to chat?',
            conditions: [],
            nextSteps: ['step2']
          }
        ],
        conditions: [],
        escalationRules: [],
        analytics: {
          totalExecutions: 890,
          successRate: 0.75,
          averageCompletionTime: 240,
          commonExitPoints: { 'step1': 200 },
          userSatisfactionScore: 3.9
        },
        isActive: true,
        version: 2,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
        createdBy: 'user1',
        tags: ['sales', 'lead-qualification']
      }
      ];
      
      setWorkflows(mockWorkflows);
      // TODO: Replace with actual API call
      // const response = await aiAgentApi.getWorkflows();
      // setWorkflows(response.data);
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

  const handleCreateWorkflow = async (workflowData: Partial<VoiceWorkflow>) => {
    try {
      // TODO: Replace with actual API call when backend is ready
      console.log('Creating workflow:', workflowData);
      // await aiAgentApi.createWorkflow(workflowData);
      // await fetchWorkflows();
      navigate('/ai-voice-agent/workflows');
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  };

  const handleEditWorkflow = (workflow: VoiceWorkflow) => {
    navigate(`/ai-voice-agent/workflows/edit/${workflow.id}`);
  };

  const handleToggleWorkflow = async (workflowId: string) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (workflow) {
        // TODO: Replace with actual API call when backend is ready
        // await aiAgentApi.toggleWorkflow(workflowId, !workflow.isActive);
        setWorkflows(prev => prev.map(w => 
          w.id === workflowId ? { ...w, isActive: !w.isActive } : w
        ));
      }
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
    }
  };

  const handleDuplicateWorkflow = async (workflow: VoiceWorkflow) => {
    try {
      // TODO: Replace with actual API call when backend is ready
      // await aiAgentApi.duplicateWorkflow(workflow.id);
      const duplicatedWorkflow: VoiceWorkflow = {
        ...workflow,
        id: `workflow_${Date.now()}`,
        name: `${workflow.name} (Copy)`,
        version: 1,
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
        // TODO: Replace with actual API call when backend is ready
        // await aiAgentApi.deleteWorkflow(workflowId);
        setWorkflows(prev => prev.filter(workflow => workflow.id !== workflowId));
      } catch (error) {
        console.error('Failed to delete workflow:', error);
      }
    }
  };

  if (location.pathname.includes('/create')) {
    return (
      <WorkflowDesigner
        onSave={handleCreateWorkflow}
        onCancel={() => navigate('/ai-voice-agent/workflows')}
      />
    );
  }

  if (location.pathname.includes('/edit/')) {
    const workflowId = location.pathname.split('/').pop();
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      return (
        <WorkflowDesigner
          workflow={workflow}
          onSave={(data) => {
            // TODO: Update workflow
            console.log('Updating workflow:', data);
            navigate('/ai-voice-agent/workflows');
          }}
          onCancel={() => navigate('/ai-voice-agent/workflows')}
        />
      );
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voice Workflows</h1>
          <p className="text-gray-600 mt-1">Design conversation flows for your AI agents</p>
        </div>
        <button
          onClick={() => navigate('/ai-voice-agent/workflows/create')}
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
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        workflow.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">v{workflow.version}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">{workflow.description}</p>

              {/* Workflow Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {workflow.steps.length}
                  </div>
                  <div className="text-xs text-gray-500">Steps</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {(workflow.analytics.successRate * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-500">Success Rate</div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Executions:</span>
                  <span className="font-medium">{workflow.analytics.totalExecutions.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Avg. Duration:</span>
                  <span className="font-medium">{Math.round(workflow.analytics.averageCompletionTime / 60)}m</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-600">Satisfaction:</span>
                  <span className="font-medium">{workflow.analytics.userSatisfactionScore.toFixed(1)}</span>
                </div>
              </div>

              {/* Tags */}
              {workflow.tags && workflow.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {workflow.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

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
                    onClick={() => handleEditWorkflow(workflow)}
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
                    onClick={() => navigate(`/ai-voice-agent/workflows/${workflow.id}/analytics`)}
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
              : 'Create your first voice workflow to get started'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button
              onClick={() => navigate('/ai-voice-agent/workflows/create')}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceWorkflows;