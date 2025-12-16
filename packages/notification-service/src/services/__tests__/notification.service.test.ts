import { NotificationService } from '../notification.service';
import { TemplateService } from '../template.service';
import { EmailService } from '../delivery/email.service';
import { SMSService } from '../delivery/sms.service';
import { WebhookService } from '../delivery/webhook.service';

// Mock the services
jest.mock('../template.service');
jest.mock('../delivery/email.service');
jest.mock('../delivery/sms.service');
jest.mock('../delivery/webhook.service');

const MockTemplateService = TemplateService as jest.MockedClass<typeof TemplateService>;
const MockEmailService = EmailService as jest.MockedClass<typeof EmailService>;
const MockSMSService = SMSService as jest.MockedClass<typeof SMSService>;
const MockWebhookService = WebhookService as jest.MockedClass<typeof WebhookService>;

describe('NotificationService', () => {
  let service: NotificationService;
  let mockPrisma: any;
  let mockTemplateService: jest.Mocked<TemplateService>;
  let mockEmailService: jest.Mocked<EmailService>;
  let mockSMSService: jest.Mocked<SMSService>;
  let mockWebhookService: jest.Mocked<WebhookService>;

  beforeEach(() => {
    // Mock Prisma client
    mockPrisma = {
      notificationPreference: {
        findUnique: jest.fn(),
      },
      notification: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      notificationDeliveryAttempt: {
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    // Create mock service instances
    mockTemplateService = new MockTemplateService(mockPrisma) as jest.Mocked<TemplateService>;
    mockEmailService = new MockEmailService() as jest.Mocked<EmailService>;
    mockSMSService = new MockSMSService() as jest.Mocked<SMSService>;
    mockWebhookService = new MockWebhookService() as jest.Mocked<WebhookService>;

    service = new NotificationService(
      mockPrisma,
      mockTemplateService,
      mockEmailService,
      mockSMSService,
      mockWebhookService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    const mockPreference = {
      id: 'pref1',
      userId: 'user1',
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: false,
      webhookEnabled: false,
      email: 'user@example.com',
      phoneNumber: '+1234567890',
      callNotifications: true,
      smsNotifications: true,
      billingNotifications: true,
      systemNotifications: true,
      portingNotifications: true,
      quietHoursEnabled: false,
    };

    const mockNotification = {
      id: 'notif1',
      userId: 'user1',
      type: 'CALL_RECEIVED',
      channel: 'EMAIL',
      priority: 'NORMAL',
      status: 'PENDING',
      content: 'Test notification',
      createdAt: new Date(),
    };

    it('should create notifications for enabled channels', async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue(mockPreference);
      mockPrisma.notification.create.mockResolvedValue(mockNotification);

      const result = await service.createNotification({
        userId: 'user1',
        type: 'CALL_RECEIVED',
        content: 'Test notification',
      });

      expect(result).toHaveLength(2); // EMAIL and SMS should be enabled
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2);
    });

    it('should use template when templateId is provided', async () => {
      mockPrisma.notificationPreference.findUnique.mockResolvedValue(mockPreference);
      mockPrisma.notification.create.mockResolvedValue(mockNotification);
      mockTemplateService.renderTemplate.mockResolvedValue({
        subject: 'Rendered Subject',
        content: 'Rendered Content',
      });

      await service.createNotification({
        userId: 'user1',
        type: 'CALL_RECEIVED',
        templateId: 'template1',
        data: { phoneNumber: '+1234567890' },
      });

      expect(mockTemplateService.renderTemplate).toHaveBeenCalledWith({
        templateId: 'template1',
        variables: { phoneNumber: '+1234567890' },
      });
    });

    it('should return empty array when no channels are enabled', async () => {
      const disabledPreference = {
        ...mockPreference,
        emailEnabled: false,
        smsEnabled: false,
        callNotifications: false,
      };

      mockPrisma.notificationPreference.findUnique.mockResolvedValue(disabledPreference);

      const result = await service.createNotification({
        userId: 'user1',
        type: 'CALL_RECEIVED',
        content: 'Test notification',
      });

      expect(result).toHaveLength(0);
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('sendNotification', () => {
    const mockNotification = {
      id: 'notif1',
      userId: 'user1',
      type: 'CALL_RECEIVED',
      channel: 'EMAIL',
      status: 'PENDING',
      subject: 'Test Subject',
      content: 'Test Content',
      preference: {
        email: 'user@example.com',
        phoneNumber: '+1234567890',
        webhookUrl: 'https://example.com/webhook',
      },
    };

    const mockAttempt = {
      id: 'attempt1',
      notificationId: 'notif1',
      channel: 'EMAIL',
      status: 'PENDING',
    };

    beforeEach(() => {
      mockPrisma.notification.findUnique.mockResolvedValue(mockNotification);
      mockPrisma.notification.update.mockResolvedValue(mockNotification);
      mockPrisma.notificationDeliveryAttempt.create.mockResolvedValue(mockAttempt);
      mockPrisma.notificationDeliveryAttempt.update.mockResolvedValue(mockAttempt);
    });

    it('should send email notification successfully', async () => {
      mockEmailService.sendEmail.mockResolvedValue({
        success: true,
        messageId: 'email123',
      });

      const result = await service.sendNotification('notif1');

      expect(result).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Test Subject',
        content: 'Test Content',
      });
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif1' },
        data: {
          status: 'DELIVERED',
          deliveredAt: expect.any(Date),
          failedAt: undefined,
          errorMessage: undefined,
        },
      });
    });

    it('should send SMS notification successfully', async () => {
      const smsNotification = { ...mockNotification, channel: 'SMS' };
      mockPrisma.notification.findUnique.mockResolvedValue(smsNotification);
      mockSMSService.sendSMS.mockResolvedValue({
        success: true,
        messageId: 'sms123',
      });

      const result = await service.sendNotification('notif1');

      expect(result).toBe(true);
      expect(mockSMSService.sendSMS).toHaveBeenCalledWith({
        to: '+1234567890',
        content: 'Test Content',
      });
    });

    it('should send webhook notification successfully', async () => {
      const webhookNotification = { ...mockNotification, channel: 'WEBHOOK' };
      mockPrisma.notification.findUnique.mockResolvedValue(webhookNotification);
      mockWebhookService.sendWebhookWithRetry.mockResolvedValue({
        success: true,
        statusCode: 200,
      });

      const result = await service.sendNotification('notif1');

      expect(result).toBe(true);
      expect(mockWebhookService.sendWebhookWithRetry).toHaveBeenCalledWith({
        url: 'https://example.com/webhook',
        payload: expect.objectContaining({
          id: 'notif1',
          type: 'CALL_RECEIVED',
          userId: 'user1',
          content: 'Test Content',
          subject: 'Test Subject',
        }),
        retries: undefined,
      });
    });

    it('should handle notification not found', async () => {
      mockPrisma.notification.findUnique.mockResolvedValue(null);

      const result = await service.sendNotification('nonexistent');

      expect(result).toBe(false);
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should handle delivery failure', async () => {
      mockEmailService.sendEmail.mockResolvedValue({
        success: false,
        error: 'Email delivery failed',
      });

      const result = await service.sendNotification('notif1');

      expect(result).toBe(false);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif1' },
        data: {
          status: 'FAILED',
          deliveredAt: undefined,
          failedAt: expect.any(Date),
          errorMessage: undefined,
        },
      });
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications with pagination', async () => {
      const mockNotifications = [
        { id: 'notif1', userId: 'user1', type: 'CALL_RECEIVED' },
        { id: 'notif2', userId: 'user1', type: 'SMS_RECEIVED' },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.notification.count.mockResolvedValue(2);

      const result = await service.getUserNotifications('user1', 10, 0);

      expect(result).toEqual({
        notifications: mockNotifications,
        total: 2,
      });
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });
  });
});