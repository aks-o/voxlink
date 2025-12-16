import { PrismaClient, NotificationTemplate, NotificationType, NotificationChannel } from '@prisma/client';
import handlebars from 'handlebars';
import { logger } from '../utils/logger';

export interface CreateTemplateInput {
  name: string;
  type: NotificationType;
  channel: NotificationChannel;
  subject?: string;
  content: string;
  variables?: string[];
}

export interface RenderTemplateInput {
  templateId: string;
  variables: Record<string, any>;
}

export interface RenderResult {
  subject?: string;
  content: string;
}

export class TemplateService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new notification template
   */
  async createTemplate(input: CreateTemplateInput): Promise<NotificationTemplate> {
    try {
      // Validate template content by compiling it
      handlebars.compile(input.content);
      if (input.subject) {
        handlebars.compile(input.subject);
      }

      const template = await this.prisma.notificationTemplate.create({
        data: {
          name: input.name,
          type: input.type,
          channel: input.channel,
          subject: input.subject,
          content: input.content,
          variables: input.variables || [],
        },
      });

      logger.info('Notification template created', {
        templateId: template.id,
        name: template.name,
        type: template.type,
        channel: template.channel,
      });

      return template;
    } catch (error) {
      logger.error('Failed to create notification template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        input,
      });
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    return this.prisma.notificationTemplate.findUnique({
      where: { id: templateId },
    });
  }

  /**
   * Get template by name
   */
  async getTemplateByName(name: string): Promise<NotificationTemplate | null> {
    return this.prisma.notificationTemplate.findUnique({
      where: { name },
    });
  }

  /**
   * Get templates by type and channel
   */
  async getTemplatesByTypeAndChannel(
    type: NotificationType,
    channel: NotificationChannel
  ): Promise<NotificationTemplate[]> {
    return this.prisma.notificationTemplate.findMany({
      where: {
        type,
        channel,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Render template with variables
   */
  async renderTemplate(input: RenderTemplateInput): Promise<RenderResult> {
    try {
      const template = await this.getTemplate(input.templateId);
      if (!template) {
        throw new Error(`Template not found: ${input.templateId}`);
      }

      if (!template.isActive) {
        throw new Error(`Template is inactive: ${input.templateId}`);
      }

      // Compile and render content
      const contentTemplate = handlebars.compile(template.content);
      const content = contentTemplate(input.variables);

      let subject: string | undefined;
      if (template.subject) {
        const subjectTemplate = handlebars.compile(template.subject);
        subject = subjectTemplate(input.variables);
      }

      logger.debug('Template rendered successfully', {
        templateId: input.templateId,
        templateName: template.name,
        variableCount: Object.keys(input.variables).length,
      });

      return { subject, content };
    } catch (error) {
      logger.error('Failed to render template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId: input.templateId,
      });
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<CreateTemplateInput>
  ): Promise<NotificationTemplate> {
    try {
      // Validate template content if being updated
      if (updates.content) {
        handlebars.compile(updates.content);
      }
      if (updates.subject) {
        handlebars.compile(updates.subject);
      }

      const template = await this.prisma.notificationTemplate.update({
        where: { id: templateId },
        data: updates,
      });

      logger.info('Notification template updated', {
        templateId,
        updates: Object.keys(updates),
      });

      return template;
    } catch (error) {
      logger.error('Failed to update notification template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId,
        updates,
      });
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      await this.prisma.notificationTemplate.delete({
        where: { id: templateId },
      });

      logger.info('Notification template deleted', { templateId });
    } catch (error) {
      logger.error('Failed to delete notification template', {
        error: error instanceof Error ? error.message : 'Unknown error',
        templateId,
      });
      throw error;
    }
  }

  /**
   * List all templates
   */
  async listTemplates(
    limit = 50,
    offset = 0
  ): Promise<{ templates: NotificationTemplate[]; total: number }> {
    const [templates, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notificationTemplate.count(),
    ]);

    return { templates, total };
  }

  /**
   * Initialize default templates
   */
  async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates = [
      // Email templates
      {
        name: 'call_received_email',
        type: 'CALL_RECEIVED' as NotificationType,
        channel: 'EMAIL' as NotificationChannel,
        subject: 'Call received on {{phoneNumber}}',
        content: `
          <h2>Call Received</h2>
          <p>You received a call on your VoxLink number <strong>{{phoneNumber}}</strong>.</p>
          <ul>
            <li><strong>From:</strong> {{fromNumber}}</li>
            <li><strong>Duration:</strong> {{duration}} seconds</li>
            <li><strong>Time:</strong> {{timestamp}}</li>
          </ul>
          <p>You can manage your call settings in your <a href="{{dashboardUrl}}">VoxLink dashboard</a>.</p>
        `,
        variables: ['phoneNumber', 'fromNumber', 'duration', 'timestamp', 'dashboardUrl'],
      },
      {
        name: 'number_activated_email',
        type: 'NUMBER_ACTIVATED' as NotificationType,
        channel: 'EMAIL' as NotificationChannel,
        subject: 'Your VoxLink number {{phoneNumber}} is now active',
        content: `
          <h2>Number Activated Successfully</h2>
          <p>Great news! Your VoxLink number <strong>{{phoneNumber}}</strong> is now active and ready to receive calls.</p>
          <h3>Quick Setup:</h3>
          <ul>
            <li>Configure call forwarding in your dashboard</li>
            <li>Set up business hours</li>
            <li>Customize your voicemail greeting</li>
          </ul>
          <p><a href="{{dashboardUrl}}/numbers/{{numberId}}/configure">Configure your number now</a></p>
        `,
        variables: ['phoneNumber', 'numberId', 'dashboardUrl'],
      },
      {
        name: 'billing_invoice_email',
        type: 'BILLING_INVOICE' as NotificationType,
        channel: 'EMAIL' as NotificationChannel,
        subject: 'Your VoxLink invoice #{{invoiceNumber}} is ready',
        content: `
          <h2>Invoice Ready</h2>
          <p>Your VoxLink invoice for the period {{periodStart}} to {{periodEnd}} is now available.</p>
          <ul>
            <li><strong>Invoice Number:</strong> {{invoiceNumber}}</li>
            <li><strong>Amount:</strong> {{amount}}</li>
            <li><strong>Due Date:</strong> {{dueDate}}</li>
          </ul>
          <p><a href="{{invoiceUrl}}">View and pay your invoice</a></p>
        `,
        variables: ['invoiceNumber', 'periodStart', 'periodEnd', 'amount', 'dueDate', 'invoiceUrl'],
      },
      
      // SMS templates
      {
        name: 'call_received_sms',
        type: 'CALL_RECEIVED' as NotificationType,
        channel: 'SMS' as NotificationChannel,
        content: 'VoxLink: Call received on {{phoneNumber}} from {{fromNumber}} ({{duration}}s)',
        variables: ['phoneNumber', 'fromNumber', 'duration'],
      },
      {
        name: 'number_activated_sms',
        type: 'NUMBER_ACTIVATED' as NotificationType,
        channel: 'SMS' as NotificationChannel,
        content: 'VoxLink: Your number {{phoneNumber}} is now active! Configure it at {{shortUrl}}',
        variables: ['phoneNumber', 'shortUrl'],
      },
      
      // Push notification templates
      {
        name: 'call_received_push',
        type: 'CALL_RECEIVED' as NotificationType,
        channel: 'PUSH' as NotificationChannel,
        subject: 'Call received',
        content: 'Call from {{fromNumber}} on {{phoneNumber}}',
        variables: ['phoneNumber', 'fromNumber'],
      },
    ];

    for (const templateData of defaultTemplates) {
      try {
        const existing = await this.getTemplateByName(templateData.name);
        if (!existing) {
          await this.createTemplate(templateData);
          logger.info('Default template created', { name: templateData.name });
        }
      } catch (error) {
        logger.error('Failed to create default template', {
          name: templateData.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info('Default templates initialization completed');
  }
}