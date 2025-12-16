import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Bot, Search, Filter, MoreVertical, Play, Pause, Edit, Trash2, BarChart3, Settings } from 'lucide-react';
import { AIAgent, CreateAIAgentRequest } from '../../../shared/src/types/ai-agent';
import { aiAgentApi } from '../../services/api';
import AgentBuilder from '../../components/AIAgent/AgentBuilder';

const AIAgents: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      // For now, use mock data - replace with actual API call when backend is ready
      const mockAgents: AIAgent[] = [
        {
          id: '1',
          name: 'Customer Support Agent',
          description: 'Handles general customer inquiries and support requests',
          voiceSettings: {
            voice: 'en-US-Neural2-A',
            speed: 1.0,
            pitch: 0,
            language: 'en-US',
            tone: 'professional'
          },
          workflows: [],
          integrations: [],
          performance: {
            totalCalls: 1250,
            successfulCalls: 1100,
            averageCallDuration: 180,
            customerSatisfactionScore: 4.2,
            escalationRate: 0.12,
            lastUpdated: new Date()
          },
          isActive: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-20'),
          createdBy: 'user1',
          tags: ['customer-service', 'support']
        },
        {
          id: '2',
          name: 'Sales Qualifier',
          description: 'Qualifies leads and schedules appointments with sales team',
          voiceSettings: {
            voice: 'en-US-Neural2-B',
            speed: 1.1,
            pitch: 2,
            language: 'en-US',
            tone: 'friendly'
          },
          workflows: [],
          integrations: [],
          performance: {
            totalCalls: 890,
            successfulCalls: 756,
            averageCallDuration: 240,
            customerSatisfactionScore: 4.0,
            escalationRate: 0.08,
            lastUpdated: new Date()
          },
          isActive: true,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-18'),
          createdBy: 'user1',
          tags: ['sales', 'lead-qualification']
        }
      ];
      
      setAgents(mockAgents);
      // TODO: Replace with actual API call
      // const response = await aiAgentApi.getAgents();
      // setAgents(response.data);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && agent.isActive) ||
                         (filterStatus === 'inactive' && !agent.isActive);
    return matchesSearch && matchesFilter;
  });

  const handleCreateAgent = async (agentData: CreateAIAgentRequest) => {
    try {
      // TODO: Replace with actual API call when backend is ready
      console.log('Creating agent:', agentData);
      // await aiAgentApi.createAgent(agentData);
      // await fetchAgents();
      navigate('/ai-voice-agent/agents');
    } catch (error) {
      console.error('Failed to create agent:', error);
    }
  };

  const handleEditAgent = (agent: AIAgent) => {
    navigate(`/ai-voice-agent/agents/edit/${agent.id}`);
  };

  const handleToggleAgent = async (agentId: string) => {
    try {
      const agent = agents.find(a => a.id === agentId);
      if (agent) {
        // TODO: Replace with actual API call when backend is ready
        // await aiAgentApi.toggleAgent(agentId, !agent.isActive);
        setAgents(prev => prev.map(a => 
          a.id === agentId ? { ...a, isActive: !a.isActive } : a
        ));
      }
    } catch (error) {
      console.error('Failed to toggle agent:', error);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      try {
        // TODO: Replace with actual API call when backend is ready
        // await aiAgentApi.deleteAgent(agentId);
        setAgents(prev => prev.filter(agent => agent.id !== agentId));
      } catch (error) {
        console.error('Failed to delete agent:', error);
      }
    }
  };

  const handleViewPerformance = (agent: AIAgent) => {
    navigate(`/ai-voice-agent/agents/${agent.id}/performance`);
  };

  if (location.pathname.includes('/create')) {
    return (
      <AgentBuilder
        onSave={handleCreateAgent}
        onCancel={() => navigate('/ai-voice-agent/agents')}
      />
    );
  }

  if (location.pathname.includes('/edit/')) {
    const agentId = location.pathname.split('/').pop();
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      return (
        <AgentBuilder
          agent={agent}
          onSave={(data) => {
            // TODO: Update agent
            console.log('Updating agent:', data);
            navigate('/ai-voice-agent/agents');
          }}
          onCancel={() => navigate('/ai-voice-agent/agents')}
        />
      );
    }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Agents</h1>
          <p className="text-gray-600 mt-1">Manage your AI-powered voice agents</p>
        </div>
        <button
          onClick={() => navigate('/ai-voice-agent/agents/create')}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
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
                placeholder="Search agents..."
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
              <option value="all">All Agents</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-voxlink-blue"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div key={agent.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    agent.isActive ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Bot className={`w-5 h-5 ${
                      agent.isActive ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      agent.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">{agent.description}</p>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {agent.performance.totalCalls.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Total Calls</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {agent.performance.customerSatisfactionScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Satisfaction</div>
                </div>
              </div>

              {/* Tags */}
              {agent.tags && agent.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {agent.tags.map((tag, index) => (
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
                    onClick={() => handleToggleAgent(agent.id)}
                    className={`p-2 rounded-md transition-colors ${
                      agent.isActive
                        ? 'text-orange-600 hover:bg-orange-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={agent.isActive ? 'Pause Agent' : 'Activate Agent'}
                  >
                    {agent.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleEditAgent(agent)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    title="Edit Agent"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleViewPerformance(agent)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    title="View Performance"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/ai-voice-agent/agents/${agent.id}/settings`)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                    title="Agent Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Agent"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredAgents.length === 0 && !loading && (
        <div className="text-center py-12">
          <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first AI agent to get started'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button
              onClick={() => navigate('/ai-voice-agent/agents/create')}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAgents;