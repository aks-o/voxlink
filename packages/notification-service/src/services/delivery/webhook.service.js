"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../../config/config");
const logger_1 = require("../../utils/logger");
class WebhookService {
    /**
     * Send webhook notification
     */
    async sendWebhook(input) {
        try {
            const payload = JSON.stringify(input.payload);
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'VoxLink-Webhook/1.0',
                ...input.headers,
            };
            // Add signature if secret is provided
            if (input.secret) {
                const signature = this.generateSignature(payload, input.secret);
                headers['X-VoxLink-Signature'] = signature;
            }
            // Add timestamp
            headers['X-VoxLink-Timestamp'] = Math.floor(Date.now() / 1000).toString();
            const response = await fetch(input.url, {
                method: 'POST',
                headers,
                body: payload,
                signal: AbortSignal.timeout(30000), // 30 second timeout
            });
            const responseBody = await response.text();
            if (response.ok) {
                logger_1.logger.info('Webhook sent successfully', {
                    url: input.url,
                    statusCode: response.status,
                    responseLength: responseBody.length,
                });
                return {
                    success: true,
                    statusCode: response.status,
                    responseBody,
                };
            }
            else {
                logger_1.logger.warn('Webhook returned non-success status', {
                    url: input.url,
                    statusCode: response.status,
                    responseBody,
                });
                return {
                    success: false,
                    statusCode: response.status,
                    responseBody,
                    error: `HTTP ${response.status}: ${response.statusText}`,
                };
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to send webhook', {
                error: error instanceof Error ? error.message : 'Unknown error',
                url: input.url,
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    /**
     * Send webhook with retry logic
     */
    async sendWebhookWithRetry(input) {
        const maxRetries = input.retries || config_1.config.retry.maxAttempts;
        let lastResult;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            lastResult = await this.sendWebhook(input);
            if (lastResult.success) {
                return lastResult;
            }
            if (attempt < maxRetries) {
                const delay = this.calculateRetryDelay(attempt);
                logger_1.logger.info('Retrying webhook after delay', {
                    url: input.url,
                    attempt,
                    maxRetries,
                    delay,
                });
                await this.sleep(delay);
            }
        }
        return lastResult;
    }
    /**
     * Generate HMAC signature for webhook payload
     */
    generateSignature(payload, secret) {
        return crypto_1.default
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
    }
    /**
     * Verify webhook signature
     */
    verifySignature(payload, signature, secret) {
        const expectedSignature = this.generateSignature(payload, secret);
        return crypto_1.default.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
    }
    /**
     * Calculate retry delay with exponential backoff
     */
    calculateRetryDelay(attempt) {
        const baseDelay = config_1.config.retry.baseDelay;
        const maxDelay = config_1.config.retry.maxDelay;
        const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        return Math.floor(delay + jitter);
    }
    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Test webhook endpoint
     */
    async testWebhook(url, secret) {
        const testPayload = {
            event: 'webhook.test',
            timestamp: new Date().toISOString(),
            data: {
                message: 'This is a test webhook from VoxLink',
            },
        };
        return this.sendWebhook({
            url,
            payload: testPayload,
            secret,
        });
    }
}
exports.WebhookService = WebhookService;
