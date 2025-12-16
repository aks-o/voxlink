"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keySize = 32; // 256 bits
        this.ivSize = 16; // 128 bits
        this.tagSize = 16; // 128 bits
    }
    /**
     * Encrypt sensitive data
     */
    async encryptData(data, keyId) {
        try {
            const key = await this.getEncryptionKey(keyId);
            const iv = crypto_1.default.randomBytes(this.ivSize);
            const cipher = crypto_1.default.createCipher(this.algorithm, key.key);
            cipher.setAAD(Buffer.from(keyId || 'default'));
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const tag = cipher.getAuthTag();
            return {
                algorithm: this.algorithm,
                keyId: key.id,
                encryptedData: encrypted,
                iv: iv.toString('hex'),
                tag: tag.toString('hex'),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to encrypt data:', error);
            throw new Error('Encryption failed');
        }
    }
    /**
     * Decrypt sensitive data
     */
    async decryptData(encryptedData) {
        try {
            const key = await this.getEncryptionKey(encryptedData.keyId);
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const tag = Buffer.from(encryptedData.tag || '', 'hex');
            const decipher = crypto_1.default.createDecipher(encryptedData.algorithm, key.key);
            decipher.setAAD(Buffer.from(encryptedData.keyId));
            decipher.setAuthTag(tag);
            let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }
        catch (error) {
            logger_1.logger.error('Failed to decrypt data:', error);
            throw new Error('Decryption failed');
        }
    }
    /**
     * Encrypt call recording data
     */
    async encryptCallRecording(audioData, callId) {
        try {
            const key = await this.getEncryptionKey('call-recordings');
            const iv = crypto_1.default.randomBytes(this.ivSize);
            const cipher = crypto_1.default.createCipher(this.algorithm, key.key);
            cipher.setAAD(Buffer.from(callId));
            const encrypted = Buffer.concat([
                cipher.update(audioData),
                cipher.final()
            ]);
            const tag = cipher.getAuthTag();
            return {
                algorithm: this.algorithm,
                keyId: key.id,
                encryptedData: encrypted.toString('base64'),
                iv: iv.toString('hex'),
                tag: tag.toString('hex'),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to encrypt call recording:', error);
            throw new Error('Call recording encryption failed');
        }
    }
    /**
     * Decrypt call recording data
     */
    async decryptCallRecording(encryptedData, callId) {
        try {
            const key = await this.getEncryptionKey(encryptedData.keyId);
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const tag = Buffer.from(encryptedData.tag || '', 'hex');
            const encrypted = Buffer.from(encryptedData.encryptedData, 'base64');
            const decipher = crypto_1.default.createDecipher(encryptedData.algorithm, key.key);
            decipher.setAAD(Buffer.from(callId));
            decipher.setAuthTag(tag);
            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final()
            ]);
            return decrypted;
        }
        catch (error) {
            logger_1.logger.error('Failed to decrypt call recording:', error);
            throw new Error('Call recording decryption failed');
        }
    }
    /**
     * Hash sensitive data (one-way)
     */
    hashData(data, salt) {
        const actualSalt = salt || config_1.config.security.defaultSalt;
        return crypto_1.default.createHash('sha256').update(data + actualSalt).digest('hex');
    }
    /**
     * Generate secure random token
     */
    generateSecureToken(length = 32) {
        return crypto_1.default.randomBytes(length).toString('hex');
    }
    /**
     * Generate encryption key
     */
    async generateEncryptionKey(alias, purpose, organizationId) {
        try {
            const key = crypto_1.default.randomBytes(this.keySize);
            const encryptionKey = {
                id: crypto_1.default.randomUUID(),
                alias,
                algorithm: this.algorithm,
                keySize: this.keySize * 8, // Convert to bits
                purpose,
                isActive: true,
                organizationId,
                createdAt: new Date(),
            };
            // Store key securely (in a real implementation, this would use a key management service)
            await this.storeEncryptionKey(encryptionKey, key);
            logger_1.logger.info(`Generated encryption key: ${encryptionKey.id} for ${purpose}`);
            return encryptionKey;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate encryption key:', error);
            throw new Error('Key generation failed');
        }
    }
    /**
     * Rotate encryption key
     */
    async rotateEncryptionKey(keyId) {
        try {
            const oldKey = await this.getEncryptionKey(keyId);
            if (!oldKey) {
                throw new Error('Key not found');
            }
            // Generate new key
            const newKey = await this.generateEncryptionKey(oldKey.alias, oldKey.purpose, oldKey.organizationId);
            // Mark old key as rotated
            await this.markKeyAsRotated(keyId);
            logger_1.logger.info(`Rotated encryption key: ${keyId} -> ${newKey.id}`);
            return newKey;
        }
        catch (error) {
            logger_1.logger.error('Failed to rotate encryption key:', error);
            throw error;
        }
    }
    /**
     * Encrypt database field
     */
    async encryptField(value, fieldName) {
        if (!value)
            return value;
        try {
            const encrypted = await this.encryptData(value, 'database-fields');
            return JSON.stringify(encrypted);
        }
        catch (error) {
            logger_1.logger.error(`Failed to encrypt field ${fieldName}:`, error);
            throw error;
        }
    }
    /**
     * Decrypt database field
     */
    async decryptField(encryptedValue, fieldName) {
        if (!encryptedValue)
            return encryptedValue;
        try {
            const encryptedData = JSON.parse(encryptedValue);
            return await this.decryptData(encryptedData);
        }
        catch (error) {
            logger_1.logger.error(`Failed to decrypt field ${fieldName}:`, error);
            // Return original value if decryption fails (for backward compatibility)
            return encryptedValue;
        }
    }
    /**
     * Encrypt communication data (messages, call metadata)
     */
    async encryptCommunicationData(data, communicationId) {
        try {
            const jsonData = JSON.stringify(data);
            const key = await this.getEncryptionKey('communications');
            const iv = crypto_1.default.randomBytes(this.ivSize);
            const cipher = crypto_1.default.createCipher(this.algorithm, key.key);
            cipher.setAAD(Buffer.from(communicationId));
            let encrypted = cipher.update(jsonData, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            const tag = cipher.getAuthTag();
            return {
                algorithm: this.algorithm,
                keyId: key.id,
                encryptedData: encrypted,
                iv: iv.toString('hex'),
                tag: tag.toString('hex'),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to encrypt communication data:', error);
            throw new Error('Communication encryption failed');
        }
    }
    /**
     * Decrypt communication data
     */
    async decryptCommunicationData(encryptedData, communicationId) {
        try {
            const key = await this.getEncryptionKey(encryptedData.keyId);
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const tag = Buffer.from(encryptedData.tag || '', 'hex');
            const decipher = crypto_1.default.createDecipher(encryptedData.algorithm, key.key);
            decipher.setAAD(Buffer.from(communicationId));
            decipher.setAuthTag(tag);
            let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return JSON.parse(decrypted);
        }
        catch (error) {
            logger_1.logger.error('Failed to decrypt communication data:', error);
            throw new Error('Communication decryption failed');
        }
    }
    // Mock key management operations (replace with actual key management service)
    async getEncryptionKey(keyId) {
        // In a real implementation, this would retrieve keys from a secure key management service
        const defaultKey = Buffer.from(config_1.config.security.encryptionKey || 'default-key-32-bytes-long-string', 'utf8');
        return {
            id: keyId || 'default',
            key: defaultKey,
        };
    }
    async storeEncryptionKey(encryptionKey, key) {
        // This would store the key in a secure key management service
        logger_1.logger.debug(`Storing encryption key: ${encryptionKey.id}`);
    }
    async markKeyAsRotated(keyId) {
        // This would mark the key as rotated in the key management service
        logger_1.logger.debug(`Marking key as rotated: ${keyId}`);
    }
}
exports.EncryptionService = EncryptionService;
