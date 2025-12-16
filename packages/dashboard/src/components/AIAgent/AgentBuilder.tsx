import React, { useState } from 'react';
import { Bot, Settings, Mic, Globe, Volume2, Zap } from 'lucide-react';
import { AIAgent, VoiceSettings, CreateAIAgentRequest } from '../../../shared/src/types/ai-agent';

interface AgentBuilderProps {
  agent?: AIAgent;
  onSave: (agent: CreateAIAgentRequest) => void;
  onCancel: () => void;
}

const AgentBuilder: React.FC<AgentBuilderProps> = ({ agent, onSave, onCancel }) => {
  const [formData, setFormData] = useState<CreateAIAgentRequest>({
    name: agent?.name || '',
    description: agent?.description || '',
    voiceSettings: agent?.voiceSettings || {
      voice: 'en-US-Neural2-A',
      speed: 1.0,
      pitch: 0,
      language: 'en-US',
      volume: 0.8,
      tone: 'professional'
    },
    workflows: agent?.workflows?.map(w => w.id) || [],
    integrations: agent?.integrations?.map(i => i.id) || [],
    tags: agent?.tags || []
  });

  const handleVoiceSettingsChange = (key: keyof VoiceSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      voiceSettings: {
        ...prev.voiceSettings,
        [key]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <Bot className="w-6 h-6 text-voxlink-blue mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              {agent ? 'Edit AI Agent' : 'Create New AI Agent'}
            </h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agent Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                placeholder="Enter agent name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                placeholder="customer-service, sales, support"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
              placeholder="Describe the agent's purpose and capabilities"
            />
          </div>

          {/* Voice Settings */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Mic className="w-5 h-5 text-voxlink-blue mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Voice Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Language
                </label>
                <select
                  value={formData.voiceSettings.language}
                  onChange={(e) => handleVoiceSettingsChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voice Type
                </label>
                <select
                  value={formData.voiceSettings.voice}
                  onChange={(e) => handleVoiceSettingsChange('voice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                >
                  <option value="en-US-Neural2-A">Neural Female (A)</option>
                  <option value="en-US-Neural2-B">Neural Male (B)</option>
                  <option value="en-US-Neural2-C">Neural Female (C)</option>
                  <option value="en-US-Neural2-D">Neural Male (D)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <select
                  value={formData.voiceSettings.tone}
                  onChange={(e) => handleVoiceSettingsChange('tone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Zap className="w-4 h-4 inline mr-1" />
                  Speed: {formData.voiceSettings.speed}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={formData.voiceSettings.speed}
                  onChange={(e) => handleVoiceSettingsChange('speed', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pitch: {formData.voiceSettings.pitch}
                </label>
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="1"
                  value={formData.voiceSettings.pitch}
                  onChange={(e) => handleVoiceSettingsChange('pitch', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Volume2 className="w-4 h-4 inline mr-1" />
                  Volume: {Math.round((formData.voiceSettings.volume || 0.8) * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.voiceSettings.volume || 0.8}
                  onChange={(e) => handleVoiceSettingsChange('volume', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Voice Preview */}
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Preview voice settings</span>
                <button
                  type="button"
                  className="px-3 py-1 text-sm bg-voxlink-blue text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Play Sample
                </button>
              </div>
              <textarea
                placeholder="Enter text to preview with current voice settings..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md resize-none"
                rows={2}
                defaultValue="Hello! This is a preview of how your AI agent will sound with the current voice settings."
              />
            </div>
          </div>

          {/* Conversation Flow Settings */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Settings className="w-5 h-5 text-voxlink-blue mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Conversation Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response Timeout (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  defaultValue="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Call Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  defaultValue="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interruption Handling
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent">
                  <option value="allow">Allow Interruptions</option>
                  <option value="polite">Polite Interruptions</option>
                  <option value="none">No Interruptions</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Escalation Trigger
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent">
                  <option value="manual">Manual Request</option>
                  <option value="keywords">Specific Keywords</option>
                  <option value="sentiment">Negative Sentiment</option>
                  <option value="timeout">Response Timeout</option>
                </select>
              </div>
            </div>
          </div>

          {/* Integration Settings */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center mb-4">
              <Zap className="w-5 h-5 text-voxlink-blue mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Integrations</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <h4 className="font-medium text-gray-900">CRM Integration</h4>
                  <p className="text-sm text-gray-600">Connect to customer database</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <h4 className="font-medium text-gray-900">Calendar Integration</h4>
                  <p className="text-sm text-gray-600">Schedule appointments automatically</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <h4 className="font-medium text-gray-900">Analytics Tracking</h4>
                  <p className="text-sm text-gray-600">Track performance metrics</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-voxlink-blue"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-voxlink-blue border border-transparent rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-voxlink-blue"
            >
              {agent ? 'Update Agent' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgentBuilder;