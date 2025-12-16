"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = require("../../config/config");
const logger_1 = require("../../utils/logger");
class EmailService {
    constructor() {
        this.transporter = nodemailer_1.default.createTransporter({
            host: config_1.config.email.smtp.host,
            port: config_1.config.email.smtp.port,
            secure: config_1.config.email.smtp.secure,
            auth: {
                user: config_1.config.email.smtp.auth.user,
                pass: config_1.config.email.smtp.auth.pass,
            },
        });
    }
    /**
     * Send email notification
     */
    async sendEmail(input) {
        try {
            const from = input.from || config_1.config.email.from;
            const mailOptions = {
                from: `"${from.name}" <${from.address}>`,
                to: input.to,
                subject: input.subject,
                html: input.content,
            };
            const info = await this.transporter.sendMail(mailOptions);
            logger_1.logger.info('Email sent successfully', {
                to: input.to,
                subject: input.subject,
                messageId: info.messageId,
            });
            return {
                success: true,
                messageId: info.messageId,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to send email', {
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
    async verifyConnection() {
        try {
            await this.transporter.verify();
            logger_1.logger.info('Email service connection verified');
            return true;
        }
        catch (error) {
            logger_1.logger.error('Email service connection failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
    /**
     * Send test email
     */
    async sendTestEmail(to) {
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
exports.EmailService = EmailService;
