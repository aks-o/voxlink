import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Key, 
  Settings, 
  Clock,
  Zap,
  Shield
} from 'lucide-react';
import { Integration, IntegrationCredentials } from '@voxlink/shared/types/integrations';
import integrationService from '../../services/integrations';
import WebhookManager from './WebhookManager';

interface IntegrationConfigProps {
  integration: Integration;
  onUpdate: () => void;
}

const IntegrationConfig: React.FC<IntegrationConfigProps> = ({ integration, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'credentials' | 'sync' | 'webhooks' | 'logs'>('general');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState(integration.config);
  const [credentials, setCredentials] = useState<Partial<IntegrationCredentials>>({});
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'sync') {
      loadSyncStatus();
    } else if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, integration.id]);

  const loadSyncStatus = async () => {
    try {
      const status = await integrationService.getSyncStatus(integration.id);
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const logsData = await integrationService.getIntegrationLogs(integration.id, { limit: 50 });
      setLogs(logsData);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      await integrationService.updateIntegration(integration.id, { config });
      onUpdate();
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredentials = async () => {
    try {
      setLoading(true);
      await integrationService.updateCredentials(integration.id, credentials);
      onUpdate();
    } catch (error) {
      console.error('Failed to update credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    try {
      setLoading(true);
      await integrationService.triggerSync(integration.id);
      loadSyncStatus();
      onUpdate();
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'credentials', label: 'Credentials', icon: Key },
    { id: 'sync', label: 'Sync', icon: RefreshCw },
    { id: 'webhooks', label: 'Webhooks', icon: Zap },
    { id: 'logs', label: 'Logs', icon: Shield }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{integration.name}</h2>
            <p className="text-gray-600">{integration.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              integration.status === 'active' ? 'bg-green-100 text-green-800' :
              integration.status === 'error' ? 'bg-red-100 text-red-800' :
              integration.status === 'syncing' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {integration.status.charAt(0).toUpperCase() + integration.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-voxlink-blue text-voxlink-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'general' && (
          <GeneralConfig 
            config={config} 
            onChange={setConfig} 
            onSave={handleSaveConfig}
            loading={loading}
          />
        )}

        {activeTab === 'credentials' && (
          <CredentialsConfig 
            integration={integration}
            credentials={credentials}
            onChange={setCredentials}
            onSave={handleUpdateCredentials}
            loading={loading}
          />
        )}

        {activeTab === 'sync' && (
          <SyncConfig 
            integration={integration}
            syncStatus={syncStatus}
            onTriggerSync={handleTriggerSync}
            loading={loading}
          />
        )}

        {activeTab === 'webhooks' && (
          <WebhookManager integrationId={integration.id} />
        )}

        {activeTab === 'logs' && (
          <LogsView logs={logs} onRefresh={loadLogs} />
        )}
      </div>
    </div>
  );
};

// General Configuration Component
const GeneralConfig: React.FC<{
  config: any;
  onChange: (config: any) => void;
  onSave: () => void;
  loading: boolean;
}> = ({ config, onChange, onSave, loading }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sync Interval (minutes)
        </label>
        <input
          type="number"
          value={config.syncInterval || 60}
          onChange={(e) => onChange({ ...config, syncInterval: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
          min="5"
          max="1440"
        />
        <p className="text-xs text-gray-500 mt-1">
          How often to sync data (minimum 5 minutes)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rate Limit (requests per minute)
        </label>
        <input
          type="number"
          value={config.rateLimits?.requestsPerMinute || 60}
          onChange={(e) => onChange({ 
            ...config, 
            rateLimits: { 
              ...config.rateLimits, 
              requestsPerMinute: parseInt(e.target.value) 
            }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
          min="1"
          max="1000"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="retryEnabled"
          checked={config.retryPolicy?.maxRetries > 0}
          onChange={(e) => onChange({
            ...config,
            retryPolicy: {
              ...config.retryPolicy,
              maxRetries: e.target.checked ? 3 : 0
            }
          })}
          className="rounded border-gray-300 text-voxlink-blue focus:ring-voxlink-blue"
        />
        <label htmlFor="retryEnabled" className="ml-2 text-sm text-gray-700">
          Enable automatic retries on failure
        </label>
      </div>

      <div className="pt-4">
        <button
          onClick={onSave}
          disabled={loading}
          className="px-4 py-2 bg-voxlink-blue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Configuration</span>
        </button>
      </div>
    </div>
  );
};

// Credentials Configuration Component
const CredentialsConfig: React.FC<{
  integration: Integration;
  credentials: Partial<IntegrationCredentials>;
  onChange: (credentials: Partial<IntegrationCredentials>) => void;
  onSave: () => void;
  loading: boolean;
}> = ({ integration, credentials, onChange, onSave, loading }) => {
  const isOAuth = integration.config.authType === 'oauth2';
  const isApiKey = integration.config.authType === 'api_key';

  return (
    <div className="space-y-6">
      {isOAuth && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">OAuth 2.0 Authentication</h4>
          </div>
          <p className="text-sm text-blue-700 mb-3">
            This integration uses OAuth 2.0 for secure authentication. 
            {integration.credentials.tokenExpiry && (
              <span className="block mt-1">
                Token expires: {new Date(integration.credentials.tokenExpiry).toLocaleString()}
              </span>
            )}
          </p>
          <button
            onClick={() => {/* Trigger OAuth refresh */}}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Refresh Token
          </button>
        </div>
      )}

      {isApiKey && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <input
            type="password"
            value={credentials.apiKey || ''}
            onChange={(e) => onChange({ ...credentials, apiKey: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
            placeholder="Enter your API key"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your API key will be encrypted and stored securely
          </p>
        </div>
      )}

      <div className="pt-4">
        <button
          onClick={onSave}
          disabled={loading}
          className="px-4 py-2 bg-voxlink-blue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Update Credentials</span>
        </button>
      </div>
    </div>
  );
};

// Sync Configuration Component
const SyncConfig: React.FC<{
  integration: Integration;
  syncStatus: any;
  onTriggerSync: () => void;
  loading: boolean;
}> = ({ integration, syncStatus, onTriggerSync, loading }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Last Sync</h4>
          <p className="text-sm text-gray-600">
            {integration.lastSync 
              ? new Date(integration.lastSync).toLocaleString()
              : 'Never'
            }
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Sync Status</h4>
          <div className="flex items-center space-x-2">
            {syncStatus?.isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-sm text-blue-600">Running</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Idle</span>
              </>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Next Sync</h4>
          <p className="text-sm text-gray-600">
            {syncStatus?.eta 
              ? new Date(syncStatus.eta).toLocaleString()
              : 'Not scheduled'
            }
          </p>
        </div>
      </div>

      {syncStatus?.isRunning && syncStatus.progress && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Sync Progress</span>
            <span className="text-sm text-gray-500">{Math.round(syncStatus.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-voxlink-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${syncStatus.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="pt-4">
        <button
          onClick={onTriggerSync}
          disabled={loading || syncStatus?.isRunning}
          className="px-4 py-2 bg-voxlink-blue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span>Trigger Sync Now</span>
        </button>
      </div>
    </div>
  );
};

// Logs View Component
const LogsView: React.FC<{
  logs: any[];
  onRefresh: () => void;
}> = ({ logs, onRefresh }) => {
  const getLogIcon = (type: string, status: string) => {
    if (status === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (status === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;
    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Recent Activity</h4>
        <button
          onClick={onRefresh}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No logs available
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                {getLogIcon(log.type, log.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{log.type}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{log.message}</p>
                  {log.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IntegrationConfig;