import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft,
  Phone,
  Clock,
  Voicemail,
  Bell,
  Settings,
  Save,
  TestTube,
  Upload,
  Play,
  Pause,
  Volume2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Globe,
  Calendar,
  Plus,
  Trash2
} from 'lucide-react';
import { numbersApi } from '@services/api';
import toast from 'react-hot-toast';
import ConfigurationTester from '@components/Numbers/ConfigurationTester';

interface NumberConfiguration {
  id: string;
  numberId: string;
  callForwarding: {
    enabled: boolean;
    primaryDestination: string;
    failoverDestination?: string;
    businessHoursDestination?: string;
    afterHoursDestination?: string;
    timeout: number;
  };
  voicemail: {
    enabled: boolean;
    customGreeting?: string;
    greetingUrl?: string;
    emailNotifications: boolean;
    transcription: boolean;
  };
  businessHours: {
    timezone: string;
    schedule: {
      [day: string]: {
        open: string;
        close: string;
        enabled: boolean;
      };
    };
    holidays: string[];
  };
  notifications: {
    callReceived: boolean;
    voicemailReceived: boolean;
    configurationChanged: boolean;
    technicalIssues: boolean;
    billingEvents: boolean;
    deliveryMethods: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
  };
}

const NumberConfiguration: React.FC = () => {
  const { phoneNumber } = useParams<{ phoneNumber: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('forwarding');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [testingConfiguration, setTestingConfiguration] = useState(false);
  const [uploadingGreeting, setUploadingGreeting] = useState(false);
  const [playingGreeting, setPlayingGreeting] = useState(false);

  const decodedPhoneNumber = phoneNumber ? decodeURIComponent(phoneNumber) : '';

  // Fetch number configuration
  const { data: configData, isLoading, error } = useQuery({
    queryKey: ['number-configuration', decodedPhoneNumber],
    queryFn: () => numbersApi.getNumberConfiguration(decodedPhoneNumber),
    enabled: !!decodedPhoneNumber,
  });

  const [configuration, setConfiguration] = useState<NumberConfiguration | null>(null);

  useEffect(() => {
    if (configData?.data) {
      setConfiguration(configData.data);
    }
  }, [configData]);

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (config: NumberConfiguration) => {
      return numbersApi.updateNumberConfiguration(decodedPhoneNumber, config);
    },
    onSuccess: () => {
      toast.success('Configuration saved successfully');
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['number-configuration', decodedPhoneNumber] });
    },
    onError: () => {
      toast.error('Failed to save configuration');
    },
  });

  // Test configuration mutation
  const testConfigMutation = useMutation({
    mutationFn: async () => {
      return numbersApi.testNumberConfiguration(decodedPhoneNumber);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Configuration test successful');
      } else {
        toast.error(`Configuration test failed: ${result.message}`);
      }
    },
    onError: () => {
      toast.error('Failed to test configuration');
    },
  });

  const handleConfigurationChange = (section: string, field: string, value: any) => {
    if (!configuration) return;
    
    setConfiguration(prev => ({
      ...prev!,
      [section]: {
        ...prev![section as keyof NumberConfiguration],
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleNestedConfigurationChange = (section: string, subsection: string, field: string, value: any) => {
    if (!configuration) return;
    
    setConfiguration(prev => ({
      ...prev!,
      [section]: {
        ...prev![section as keyof NumberConfiguration],
        [subsection]: {
          ...(prev![section as keyof NumberConfiguration] as any)[subsection],
          [field]: value
        }
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveConfiguration = () => {
    if (configuration) {
      saveConfigMutation.mutate(configuration);
    }
  };

  const handleTestConfiguration = () => {
    setTestingConfiguration(true);
    testConfigMutation.mutate();
    setTimeout(() => setTestingConfiguration(false), 3000);
  };

  const handleGreetingUpload = async (file: File) => {
    setUploadingGreeting(true);
    try {
      // Mock upload - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockUrl = URL.createObjectURL(file);
      handleNestedConfigurationChange('voicemail', 'greetingUrl', mockUrl);
      toast.success('Greeting uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload greeting');
    } finally {
      setUploadingGreeting(false);
    }
  };

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney'
  ];

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const tabs = [
    { id: 'forwarding', label: 'Call Forwarding', icon: Phone },
    { id: 'hours', label: 'Business Hours', icon: Clock },
    { id: 'voicemail', label: 'Voicemail', icon: Voicemail },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  if (isLoading || !configuration) {
    return (
      <div className="max-w-4xl mx-auto">
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

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium text-charcoal mb-2">Configuration Not Found</h3>
            <p className="text-slate mb-4">
              Unable to load configuration for this number.
            </p>
            <button onClick={() => navigate('/numbers')} className="btn-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Numbers
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/numbers')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-charcoal">Configure Number</h1>
            <p className="text-slate">{decodedPhoneNumber}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleTestConfiguration}
            disabled={testingConfiguration || testConfigMutation.isPending}
            className="btn-secondary"
          >
            {testingConfiguration ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4 mr-2" />
            )}
            Test Configuration
          </button>
          
          <button
            onClick={handleSaveConfiguration}
            disabled={!hasUnsavedChanges || saveConfigMutation.isPending}
            className="btn-primary"
          >
            {saveConfigMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
            <span className="text-amber-800">You have unsaved changes. Don't forget to save your configuration.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-voxlink-blue text-white'
                        : 'text-slate hover:bg-gray-100 hover:text-charcoal'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Configuration Content */}
        <div className="lg:col-span-3">
          {/* Call Forwarding Tab */}
          {activeTab === 'forwarding' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Call Forwarding Configuration</h2>
                <p className="card-subtitle">
                  Configure how incoming calls are routed and handled
                </p>
              </div>

              <div className="space-y-6">
                {/* Enable Call Forwarding */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-charcoal">Enable Call Forwarding</h3>
                    <p className="text-sm text-slate">Forward incoming calls to another number</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configuration.callForwarding.enabled}
                      onChange={(e) => handleNestedConfigurationChange('callForwarding', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-voxlink-blue"></div>
                  </label>
                </div>

                {configuration.callForwarding.enabled && (
                  <div className="space-y-4 pl-4 border-l-2 border-blue-100">
                    {/* Primary Destination */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        Primary Destination *
                      </label>
                      <input
                        type="tel"
                        value={configuration.callForwarding.primaryDestination}
                        onChange={(e) => handleNestedConfigurationChange('callForwarding', 'primaryDestination', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="input"
                        required
                      />
                      <p className="text-xs text-slate mt-1">
                        The primary number where calls will be forwarded
                      </p>
                    </div>

                    {/* Failover Destination */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        Failover Destination
                      </label>
                      <input
                        type="tel"
                        value={configuration.callForwarding.failoverDestination || ''}
                        onChange={(e) => handleNestedConfigurationChange('callForwarding', 'failoverDestination', e.target.value)}
                        placeholder="+1 (555) 987-6543"
                        className="input"
                      />
                      <p className="text-xs text-slate mt-1">
                        Backup number if primary destination is unreachable
                      </p>
                    </div>

                    {/* Business Hours Destination */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        Business Hours Destination
                      </label>
                      <input
                        type="tel"
                        value={configuration.callForwarding.businessHoursDestination || ''}
                        onChange={(e) => handleNestedConfigurationChange('callForwarding', 'businessHoursDestination', e.target.value)}
                        placeholder="+1 (555) 111-2222"
                        className="input"
                      />
                      <p className="text-xs text-slate mt-1">
                        Different number for business hours (optional)
                      </p>
                    </div>

                    {/* After Hours Destination */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        After Hours Destination
                      </label>
                      <input
                        type="tel"
                        value={configuration.callForwarding.afterHoursDestination || ''}
                        onChange={(e) => handleNestedConfigurationChange('callForwarding', 'afterHoursDestination', e.target.value)}
                        placeholder="+1 (555) 333-4444"
                        className="input"
                      />
                      <p className="text-xs text-slate mt-1">
                        Different number for after hours (optional)
                      </p>
                    </div>

                    {/* Timeout */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        Ring Timeout (seconds)
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="60"
                        value={configuration.callForwarding.timeout}
                        onChange={(e) => handleNestedConfigurationChange('callForwarding', 'timeout', parseInt(e.target.value))}
                        className="input"
                      />
                      <p className="text-xs text-slate mt-1">
                        How long to ring before going to voicemail (10-60 seconds)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Business Hours Tab */}
          {activeTab === 'hours' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Business Hours Configuration</h2>
                <p className="card-subtitle">
                  Set your business hours for different call routing
                </p>
              </div>

              <div className="space-y-6">
                {/* Timezone Selection */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Timezone
                  </label>
                  <select
                    value={configuration.businessHours.timezone}
                    onChange={(e) => handleNestedConfigurationChange('businessHours', 'timezone', e.target.value)}
                    className="input"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weekly Schedule */}
                <div>
                  <h3 className="text-sm font-medium text-charcoal mb-4">Weekly Schedule</h3>
                  <div className="space-y-3">
                    {daysOfWeek.map((day) => {
                      const dayConfig = configuration.businessHours.schedule[day.key] || {
                        enabled: false,
                        open: '09:00',
                        close: '17:00'
                      };

                      return (
                        <div key={day.key} className="flex items-center space-x-4 p-3 border rounded-lg">
                          <div className="w-20">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={dayConfig.enabled}
                                onChange={(e) => {
                                  const newSchedule = {
                                    ...configuration.businessHours.schedule,
                                    [day.key]: { ...dayConfig, enabled: e.target.checked }
                                  };
                                  handleNestedConfigurationChange('businessHours', 'schedule', newSchedule);
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm font-medium">{day.label}</span>
                            </label>
                          </div>
                          
                          {dayConfig.enabled && (
                            <>
                              <div>
                                <input
                                  type="time"
                                  value={dayConfig.open}
                                  onChange={(e) => {
                                    const newSchedule = {
                                      ...configuration.businessHours.schedule,
                                      [day.key]: { ...dayConfig, open: e.target.value }
                                    };
                                    handleNestedConfigurationChange('businessHours', 'schedule', newSchedule);
                                  }}
                                  className="input text-sm"
                                />
                              </div>
                              <span className="text-slate">to</span>
                              <div>
                                <input
                                  type="time"
                                  value={dayConfig.close}
                                  onChange={(e) => {
                                    const newSchedule = {
                                      ...configuration.businessHours.schedule,
                                      [day.key]: { ...dayConfig, close: e.target.value }
                                    };
                                    handleNestedConfigurationChange('businessHours', 'schedule', newSchedule);
                                  }}
                                  className="input text-sm"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Holidays */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-charcoal">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Holidays
                    </h3>
                    <button
                      onClick={() => {
                        const newHolidays = [...configuration.businessHours.holidays, ''];
                        handleNestedConfigurationChange('businessHours', 'holidays', newHolidays);
                      }}
                      className="btn-secondary text-sm"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Holiday
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {configuration.businessHours.holidays.map((holiday, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="date"
                          value={holiday}
                          onChange={(e) => {
                            const newHolidays = [...configuration.businessHours.holidays];
                            newHolidays[index] = e.target.value;
                            handleNestedConfigurationChange('businessHours', 'holidays', newHolidays);
                          }}
                          className="input flex-1"
                        />
                        <button
                          onClick={() => {
                            const newHolidays = configuration.businessHours.holidays.filter((_, i) => i !== index);
                            handleNestedConfigurationChange('businessHours', 'holidays', newHolidays);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Voicemail Tab */}
          {activeTab === 'voicemail' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Voicemail Configuration</h2>
                <p className="card-subtitle">
                  Configure voicemail settings and custom greetings
                </p>
              </div>

              <div className="space-y-6">
                {/* Enable Voicemail */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-charcoal">Enable Voicemail</h3>
                    <p className="text-sm text-slate">Allow callers to leave voicemail messages</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configuration.voicemail.enabled}
                      onChange={(e) => handleNestedConfigurationChange('voicemail', 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-voxlink-blue"></div>
                  </label>
                </div>

                {configuration.voicemail.enabled && (
                  <div className="space-y-6 pl-4 border-l-2 border-blue-100">
                    {/* Custom Greeting */}
                    <div>
                      <h3 className="text-sm font-medium text-charcoal mb-4">Custom Greeting</h3>
                      
                      {/* Text Greeting */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          Text-to-Speech Greeting
                        </label>
                        <textarea
                          value={configuration.voicemail.customGreeting || ''}
                          onChange={(e) => handleNestedConfigurationChange('voicemail', 'customGreeting', e.target.value)}
                          placeholder="Hi, you've reached [Your Name]. I'm not available right now, but please leave a message and I'll get back to you soon."
                          className="input h-24 resize-none"
                        />
                        <p className="text-xs text-slate mt-1">
                          Leave empty to use the default greeting
                        </p>
                      </div>

                      {/* Audio Upload */}
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          Or Upload Audio Greeting
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                          <div className="text-center">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <div className="text-sm text-gray-600 mb-2">
                              Drop your audio file here, or{' '}
                              <label className="text-voxlink-blue cursor-pointer hover:underline">
                                browse
                                <input
                                  type="file"
                                  accept="audio/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleGreetingUpload(file);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                            <p className="text-xs text-gray-500">
                              MP3, WAV up to 10MB
                            </p>
                          </div>
                        </div>

                        {/* Current Greeting Playback */}
                        {configuration.voicemail.greetingUrl && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-charcoal">Current greeting</span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setPlayingGreeting(!playingGreeting)}
                                  className="p-1 text-voxlink-blue hover:bg-blue-50 rounded"
                                >
                                  {playingGreeting ? (
                                    <Pause className="w-4 h-4" />
                                  ) : (
                                    <Play className="w-4 h-4" />
                                  )}
                                </button>
                                <Volume2 className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email Notifications */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-charcoal">Email Notifications</h3>
                        <p className="text-sm text-slate">Get notified when you receive voicemails</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={configuration.voicemail.emailNotifications}
                          onChange={(e) => handleNestedConfigurationChange('voicemail', 'emailNotifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-voxlink-blue"></div>
                      </label>
                    </div>

                    {/* Transcription */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-charcoal">Voicemail Transcription</h3>
                        <p className="text-sm text-slate">Automatically transcribe voicemails to text</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={configuration.voicemail.transcription}
                          onChange={(e) => handleNestedConfigurationChange('voicemail', 'transcription', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-voxlink-blue"></div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Notification Preferences</h2>
                <p className="card-subtitle">
                  Configure how and when you receive notifications
                </p>
              </div>

              <div className="space-y-6">
                {/* Notification Types */}
                <div>
                  <h3 className="text-sm font-medium text-charcoal mb-4">Notification Types</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'callReceived', label: 'Call Received', description: 'Get notified when you receive calls' },
                      { key: 'voicemailReceived', label: 'Voicemail Received', description: 'Get notified when you receive voicemails' },
                      { key: 'configurationChanged', label: 'Configuration Changed', description: 'Get notified when number settings are modified' },
                      { key: 'technicalIssues', label: 'Technical Issues', description: 'Get notified about service problems' },
                      { key: 'billingEvents', label: 'Billing Events', description: 'Get notified about payments and renewals' }
                    ].map((notification) => (
                      <div key={notification.key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="text-sm font-medium text-charcoal">{notification.label}</h4>
                          <p className="text-sm text-slate">{notification.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={configuration.notifications[notification.key as keyof typeof configuration.notifications] as boolean}
                            onChange={(e) => handleNestedConfigurationChange('notifications', notification.key, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-voxlink-blue"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Methods */}
                <div>
                  <h3 className="text-sm font-medium text-charcoal mb-4">Delivery Methods</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'email', label: 'Email', description: 'Receive notifications via email' },
                      { key: 'sms', label: 'SMS', description: 'Receive notifications via text message' },
                      { key: 'push', label: 'Push Notifications', description: 'Receive browser push notifications' }
                    ].map((method) => (
                      <div key={method.key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="text-sm font-medium text-charcoal">{method.label}</h4>
                          <p className="text-sm text-slate">{method.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={configuration.notifications.deliveryMethods[method.key as keyof typeof configuration.notifications.deliveryMethods]}
                            onChange={(e) => {
                              const newDeliveryMethods = {
                                ...configuration.notifications.deliveryMethods,
                                [method.key]: e.target.checked
                              };
                              handleNestedConfigurationChange('notifications', 'deliveryMethods', newDeliveryMethods);
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-voxlink-blue"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Tester */}
      <ConfigurationTester 
        phoneNumber={decodedPhoneNumber}
        onTestComplete={(results) => {
          const allPassed = results.every(test => test.status === 'passed');
          if (allPassed) {
            toast.success('All configuration tests passed!');
          } else {
            toast.error('Some configuration tests failed. Please review the results.');
          }
        }}
      />
    </div>
  );
};

export default NumberConfiguration;