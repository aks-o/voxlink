import React, { useState, useEffect } from 'react';
import { Bot, Brain, MessageSquare, TrendingUp, Zap, Settings, BarChart3, Users, Clock, Target } from 'lucide-react';

interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isEnabled: boolean;
  usage: number;
  accuracy?: number;
  category: 'automation' | 'analysis' | 'optimization';
}

interface AIInsight {
  id: string;
  type: 'sentiment' | 'trend' | 'recommendation' | 'alert';
  title: string;
  description: string;
  value: string;
  change?: number;
  timestamp: Date;
}

const AIHub: React.FC = () => {
  const [features, setFeatures] = useState<AIFeature[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'automation' | 'analysis' | 'optimization'>('all');

  useEffect(() => {
    fetchAIData();
  }, []);

  const fetchAIData = async () => {
    try {
      setLoading(true);
      
      // Mock AI features data
      const mockFeatures: AIFeature[] = [
        {
          id: '1',
          name: 'Smart Reply Suggestions',
          description: 'AI-powered reply suggestions based on message context and history',
          icon: <MessageSquare className="w-5 h-5" />,
          isEnabled: true,
          usage: 1245,
          accuracy: 87,
          category: 'automation'
        },
        {
          id: '2',
          name: 'Sentiment Analysis',
          description: 'Analyze customer sentiment in real-time to prioritize responses',
          icon: <Brain className="w-5 h-5" />,
          isEnabled: true,
          usage: 892,
          accuracy: 92,
          category: 'analysis'
        },
        {
          id: '3',
          name: 'Auto-Categorization',
          description: 'Automatically categorize and tag incoming messages',
          icon: <Target className="w-5 h-5" />,
          isEnabled: true,
          usage: 2156,
          accuracy: 89,
          category: 'automation'
        },
        {
          id: '4',
          name: 'Response Time Optimization',
          description: 'Optimize agent workload and response times using AI',
          icon: <Clock className="w-5 h-5" />,
          isEnabled: false,
          usage: 0,
          accuracy: 0,
          category: 'optimization'
        },
        {
          id: '5',
          name: 'Customer Intent Detection',
          description: 'Detect customer intent to route messages to appropriate agents',
          icon: <Users className="w-5 h-5" />,
          isEnabled: true,
          usage: 567,
          accuracy: 84,
          category: 'analysis'
        },
        {
          id: '6',
          name: 'Conversation Summarization',
          description: 'Generate automatic summaries of long conversations',
          icon: <BarChart3 className="w-5 h-5" />,
          isEnabled: false,
          usage: 0,
          accuracy: 0,
          category: 'automation'
        }
      ];

      // Mock AI insights data
      const mockInsights: AIInsight[] = [
        {
          id: '1',
          type: 'sentiment',
          title: 'Customer Sentiment Improved',
          description: 'Overall customer sentiment has improved by 12% this week',
          value: '78%',
          change: 12,
          timestamp: new Date('2024-01-20T10:30:00')
        },
        {
          id: '2',
          type: 'trend',
          title: 'Peak Message Volume',
          description: 'Message volume peaks between 2-4 PM on weekdays',
          value: '2-4 PM',
          timestamp: new Date('2024-01-20T09:15:00')
        },
        {
          id: '3',
          type: 'recommendation',
          title: 'Template Optimization',
          description: 'Consider updating your welcome template - 23% lower engagement',
          value: '-23%',
          change: -23,
          timestamp: new Date('2024-01-20T08:45:00')
        },
        {
          id: '4',
          type: 'alert',
          title: 'High Priority Messages',
          description: '15 high-priority messages require immediate attention',
          value: '15',
          timestamp: new Date('2024-01-20T11:00:00')
        },
        {
          id: '5',
          type: 'trend',
          title: 'Response Time Trend',
          description: 'Average response time decreased by 18% this month',
          value: '2.3 min',
          change: -18,
          timestamp: new Date('2024-01-19T16:20:00')
        }
      ];

      setFeatures(mockFeatures);
      setInsights(mockInsights);
    } catch (error) {
      console.error('Failed to fetch AI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFeatures = features.filter(feature => 
    selectedCategory === 'all' || feature.category === selectedCategory
  );

  const handleToggleFeature = async (featureId: string) => {
    try {
      setFeatures(prev => prev.map(feature => 
        feature.id === featureId ? { ...feature, isEnabled: !feature.isEnabled } : feature
      ));
    } catch (error) {
      console.error('Failed to toggle feature:', error);
    }
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'sentiment': return <Brain className="w-4 h-4" />;
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'recommendation': return <Zap className="w-4 h-4" />;
      case 'alert': return <MessageSquare className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  const getInsightColor = (type: AIInsight['type']) => {
    switch (type) {
      case 'sentiment': return 'bg-blue-100 text-blue-600';
      case 'trend': return 'bg-green-100 text-green-600';
      case 'recommendation': return 'bg-yellow-100 text-yellow-600';
      case 'alert': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getCategoryColor = (category: AIFeature['category']) => {
    switch (category) {
      case 'automation': return 'bg-blue-100 text-blue-800';
      case 'analysis': return 'bg-green-100 text-green-800';
      case 'optimization': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Hub</h1>
        <p className="text-gray-600">Leverage AI to enhance your messaging capabilities and insights</p>
      </div>

      {/* AI Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active AI Features</p>
              <p className="text-2xl font-semibold text-gray-900">
                {features.filter(f => f.isEnabled).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">AI Interactions</p>
              <p className="text-2xl font-semibold text-gray-900">4,860</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Accuracy</p>
              <p className="text-2xl font-semibold text-gray-900">88%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Time Saved</p>
              <p className="text-2xl font-semibold text-gray-900">24h</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Features */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">AI Features</h2>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as any)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    <option value="automation">Automation</option>
                    <option value="analysis">Analysis</option>
                    <option value="optimization">Optimization</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-voxlink-blue"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFeatures.map((feature) => (
                    <div key={feature.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            feature.isEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            {feature.icon}
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium text-gray-900">{feature.name}</h3>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(feature.category)}`}>
                                {feature.category}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                            
                            {feature.isEnabled && (
                              <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center">
                                  <span className="text-gray-500">Usage:</span>
                                  <span className="ml-1 font-medium text-gray-900">{feature.usage.toLocaleString()}</span>
                                </div>
                                {feature.accuracy && feature.accuracy > 0 && (
                                  <div className="flex items-center">
                                    <span className="text-gray-500">Accuracy:</span>
                                    <span className="ml-1 font-medium text-gray-900">{feature.accuracy}%</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Configure Feature"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={feature.isEnabled}
                              onChange={() => handleToggleFeature(feature.id)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-voxlink-blue"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <div key={insight.id} className="border-l-4 border-gray-200 pl-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getInsightColor(insight.type)}`}>
                            {getInsightIcon(insight.type)}
                          </div>
                          <div className="ml-3">
                            <h4 className="font-medium text-gray-900 text-sm">{insight.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-lg font-semibold text-gray-900">{insight.value}</span>
                              {insight.change && (
                                <span className={`text-xs font-medium ${
                                  insight.change > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {insight.change > 0 ? '+' : ''}{insight.change}%
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {insight.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Brain className="w-5 h-5 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">Train AI Model</div>
                    <div className="text-sm text-gray-600">Improve AI accuracy with new data</div>
                  </div>
                </div>
              </button>
              
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">View Analytics</div>
                    <div className="text-sm text-gray-600">Detailed AI performance metrics</div>
                  </div>
                </div>
              </button>
              
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <Settings className="w-5 h-5 text-purple-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">AI Settings</div>
                    <div className="text-sm text-gray-600">Configure AI parameters</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIHub;