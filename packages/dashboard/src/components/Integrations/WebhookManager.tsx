import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ExternalLink,
  Copy
} from 'lucide-react';
import { WebhookConfig, WebhookEvent } from '@voxlink/shared/types/integrations';
import integrationService from '../../services/integrations';

interface WebhookManagerProps {
  integrationId: string;
}

const WebhookManager: React.FC<WebhookManagerProps> = ({ integrationId }) => {
  const [webhooks, setWebhooks] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookEvent | null>(null);

  useEffect(() => {
    loadWebhooks();
  }, [integrationId]);

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const data = await integrationService.getWebhooks(integrationId);
      setWebhooks(data);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWebhook = async (webhookData: { url: string; events: string[]; secret?: string }) => {
    try {
      await integrationService.createWebhook(integrationId, webhookData);
      setShowCreateModal(false);
      loadWebhooks();
    } catch (error) {
      console.error('Failed to create webhook:', error);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    
    try {
      await integrationService.deleteWebhook(integrationId, webhookId);
      loadWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    try {
      const result = await integrationService.testWebhook(integrationId, webhookId);
      alert(result.success ? 'Webhook test successful!' : 'Webhook test failed');
    } catch (error) {
      console.error('Failed to test webhook:', error);
    }
  };

  const copyWebhookUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    // You could show a toast notification here
  };

  const getStatusIcon = (processed: boolean, processingError?: string) => {
    if (processingError) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    if (processed) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-voxlink-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Webhooks</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-voxlink-blue text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Webhook</span>
        </button>
      </div>

      {webhooks.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <ExternalLink className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No webhooks configured</h4>
          <p className="text-gray-500 mb-4">
            Set up webhooks to receive real-time notifications when events occur in your integrated service.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-voxlink-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Webhook
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(webhook.processed, webhook.processingError)}
                    <h4 className="text-lg font-medium text-gray-900">
                      {webhook.event}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>ID: {webhook.id}</span>
                    <span>•</span>
                    <span>{new Date(webhook.timestamp).toLocaleString()}</span>
                    {webhook.retryCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-yellow-600">Retries: {webhook.retryCount}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTestWebhook(webhook.id)}
                    className="p-2 text-gray-400 hover:text-voxlink-blue transition-colors"
                    title="Test webhook"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingWebhook(webhook)}
                    className="p-2 text-gray-400 hover:text-voxlink-blue transition-colors"
                    title="Edit webhook"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteWebhook(webhook.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete webhook"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {webhook.processingError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Error:</strong> {webhook.processingError}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Payload</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(webhook.payload, null, 2)}
                  </pre>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Headers</label>
                  <div className="mt-1 space-y-1">
                    {Object.entries(webhook.headers).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="font-mono text-gray-600">{key}:</span>
                        <span className="font-mono text-gray-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Webhook Modal */}
      {(showCreateModal || editingWebhook) && (
        <WebhookModal
          webhook={editingWebhook}
          onSave={handleCreateWebhook}
          onClose={() => {
            setShowCreateModal(false);
            setEditingWebhook(null);
          }}
        />
      )}
    </div>
  );
};

interface WebhookModalProps {
  webhook?: WebhookEvent | null;
  onSave: (data: { url: string; events: string[]; secret?: string }) => void;
  onClose: () => void;
}

const WebhookModal: React.FC<WebhookModalProps> = ({ webhook, onSave, onClose }) => {
  const [url, setUrl] = useState(webhook?.integrationId || '');
  const [events, setEvents] = useState<string[]>([]);
  const [secret, setSecret] = useState('');

  const availableEvents = [
    'contact.created',
    'contact.updated',
    'contact.deleted',
    'lead.created',
    'lead.updated',
    'deal.created',
    'deal.updated',
    'call.started',
    'call.ended',
    'message.received',
    'message.sent'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ url, events, secret: secret || undefined });
  };

  const toggleEvent = (event: string) => {
    setEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {webhook ? 'Edit Webhook' : 'Create Webhook'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
              placeholder="https://your-app.com/webhooks/voxlink"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Events to Subscribe
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableEvents.map(event => (
                <label key={event} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={events.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="rounded border-gray-300 text-voxlink-blue focus:ring-voxlink-blue"
                  />
                  <span className="ml-2 text-sm text-gray-700">{event}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secret (Optional)
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-voxlink-blue focus:border-transparent"
              placeholder="Webhook secret for signature verification"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used to verify webhook authenticity
            </p>
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <button
              type="submit"
              disabled={!url || events.length === 0}
              className="flex-1 px-4 py-2 bg-voxlink-blue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {webhook ? 'Update' : 'Create'} Webhook
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WebhookManager;