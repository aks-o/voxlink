import React, { useState, useCallback } from 'react';
import { Plus, Play, Square, ArrowRight, Settings, Trash2, Copy } from 'lucide-react';
import { VoiceWorkflow, WorkflowStep, WorkflowCondition } from '../../../shared/src/types/ai-agent';

interface WorkflowDesignerProps {
  workflow?: VoiceWorkflow;
  onSave: (workflow: Partial<VoiceWorkflow>) => void;
  onCancel: () => void;
}

const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({ workflow, onSave, onCancel }) => {
  const [workflowData, setWorkflowData] = useState<Partial<VoiceWorkflow>>({
    name: workflow?.name || '',
    description: workflow?.description || '',
    steps: workflow?.steps || [],
    conditions: workflow?.conditions || [],
    escalationRules: workflow?.escalationRules || [],
    isActive: workflow?.isActive ?? true
  });

  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const stepTypes = [
    { type: 'greeting', label: 'Greeting', icon: '👋', color: 'bg-green-100 text-green-800' },
    { type: 'question', label: 'Question', icon: '❓', color: 'bg-blue-100 text-blue-800' },
    { type: 'condition', label: 'Condition', icon: '🔀', color: 'bg-yellow-100 text-yellow-800' },
    { type: 'action', label: 'Action', icon: '⚡', color: 'bg-purple-100 text-purple-800' },
    { type: 'transfer', label: 'Transfer', icon: '📞', color: 'bg-orange-100 text-orange-800' },
    { type: 'end', label: 'End Call', icon: '🔚', color: 'bg-red-100 text-red-800' }
  ];

  const addStep = useCallback((type: WorkflowStep['type']) => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      type,
      name: `New ${type}`,
      content: '',
      conditions: [],
      nextSteps: [],
      metadata: {}
    };

    setWorkflowData(prev => ({
      ...prev,
      steps: [...(prev.steps || []), newStep]
    }));
  }, []);

  const updateStep = useCallback((stepId: string, updates: Partial<WorkflowStep>) => {
    setWorkflowData(prev => ({
      ...prev,
      steps: prev.steps?.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      ) || []
    }));
  }, []);

  const deleteStep = useCallback((stepId: string) => {
    setWorkflowData(prev => ({
      ...prev,
      steps: prev.steps?.filter(step => step.id !== stepId) || []
    }));
    setSelectedStep(null);
  }, []);

  const duplicateStep = useCallback((step: WorkflowStep) => {
    const duplicatedStep: WorkflowStep = {
      ...step,
      id: `step_${Date.now()}`,
      name: `${step.name} (Copy)`
    };

    setWorkflowData(prev => ({
      ...prev,
      steps: [...(prev.steps || []), duplicatedStep]
    }));
  }, []);

  const handleSave = () => {
    onSave(workflowData);
  };

  const getStepTypeConfig = (type: WorkflowStep['type']) => {
    return stepTypes.find(st => st.type === type) || stepTypes[0];
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {workflow ? 'Edit Workflow' : 'Create New Workflow'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Design conversation flows for your AI agent
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isPreviewMode 
                    ? 'bg-voxlink-blue text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isPreviewMode ? <Square className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {isPreviewMode ? 'Stop Preview' : 'Preview'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-200px)]">
          {/* Workflow Canvas */}
          <div className="flex-1 p-6 overflow-auto">
            {/* Workflow Info */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Name
                </label>
                <input
                  type="text"
                  value={workflowData.name}
                  onChange={(e) => setWorkflowData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                  placeholder="Enter workflow name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={workflowData.description}
                  onChange={(e) => setWorkflowData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                  placeholder="Brief description"
                />
              </div>
            </div>

            {/* Step Palette */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Add Steps</h3>
              <div className="flex flex-wrap gap-2">
                {stepTypes.map((stepType) => (
                  <button
                    key={stepType.type}
                    onClick={() => addStep(stepType.type as WorkflowStep['type'])}
                    className={`px-3 py-2 text-sm font-medium rounded-md border border-gray-200 hover:border-gray-300 transition-colors ${stepType.color}`}
                  >
                    <span className="mr-2">{stepType.icon}</span>
                    {stepType.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Workflow Steps */}
            <div className="space-y-4">
              {workflowData.steps?.map((step, index) => {
                const stepConfig = getStepTypeConfig(step.type);
                return (
                  <div key={step.id}>
                    <div
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedStep?.id === step.id 
                          ? 'border-voxlink-blue bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedStep(step)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3 ${stepConfig.color}`}>
                            {index + 1}
                          </div>
                          <span className="text-lg mr-3">{stepConfig.icon}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">{step.name}</h4>
                            <p className="text-sm text-gray-500">{stepConfig.label}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateStep(step);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Duplicate Step"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteStep(step.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete Step"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {step.content && (
                        <div className="mt-3 text-sm text-gray-600 bg-white border border-gray-200 p-3 rounded">
                          <div className="font-medium text-gray-700 mb-1">Content:</div>
                          {step.content}
                        </div>
                      )}

                      {step.conditions && step.conditions.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-medium text-gray-500 mb-2">CONDITIONS:</div>
                          <div className="flex flex-wrap gap-1">
                            {step.conditions.map((condition, condIndex) => (
                              <span
                                key={condIndex}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                              >
                                {condition.field} {condition.operator} {condition.value}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {index < (workflowData.steps?.length || 0) - 1 && (
                      <div className="flex justify-center py-2">
                        <div className="flex items-center">
                          <div className="w-px h-6 bg-gray-300"></div>
                          <ArrowRight className="w-5 h-5 text-gray-400 mx-2" />
                          <div className="w-px h-6 bg-gray-300"></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {(!workflowData.steps || workflowData.steps.length === 0) && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🤖</div>
                  <h3 className="text-lg font-medium mb-2">No steps added yet</h3>
                  <p className="text-sm">Add steps from the palette above to build your workflow</p>
                  <div className="mt-4">
                    <button
                      onClick={() => addStep('greeting')}
                      className="px-4 py-2 text-sm bg-voxlink-blue text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Add First Step
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step Editor Panel */}
          {selectedStep && (
            <div className="w-80 border-l border-gray-200 p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Step</h3>
                <button
                  onClick={() => setSelectedStep(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step Name
                  </label>
                  <input
                    type="text"
                    value={selectedStep.name}
                    onChange={(e) => {
                      const updatedStep = { ...selectedStep, name: e.target.value };
                      setSelectedStep(updatedStep);
                      updateStep(selectedStep.id, { name: e.target.value });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={selectedStep.content}
                    onChange={(e) => {
                      const updatedStep = { ...selectedStep, content: e.target.value };
                      setSelectedStep(updatedStep);
                      updateStep(selectedStep.id, { content: e.target.value });
                    }}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                    placeholder="Enter the content for this step..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step Type
                  </label>
                  <select
                    value={selectedStep.type}
                    onChange={(e) => {
                      const updatedStep = { ...selectedStep, type: e.target.value as WorkflowStep['type'] };
                      setSelectedStep(updatedStep);
                      updateStep(selectedStep.id, { type: e.target.value as WorkflowStep['type'] });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
                  >
                    {stepTypes.map((type) => (
                      <option key={type.type} value={type.type}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStep.type === 'condition' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Conditions
                    </label>
                    <div className="space-y-2">
                      {selectedStep.conditions?.map((condition, index) => (
                        <div key={index} className="p-3 bg-white border border-gray-200 rounded">
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <input
                              type="text"
                              placeholder="Field"
                              value={condition.field}
                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                              readOnly
                            />
                            <select
                              value={condition.operator}
                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                              disabled
                            >
                              <option value="equals">equals</option>
                              <option value="contains">contains</option>
                              <option value="greater_than">greater than</option>
                              <option value="less_than">less than</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Value"
                              value={condition.value}
                              className="px-2 py-1 border border-gray-300 rounded text-xs"
                              readOnly
                            />
                          </div>
                        </div>
                      ))}
                      <button className="w-full px-3 py-2 text-sm text-voxlink-blue border border-voxlink-blue rounded-md hover:bg-blue-50">
                        <Plus className="w-4 h-4 inline mr-1" />
                        Add Condition
                      </button>
                    </div>
                  </div>
                )}

                {selectedStep.type === 'transfer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transfer Destination
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent">
                      <option value="">Select destination...</option>
                      <option value="agent">Human Agent</option>
                      <option value="voicemail">Voicemail</option>
                      <option value="external">External Number</option>
                    </select>
                  </div>
                )}

                {selectedStep.type === 'action' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Action Type
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-voxlink-blue focus:border-transparent">
                      <option value="">Select action...</option>
                      <option value="send_sms">Send SMS</option>
                      <option value="create_ticket">Create Support Ticket</option>
                      <option value="schedule_callback">Schedule Callback</option>
                      <option value="update_crm">Update CRM</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next Steps
                  </label>
                  <div className="space-y-2">
                    {selectedStep.nextSteps?.map((nextStepId, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Step {nextStepId}</span>
                        <button className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                      <Plus className="w-4 h-4 inline mr-1" />
                      Add Next Step
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-voxlink-blue border border-transparent rounded-md hover:bg-blue-600"
          >
            Save Workflow
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowDesigner;