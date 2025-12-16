import crypto from 'crypto';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import { DataEncryption, EncryptionKey } from '@voxlink/shared';

type InternalEncryptionKey = EncryptionKey & {
  key: Buffer;
  alias: string;
  purpose: 'data_encryption' | 'communication_encryption' | 'backup_encryption';
  organizationId: string;
};

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keySize = 32; // 256 bits
  private readonly ivSize = 16; // 128 bits
  private readonly tagSize = 16; // 128 bits

  /**
   * Encrypt sensitive data
   */
  async encryptData(data: string, keyId?: string): Promise<DataEncryption> {
    try {
      const key = await this.getEncryptionKey(keyId);
      const iv = crypto.randomBytes(this.ivSize);

      const cipher = crypto.createCipheriv(this.algorithm, key.key, iv);
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
    } catch (error) {
      logger.error('Failed to encrypt data:', { error } as any);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(encryptedData: DataEncryption): Promise<string> {
    try {
      const key = await this.getEncryptionKey(encryptedData.keyId);
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag || '', 'hex');

      const decipher = crypto.createDecipheriv(encryptedData.algorithm, key.key, iv) as crypto.DecipherGCM;
      decipher.setAAD(Buffer.from(encryptedData.keyId));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Failed to decrypt data:', { error } as any);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt call recording data
   */
  async encryptCallRecording(audioData: Buffer, callId: string): Promise<DataEncryption> {
    try {
      const key = await this.getEncryptionKey('call-recordings');
      const iv = crypto.randomBytes(this.ivSize);

      const cipher = crypto.createCipher(this.algorithm, key.key);
      (cipher as any).setAAD(Buffer.from(callId));

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
    } catch (error) {
      logger.error('Failed to encrypt call recording:', { error } as any);
      throw new Error('Call recording encryption failed');
    }
  }

  /**
   * Decrypt call recording data
   */
  async decryptCallRecording(encryptedData: DataEncryption, callId: string): Promise<Buffer> {
    try {
      const key = await this.getEncryptionKey(encryptedData.keyId);
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag || '', 'hex');
      const encrypted = Buffer.from(encryptedData.encryptedData, 'base64');

      const decipher = crypto.createDecipheriv(encryptedData.algorithm, key.key, iv) as crypto.DecipherGCM;
      decipher.setAAD(Buffer.from(callId));
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      return decrypted;
    } catch (error) {
      logger.error('Failed to decrypt call recording:', { error } as any);
      throw new Error('Call recording decryption failed');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  hashData(data: string, salt?: string): string {
    const actualSalt = salt || config.security.defaultSalt;
    return crypto.createHash('sha256').update(data + actualSalt).digest('hex');
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate encryption key
   */
  async generateEncryptionKey(
    alias: string,
    purpose: 'data_encryption' | 'communication_encryption' | 'backup_encryption',
    organizationId: string
  ): Promise<EncryptionKey> {
    try {
      const key = crypto.randomBytes(this.keySize);

      const encryptionKey: EncryptionKey = {
        id: crypto.randomUUID(),
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

      logger.info(`Generated encryption key: ${encryptionKey.id} for ${purpose}`);
      return encryptionKey;
    } catch (error) {
      logger.error('Failed to generate encryption key:', { error } as any);
      throw new Error('Key generation failed');
    }
  }

  /**
   * Rotate encryption key
   */
  async rotateEncryptionKey(keyId: string): Promise<EncryptionKey> {
    try {
      const oldKey = await this.getEncryptionKey(keyId);
      if (!oldKey) {
        throw new Error('Key not found');
      }

      // Generate new key
      const newKey = await this.generateEncryptionKey(
        oldKey.alias,
        oldKey.purpose,
        oldKey.organizationId
      );

      // Mark old key as rotated
      await this.markKeyAsRotated(keyId);

      logger.info(`Rotated encryption key: ${keyId} -> ${newKey.id}`);
      return newKey;
    } catch (error) {
      logger.error('Failed to rotate encryption key:', { error } as any);
      throw error;
    }
  }

  /**
   * Encrypt database field
   */
  async encryptField(value: string, fieldName: string): Promise<string> {
    if (!value) return value;

    try {
      const encrypted = await this.encryptData(value, 'database-fields');
      return JSON.stringify(encrypted);
    } catch (error) {
      logger.error(`Failed to encrypt field ${fieldName}:`, { error } as any);
      throw error;
    }
  }

  /**
   * Decrypt database field
   */
  async decryptField(encryptedValue: string, fieldName: string): Promise<string> {
    if (!encryptedValue) return encryptedValue;

    try {
      const encryptedData = JSON.parse(encryptedValue) as DataEncryption;
      return await this.decryptData(encryptedData);
    } catch (error) {
      logger.error(`Failed to decrypt field ${fieldName}:`, { error } as any);
      // Return original value if decryption fails (for backward compatibility)
      return encryptedValue;
    }
  }

  /**
   * Encrypt communication data (messages, call metadata)
   */
  async encryptCommunicationData(data: any, communicationId: string): Promise<DataEncryption> {
    try {
      const jsonData = JSON.stringify(data);
      const key = await this.getEncryptionKey('communications');
      const iv = crypto.randomBytes(this.ivSize);

      const cipher = crypto.createCipher(this.algorithm, key.key);
      (cipher as any).setAAD(Buffer.from(communicationId));

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
    } catch (error) {
      logger.error('Failed to encrypt communication data:', { error } as any);
      throw new Error('Communication encryption failed');
    }
  }

  /**
   * Decrypt communication data
   */
  async decryptCommunicationData(encryptedData: DataEncryption, communicationId: string): Promise<any> {
    try {
      const key = await this.getEncryptionKey(encryptedData.keyId);
      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag || '', 'hex');

      const decipher = crypto.createDecipheriv(encryptedData.algorithm, key.key, iv) as crypto.DecipherGCM;
      decipher.setAAD(Buffer.from(communicationId));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Failed to decrypt communication data:', { error } as any);
      throw new Error('Communication decryption failed');
    }
  }

  // Mock key management operations (replace with actual key management service)
  private async getEncryptionKey(keyId?: string): Promise<InternalEncryptionKey> {
    // In a real implementation, this would retrieve keys from a secure key management service
    const defaultKey = Buffer.from(config.security.encryptionKey || 'default-key-32-bytes-long-string', 'utf8');

    return {
      id: keyId || 'default',
      key: defaultKey,
      alias: keyId || 'default',
      purpose: 'data_encryption',
      organizationId: 'default-org',
      algorithm: this.algorithm,
      keySize: this.keySize,
      isActive: true,
      createdAt: new Date(),
    };
  }

  private async storeEncryptionKey(encryptionKey: EncryptionKey, key: Buffer): Promise<void> {
    // This would store the key in a secure key management service
    logger.debug(`Storing encryption key: ${encryptionKey.id}`);
  }

  private async markKeyAsRotated(keyId: string): Promise<void> {
    // This would mark the key as rotated in the key management service
    logger.debug(`Marking key as rotated: ${keyId}`);
  }
}


