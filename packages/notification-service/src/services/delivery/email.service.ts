import nodemailer from 'nodemailer';
import { config } from '../../config/config';
import { logger } from '../../utils/logger';

export interface EmailDeliveryInput {
  to: string;
  subject: string;
  content: string;
  from?: {
    name: string;
    address: string;
  };
}

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: {
        user: config.email.smtp.auth.user,
        pass: config.email.smtp.auth.pass,
      },
    });
  }

  /**
   * Send email notification
   */
  async sendEmail(input: EmailDeliveryInput): Promise<EmailDeliveryResult> {
    try {
      const from = input.from || config.email.from;

      const mailOptions = {
        from: `"${from.name}" <${from.address}>`,
        to: input.to,
        subject: input.subject,
        html: input.content,
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('Email sent successfully', {
        to: input.to,
        subject: input.subject,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      logger.error('Failed to send email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: input.to,
        subject: input.subject,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(to: string): Promise<EmailDeliveryResult> {
    return this.sendEmail({
      to,
      subject: 'VoxLink Email Service Test',
      content: `
        <h2>Email Service Test</h2>
        <p>This is a test email from the VoxLink notification service.</p>
        <p>If you received this email, the email service is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      `,
    });
  }
}