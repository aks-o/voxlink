import { Router, Request, Response } from 'express';
import { integrationService } from '../services/integration.service';
import { logger } from '../utils/logger';

export const createIntegrationsRouter = () => {
  const router = Router();

  // Get all integration providers/templates
  router.get('/templates', async (req: Request, res: Response) => {
    try {
      const providers = integrationService.getProviders();
      const templates = providers.map(provider => ({
        id: provider.id,
        name: provider.name,
        description: `Connect with ${provider.name} to sync your data`,
        category: getCategoryForProvider(provider.id),
        provider: provider.name,
        logoUrl: `/images/integrations/${provider.id}.png`,
        documentationUrl: `https://docs.voxlink.com/integrations/${provider.id}`,
        isPopular: ['salesforce', 'hubspot', 'slack'].includes(provider.id),
        config: {
          authType: provider.authType,
          baseUrl: provider.baseUrl,
          rateLimits: provider.rateLimits
        },
        requiredFields: getRequiredFieldsForProvider(provider.id),
        optionalFields: getOptionalFieldsForProvider(provider.id),
        supportedFeatures: getSupportedFeaturesForProvider(provider.id),
        webhookEvents: provider.webhookConfig?.supportedEvents || []
      }));

      res.json(templates);
    } catch (error) {
      logger.error('Failed to get integration templates:', error as any);
      res.status(500).json({ error: 'Failed to get integration templates' });
    }
  });

  // Get specific template
  router.get('/templates/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const providers = integrationService.getProviders();
      const provider = providers.find(p => p.id === id);

      if (!provider) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const template = {
        id: provider.id,
        name: provider.name,
        description: `Connect with ${provider.name} to sync your data`,
        category: getCategoryForProvider(provider.id),
        provider: provider.name,
        logoUrl: `/images/integrations/${provider.id}.png`,
        documentationUrl: `https://docs.voxlink.com/integrations/${provider.id}`,
        isPopular: ['salesforce', 'hubspot', 'slack'].includes(provider.id),
        config: {
          authType: provider.authType,
          baseUrl: provider.baseUrl,
          rateLimits: provider.rateLimits
        },
        requiredFields: getRequiredFieldsForProvider(provider.id),
        optionalFields: getOptionalFieldsForProvider(provider.id),
        supportedFeatures: getSupportedFeaturesForProvider(provider.id),
        webhookEvents: provider.webhookConfig?.supportedEvents || []
      };

      res.json(template);
    } catch (error) {
      logger.error('Failed to get integration template:', error as any);
      res.status(500).json({ error: 'Failed to get integration template' });
    }
  });

  // Create integration from template
  router.post('/templates/:id/create', async (req: Request, res: Response) => {
    try {
      const { id: providerId } = req.params;
      const userId = req.user?.id; // Assuming user is attached to request
      const config = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // For OAuth integrations, initiate OAuth flow
      const providers = integrationService.getProviders();
      const provider = providers.find(p => p.id === providerId);

      if (!provider) {
        return res.status(404).json({ error: 'Provider not found' });
      }

      if (provider.authType === 'oauth2') {
        const redirectUri = `${req.protocol}://${req.get('host')}/integrations/oauth/callback`;
        const oauthResult = await integrationService.initiateOAuth(providerId, userId, redirectUri);

        res.json({
          requiresOAuth: true,
          authUrl: oauthResult.authUrl,
          state: oauthResult.state
        });
      } else {
        // For API key integrations, create directly
        // This would be implemented based on the specific provider requirements
        res.json({ message: 'API key integration creation not yet implemented' });
      }
    } catch (error) {
      logger.error('Failed to create integration from template:', error as any);
      res.status(500).json({ error: 'Failed to create integration' });
    }
  });

  // Get user's integrations
  router.get('/', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const instances = integrationService.getInstances(userId);
      const integrations = instances.map(instance => ({
        id: instance.id,
        name: instance.name,
        description: `${instance.name} integration`,
        category: getCategoryForProvider(instance.providerId),
        provider: instance.providerId,
        version: '1.0',
        status: instance.status,
        config: {
          authType: 'oauth2', // This would come from the provider
          syncInterval: 60
        },
        credentials: {
          // Don't expose sensitive credentials
          authType: 'oauth2',
          tokenExpiry: instance.credentials.tokenExpiry
        },
        webhooks: [],
        lastSync: instance.lastSync,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt
      }));

      res.json(integrations);
    } catch (error) {
      logger.error('Failed to get integrations:', error as any);
      res.status(500).json({ error: 'Failed to get integrations' });
    }
  });

  // Get specific integration
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const instance = integrationService.getInstance(id);
      if (!instance || instance.userId !== userId) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      const integration = {
        id: instance.id,
        name: instance.name,
        description: `${instance.name} integration`,
        category: getCategoryForProvider(instance.providerId),
        provider: instance.providerId,
        version: '1.0',
        status: instance.status,
        config: {
          authType: 'oauth2',
          syncInterval: 60
        },
        credentials: {
          authType: 'oauth2',
          tokenExpiry: instance.credentials.tokenExpiry
        },
        webhooks: [],
        lastSync: instance.lastSync,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt
      };

      res.json(integration);
    } catch (error) {
      logger.error('Failed to get integration:', error as any);
      res.status(500).json({ error: 'Failed to get integration' });
    }
  });

  // Test integration
  router.post('/:id/test', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const instance = integrationService.getInstance(id);
      if (!instance || instance.userId !== userId) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      const result = await integrationService.testIntegration(id);
      res.json(result);
    } catch (error) {
      logger.error('Failed to test integration:', error as any);
      res.status(500).json({ error: 'Failed to test integration' });
    }
  });

  // Trigger sync
  router.post('/:id/sync', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const options = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const instance = integrationService.getInstance(id);
      if (!instance || instance.userId !== userId) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      await integrationService.triggerSync(id, options);

      res.json({
        success: true,
        message: 'Sync triggered successfully',
        syncId: `sync-${Date.now()}`
      });
    } catch (error) {
      logger.error('Failed to trigger sync:', error as any);
      res.status(500).json({ error: 'Failed to trigger sync' });
    }
  });

  // OAuth callback
  router.get('/oauth/callback', async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;

      if (!code || !state) {
        return res.status(400).json({ error: 'Missing code or state parameter' });
      }

      const redirectUri = `${req.protocol}://${req.get('host')}/integrations/oauth/callback`;
      const integration = await integrationService.completeOAuth(
        code as string,
        state as string,
        redirectUri
      );

      // Redirect to frontend with success
      res.redirect(`/integrations?success=true&integration=${integration.id}`);
    } catch (error) {
      logger.error('OAuth callback failed:', error as any);
      res.redirect('/integrations?error=oauth_failed');
    }
  });

  // Webhook endpoint
  router.post('/webhooks/:providerId', async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const payload = req.body;
      const headers = req.headers as Record<string, string>;

      await integrationService.processWebhook(providerId, payload, headers);

      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Webhook processing failed:', error as any);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  });

  // Custom API call
  router.post('/:id/api-call', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { method, endpoint, data, headers } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const instance = integrationService.getInstance(id);
      if (!instance || instance.userId !== userId) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      const result = await integrationService.makeAPICall(id, {
        method,
        endpoint,
        data,
        headers
      });

      res.json(result);
    } catch (error) {
      logger.error('Custom API call failed:', error as any);
      res.status(500).json({ error: 'API call failed' });
    }
  });

  // Delete integration
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const instance = integrationService.getInstance(id);
      if (!instance || instance.userId !== userId) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      await integrationService.deleteInstance(id);
      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to delete integration:', error as any);
      res.status(500).json({ error: 'Failed to delete integration' });
    }
  });

  // Get integration stats
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const instances = integrationService.getInstances(userId);

      const stats = {
        totalIntegrations: instances.length,
        activeIntegrations: instances.filter(i => i.status === 'active').length,
        errorIntegrations: instances.filter(i => i.status === 'error').length,
        syncStats: {
          totalSyncs: instances.length * 10, // Mock data
          successfulSyncs: instances.length * 9,
          failedSyncs: instances.length * 1,
          averageSyncTime: 2.5
        },
        webhookStats: {
          totalWebhooks: instances.length * 5,
          successfulWebhooks: instances.length * 4,
          failedWebhooks: instances.length * 1,
          averageProcessingTime: 0.5
        },
        apiStats: {
          totalRequests: instances.length * 100,
          successfulRequests: instances.length * 95,
          failedRequests: instances.length * 5,
          averageResponseTime: 1.2
        }
      };

      res.json(stats);
    } catch (error) {
      logger.error('Failed to get integration stats:', error as any);
      res.status(500).json({ error: 'Failed to get integration stats' });
    }
  });

  return router;
};

// Helper functions
function getCategoryForProvider(providerId: string): string {
  const categoryMap: Record<string, string> = {
    'salesforce': 'crm',
    'hubspot': 'crm',
    'slack': 'communication',
    'microsoft-teams': 'communication',
    'zapier': 'productivity'
  };
  return categoryMap[providerId] || 'custom';
}

function getRequiredFieldsForProvider(providerId: string): string[] {
  const fieldsMap: Record<string, string[]> = {
    'salesforce': ['instanceUrl'],
    'hubspot': [],
    'slack': ['workspaceId'],
    'microsoft-teams': ['tenantId'],
    'zapier': ['webhookUrl']
  };
  return fieldsMap[providerId] || [];
}

function getOptionalFieldsForProvider(providerId: string): string[] {
  const fieldsMap: Record<string, string[]> = {
    'salesforce': ['sandbox'],
    'hubspot': ['portalId'],
    'slack': ['channelId'],
    'microsoft-teams': ['teamId'],
    'zapier': []
  };
  return fieldsMap[providerId] || [];
}

function getSupportedFeaturesForProvider(providerId: string): string[] {
  const featuresMap: Record<string, string[]> = {
    'salesforce': ['Contacts Sync', 'Leads Sync', 'Opportunities Sync', 'Real-time Webhooks'],
    'hubspot': ['Contacts Sync', 'Deals Sync', 'Companies Sync', 'Real-time Webhooks'],
    'slack': ['Message Notifications', 'Channel Integration', 'User Sync'],
    'microsoft-teams': ['Message Notifications', 'Team Integration', 'User Sync'],
    'zapier': ['Custom Workflows', 'Trigger Actions', 'Data Transformation']
  };
  return featuresMap[providerId] || ['Basic Integration'];
}

export const integrationsRouter = createIntegrationsRouter();