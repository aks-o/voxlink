import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, 
  Save, 
  Clock, 
  Phone, 
  Shield, 
  Volume2,
  Mic,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Users,
  Target,
  RotateCcw
} from 'lucide-react';
import { DialerSettings as DialerSettingsType, ComplianceRule, TimeRange } from '@shared/types/dialer';
import toast from 'react-hot-toast';

interface DialerSettingsProps {
  dialerType: 'power' | 'parallel' | 'speed';
  onClose?: () => void;
}

const DialerSettings: React.FC<DialerSettingsProps> = ({ dialerType, onClose }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<DialerSettingsType>({
    dialRatio: 1.2,
    maxRetries: 3,
    retryInterval: 60,
    maxConcurrentCalls: 5,
    connectionTimeout: 30,
    callTimeout: 30,
    answerMachineDetection: true,
    recordCalls: true,
    playBeep: false,
    callerIdNumber: '+1 (555) 123-4567',
    workingHours: {
      startTime: '09:00',
      endTime: '17:00',
      timezone: 'America/New_York',
      daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
    },
    timezoneBased: true,
    respectDoNotCall: true,
    maxCallsPerContact: 3,
    minTimeBetweenCalls: 60,
    speedDialSlots: [],
  });

  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>([
    {
      id: 'rule-1',
      type: 'time_restriction',
      name: 'Business Hours Only',
      description: 'Only make calls during business hours',
      config: {
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'America/New_York',
        daysOfWeek: [1, 2, 3, 4, 5],
      },
      isActive: true,
      violations: [],
    },
    {
      id: 'rule-2',
      type: 'call_frequency',
      name: 'Maximum Call Frequency',
      description: 'Limit calls per contact per day',
      config: {
        maxCallsPerDay: 3,
        minTimeBetweenCalls: 60,
      },
      isActive: true,
      violations: [],
    },
    {
      id: 'rule-3',
      type: 'dnc_list',
      name: 'Do Not Call List',
      description: 'Respect do not call preferences',
      config: {
        checkDncList: true,
        blockDncNumbers: true,
      },
      isActive: true,
      violations: [],
    },
  ]);

  // Fetch current settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['dialer-settings', dialerType],
    queryFn: async () => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: settings });
        }, 500);
      });
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: DialerSettingsType) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1000);
      });
    },
    onSuccess: () => {
      toast.success('Settings saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['dialer-settings'] });
      if (onClose) onClose();
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  // Update compliance rule mutation
  const updateComplianceRuleMutation = useMutation({
    mutationFn: async ({ ruleId, updates }: { ruleId: string; updates: Partial<ComplianceRule> }) => {
      // Mock API call - replace with actual implementation
      return new Promise((resolve) => {
        setTimeout(() => resolve(updates), 500);
      });
    },
    onSuccess: () => {
      toast.success('Compliance rule updated');
    },
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'calling', label: 'Calling', icon: Phone },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'audio', label: 'Audio', icon: Volume2 },
  ];

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      setSettings({
        dialRatio: 1.2,
        maxRetries: 3,
        retryInterval: 60,
        maxConcurrentCalls: 5,
        connectionTimeout: 30,
        callTimeout: 30,
        answerMachineDetection: true,
        recordCalls: true,
        playBeep: false,
        callerIdNumber: '+1 (555) 123-4567',
        workingHours: {
          startTime: '09:00',
          endTime: '17:00',
          timezone: 'America/New_York',
          daysOfWeek: [1, 2, 3, 4, 5],
        },
        timezoneBased: true,
        respectDoNotCall: true,
        maxCallsPerContact: 3,
        minTimeBetweenCalls: 60,
        speedDialSlots: [],
      });
      toast.success('Settings reset to defaults');
    }
  };

  const toggleComplianceRule = (ruleId: string) => {
    setComplianceRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, isActive: !rule.isActive }
        : rule
    ));
    
    const rule = complianceRules.find(r => r.id === ruleId);
    if (rule) {
      updateComplianceRuleMutation.mutate({
        ruleId,
        updates: { isActive: !rule.isActive },
      });
    }
  };

  const getDialerTypeSettings = () => {
    switch (dialerType) {
      case 'power':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Dial Ratio
              </label>
              <input
                type="number"
                min="1"
                max="3"
                step="0.1"
                value={settings.dialRatio || 1.2}
                onChange={(e) => setSettings(prev => ({ ...prev, dialRatio: parseFloat(e.target.value) }))}
                className="input"
              />
              <p className="text-xs text-slate mt-1">
                Number of calls to make per available agent (1.0 = 1:1 ratio)
              </p>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.answerMachineDetection}
                  onChange={(e) => setSettings(prev => ({ ...prev, answerMachineDetection: e.target.checked }))}
                />
                <span className="text-sm text-charcoal">Enable Answer Machine Detection</span>
              </label>
            </div>
          </div>
        );
      
      case 'parallel':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Max Concurrent Calls
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.maxConcurrentCalls || 5}
                onChange={(e) => setSettings(prev => ({ ...prev, maxConcurrentCalls: parseInt(e.target.value) }))}
                className="input"
              />
              <p className="text-xs text-slate mt-1">
                Maximum number of simultaneous outbound calls
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Connection Timeout (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="60"
                value={settings.connectionTimeout}
                onChange={(e) => setSettings(prev => ({ ...prev, connectionTimeout: parseInt(e.target.value) }))}
                className="input"
              />
            </div>
          </div>
        );
      
      case 'speed':
        return (
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={true} // Speed dial specific setting
                  onChange={() => {}}
                />
                <span className="text-sm text-charcoal">Enable Hotkey Support</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={true} // Speed dial specific setting
                  onChange={() => {}}
                />
                <span className="text-sm text-charcoal">Sync with Contact List</span>
              </label>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-charcoal">
            {dialerType.charAt(0).toUpperCase() + dialerType.slice(1)} Dialer Settings
          </h2>
          <p className="text-slate mt-1">
            Configure dialer behavior and compliance rules
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleResetSettings}
            className="btn-secondary"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saveSettingsMutation.isPending}
            className="btn-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
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
      <div className="card">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-charcoal">General Settings</h3>
            
            {/* Dialer Type Specific Settings */}
            <div>
              <h4 className="font-medium text-charcoal mb-4">
                {dialerType.charAt(0).toUpperCase() + dialerType.slice(1)} Dialer Configuration
              </h4>
              {getDialerTypeSettings()}
            </div>

            {/* Common Settings */}
            <div className="space-y-4 pt-6 border-t">
              <h4 className="font-medium text-charcoal">Common Settings</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Max Retries per Contact
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxRetries}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Retry Interval (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.retryInterval}
                    onChange={(e) => setSettings(prev => ({ ...prev, retryInterval: parseInt(e.target.value) }))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Call Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    value={settings.callTimeout}
                    onChange={(e) => setSettings(prev => ({ ...prev, callTimeout: parseInt(e.target.value) }))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Caller ID Number
                  </label>
                  <input
                    type="tel"
                    value={settings.callerIdNumber}
                    onChange={(e) => setSettings(prev => ({ ...prev, callerIdNumber: e.target.value }))}
                    className="input"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calling' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-charcoal">Calling Behavior</h3>
            
            {/* Working Hours */}
            <div>
              <h4 className="font-medium text-charcoal mb-4">Working Hours</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={settings.workingHours.startTime}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      workingHours: { ...prev.workingHours, startTime: e.target.value }
                    }))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={settings.workingHours.endTime}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      workingHours: { ...prev.workingHours, endTime: e.target.value }
                    }))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Timezone
                  </label>
                  <select
                    value={settings.workingHours.timezone}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      workingHours: { ...prev.workingHours, timezone: e.target.value }
                    }))}
                    className="input"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Working Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={settings.workingHours.daysOfWeek.includes(index)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...settings.workingHours.daysOfWeek, index]
                            : settings.workingHours.daysOfWeek.filter(d => d !== index);
                          setSettings(prev => ({
                            ...prev,
                            workingHours: { ...prev.workingHours, daysOfWeek: newDays }
                          }));
                        }}
                      />
                      <span className="text-sm text-charcoal">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Call Behavior Options */}
            <div className="space-y-4 pt-6 border-t">
              <h4 className="font-medium text-charcoal">Call Behavior</h4>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.recordCalls}
                    onChange={(e) => setSettings(prev => ({ ...prev, recordCalls: e.target.checked }))}
                  />
                  <span className="text-sm text-charcoal">Record all calls</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.playBeep}
                    onChange={(e) => setSettings(prev => ({ ...prev, playBeep: e.target.checked }))}
                  />
                  <span className="text-sm text-charcoal">Play beep before recording</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.timezoneBased}
                    onChange={(e) => setSettings(prev => ({ ...prev, timezoneBased: e.target.checked }))}
                  />
                  <span className="text-sm text-charcoal">Use contact's timezone for calling hours</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-charcoal">Compliance Rules</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Compliance Information</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    These rules help ensure your dialing campaigns comply with regulations like TCPA, CAN-SPAM, and local calling laws.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {complianceRules.map((rule) => (
                <div key={rule.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-charcoal">{rule.name}</h4>
                        <button
                          onClick={() => toggleComplianceRule(rule.id)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            rule.isActive ? 'bg-voxlink-blue' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                              rule.isActive ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-sm text-slate mb-3">{rule.description}</p>
                      
                      {rule.type === 'time_restriction' && (
                        <div className="text-xs text-slate">
                          Active: {rule.config.startTime} - {rule.config.endTime} ({rule.config.timezone})
                        </div>
                      )}
                      
                      {rule.type === 'call_frequency' && (
                        <div className="text-xs text-slate">
                          Max {rule.config.maxCallsPerDay} calls per day, {rule.config.minTimeBetweenCalls} min between calls
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {rule.isActive ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                  </div>
                  
                  {rule.violations.length > 0 && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                      <div className="text-xs text-red-700">
                        {rule.violations.length} violation(s) in the last 24 hours
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Additional Compliance Settings */}
            <div className="space-y-4 pt-6 border-t">
              <h4 className="font-medium text-charcoal">Additional Settings</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Max Calls per Contact
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.maxCallsPerContact}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxCallsPerContact: parseInt(e.target.value) }))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Min Time Between Calls (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={settings.minTimeBetweenCalls}
                    onChange={(e) => setSettings(prev => ({ ...prev, minTimeBetweenCalls: parseInt(e.target.value) }))}
                    className="input"
                  />
                </div>
              </div>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.respectDoNotCall}
                  onChange={(e) => setSettings(prev => ({ ...prev, respectDoNotCall: e.target.checked }))}
                />
                <span className="text-sm text-charcoal">Respect Do Not Call preferences</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-charcoal">Audio Settings</h3>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Volume2 className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Audio Configuration</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Configure audio settings for optimal call quality and compliance.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Microphone Settings */}
              <div>
                <h4 className="font-medium text-charcoal mb-4 flex items-center">
                  <Mic className="w-4 h-4 mr-2" />
                  Microphone Settings
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Input Device
                    </label>
                    <select className="input">
                      <option>Default Microphone</option>
                      <option>USB Headset Microphone</option>
                      <option>Built-in Microphone</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Input Volume
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="75"
                      className="w-full"
                    />
                  </div>
                  
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm text-charcoal">Enable noise cancellation</span>
                  </label>
                </div>
              </div>

              {/* Speaker Settings */}
              <div className="pt-6 border-t">
                <h4 className="font-medium text-charcoal mb-4 flex items-center">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Speaker Settings
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Output Device
                    </label>
                    <select className="input">
                      <option>Default Speakers</option>
                      <option>USB Headset</option>
                      <option>Built-in Speakers</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Output Volume
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="80"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Recording Settings */}
              <div className="pt-6 border-t">
                <h4 className="font-medium text-charcoal mb-4">Recording Settings</h4>
                <div className="space-y-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.recordCalls}
                      onChange={(e) => setSettings(prev => ({ ...prev, recordCalls: e.target.checked }))}
                    />
                    <span className="text-sm text-charcoal">Enable call recording</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.playBeep}
                      onChange={(e) => setSettings(prev => ({ ...prev, playBeep: e.target.checked }))}
                    />
                    <span className="text-sm text-charcoal">Play beep before recording (compliance)</span>
                  </label>
                  
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Recording Quality
                    </label>
                    <select className="input">
                      <option>High Quality (44.1 kHz)</option>
                      <option>Standard Quality (22 kHz)</option>
                      <option>Low Quality (8 kHz)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DialerSettings;