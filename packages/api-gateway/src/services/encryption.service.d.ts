import { DataEncryption, EncryptionKey } from '../../../shared/src/types/security';
export declare class EncryptionService {
    private readonly algorithm;
    private readonly keySize;
    private readonly ivSize;
    private readonly tagSize;
    /**
     * Encrypt sensitive data
     */
    encryptData(data: string, keyId?: string): Promise<DataEncryption>;
    /**
     * Decrypt sensitive data
     */
    decryptData(encryptedData: DataEncryption): Promise<string>;
    /**
     * Encrypt call recording data
     */
    encryptCallRecording(audioData: Buffer, callId: string): Promise<DataEncryption>;
    /**
     * Decrypt call recording data
     */
    decryptCallRecording(encryptedData: DataEncryption, callId: string): Promise<Buffer>;
    /**
     * Hash sensitive data (one-way)
     */
    hashData(data: string, salt?: string): string;
    /**
     * Generate secure random token
     */
    generateSecureToken(length?: number): string;
    /**
     * Generate encryption key
     */
    generateEncryptionKey(alias: string, purpose: 'data_encryption' | 'communication_encryption' | 'backup_encryption', organizationId: string): Promise<EncryptionKey>;
    /**
     * Rotate encryption key
     */
    rotateEncryptionKey(keyId: string): Promise<EncryptionKey>;
    /**
     * Encrypt database field
     */
    encryptField(value: string, fieldName: string): Promise<string>;
    /**
     * Decrypt database field
     */
    decryptField(encryptedValue: string, fieldName: string): Promise<string>;
    /**
     * Encrypt communication data (messages, call metadata)
     */
    encryptCommunicationData(data: any, communicationId: string): Promise<DataEncryption>;
    /**
     * Decrypt communication data
     */
    decryptCommunicationData(encryptedData: DataEncryption, communicationId: string): Promise<any>;
    private getEncryptionKey;
    private storeEncryptionKey;
    private markKeyAsRotated;
}
