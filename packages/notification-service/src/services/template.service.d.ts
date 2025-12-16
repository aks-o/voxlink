import { PrismaClient, NotificationTemplate, NotificationType, NotificationChannel } from '@prisma/client';
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
export declare class TemplateService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Create a new notification template
     */
    createTemplate(input: CreateTemplateInput): Promise<NotificationTemplate>;
    /**
     * Get template by ID
     */
    getTemplate(templateId: string): Promise<NotificationTemplate | null>;
    /**
     * Get template by name
     */
    getTemplateByName(name: string): Promise<NotificationTemplate | null>;
    /**
     * Get templates by type and channel
     */
    getTemplatesByTypeAndChannel(type: NotificationType, channel: NotificationChannel): Promise<NotificationTemplate[]>;
    /**
     * Render template with variables
     */
    renderTemplate(input: RenderTemplateInput): Promise<RenderResult>;
    /**
     * Update template
     */
    updateTemplate(templateId: string, updates: Partial<CreateTemplateInput>): Promise<NotificationTemplate>;
    /**
     * Delete template
     */
    deleteTemplate(templateId: string): Promise<void>;
    /**
     * List all templates
     */
    listTemplates(limit?: number, offset?: number): Promise<{
        templates: NotificationTemplate[];
        total: number;
    }>;
    /**
     * Initialize default templates
     */
    initializeDefaultTemplates(): Promise<void>;
}
