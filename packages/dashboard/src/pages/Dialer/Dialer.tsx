import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  Zap, 
  Users, 
  Phone, 
  Settings, 
  BarChart3,
  Activity,
  Target,
  Clock
} from 'lucide-react';
import PowerDialer from './PowerDialer';
import ParallelDialer from './ParallelDialer';
import SpeedDial from './SpeedDial';
import DialerSettings from '../../components/Dialer/DialerSettings';

const Dialer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [settingsDialerType, setSettingsDialerType] = useState<'power' | 'parallel' | 'speed'>('power');

  // Determine active tab based on current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/power')) return 'power';
    if (path.includes('/parallel')) return 'parallel';
    if (path.includes('/speed')) return 'speed';
    return 'power'; // default
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  const tabs = [
    { 
      id: 'power', 
      label: 'Power Dialer', 
      icon: Zap,
      description: 'Sequential automated dialing',
      path: '/dialer/power'
    },
    { 
      id: 'parallel', 
      label: 'Parallel Dialer', 
      icon: Users,
      description: 'Simultaneous multi-number dialing',
      path: '/dialer/parallel'
    },
    { 
      id: 'speed', 
      label: 'Speed Dial', 
      icon: Phone,
      description: 'Quick access to frequent contacts',
      path: '/dialer/speed'
    },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      navigate(tab.path);
    }
  };

  const handleOpenSettings = (dialerType: 'power' | 'parallel' | 'speed') => {
    setSettingsDialerType(dialerType);
    setShowSettings(true);
  };

  // Mock dialer metrics
  const dialerMetrics = {
    activeCampaigns: 3,
    totalAgents: 8,
    activeAgents: 5,
    callsInProgress: 12,
    callsPerMinute: 15.3,
    averageWaitTime: 2.4,
    connectionRate: 42.8,
    agentUtilization: 78.5,
    systemLoad: 65,
    queuedContacts: 1247,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">Auto Dialer System</h1>
          <p className="text-slate mt-1">
            Multi-mode dialing system for efficient outbound calling campaigns
          </p>
        </div>
        <button
          onClick={() => handleOpenSettings(activeTab as 'power' | 'parallel' | 'speed')}
          className="btn-secondary mt-4 sm:mt-0"
        >
          <Settings className="w-4 h-4 mr-2" />
          Dialer Settings
        </button>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-charcoal">{dialerMetrics.activeCampaigns}</div>
              <div className="text-sm text-slate">Active Campaigns</div>
            </div>
            <Target className="w-8 h-8 text-voxlink-blue" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-charcoal">{dialerMetrics.activeAgents}/{dialerMetrics.totalAgents}</div>
              <div className="text-sm text-slate">Active Agents</div>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-charcoal">{dialerMetrics.callsInProgress}</div>
              <div className="text-sm text-slate">Calls in Progress</div>
            </div>
            <Phone className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-charcoal">{dialerMetrics.callsPerMinute}</div>
              <div className="text-sm text-slate">Calls/Min</div>
            </div>
            <Activity className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-charcoal">{dialerMetrics.connectionRate}%</div>
              <div className="text-sm text-slate">Connection Rate</div>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-charcoal">{dialerMetrics.queuedContacts}</div>
              <div className="text-sm text-slate">Queued Contacts</div>
            </div>
            <Clock className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Dialer Mode Selection */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-voxlink-blue text-voxlink-blue'
                      : 'border-transparent text-slate hover:text-charcoal hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div>{tab.label}</div>
                    <div className="text-xs text-slate font-normal">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Dialer Content */}
      <Routes>
        <Route path="power" element={<PowerDialer />} />
        <Route path="parallel" element={<ParallelDialer />} />
        <Route path="speed" element={<SpeedDial />} />
        <Route path="" element={<PowerDialer />} />
      </Routes>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <DialerSettings 
                dialerType={settingsDialerType}
                onClose={() => setShowSettings(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dialer;