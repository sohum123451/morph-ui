import crypto from 'crypto';

const MASTER_SECRET = process.env.STEALTH_SECRET || 'morphui-stealth-master-key-2026-production';

// Derive a 32-byte key using SHA-256
function getEncryptionKey(): Buffer {
  return crypto.createHash('sha256').update(MASTER_SECRET).digest();
}

export interface EncryptedPayloadResult {
  encryptedPayload: string; // Hex ciphertext with authTag appended
  iv: string;              // Hex 16-byte IV
  authTag?: string;        // Hex 16-byte Auth Tag
}

/**
 * Encrypt arbitrary JSON data or string using AES-256-GCM.
 */
export function encryptData(data: any): EncryptedPayloadResult {
  const textToEncrypt = typeof data === 'string' ? data : JSON.stringify(data);
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  const combinedPayload = `${encrypted}:${authTag}`;

  return {
    encryptedPayload: combinedPayload,
    iv: iv.toString('hex'),
    authTag,
  };
}

/**
 * Decrypt an AES-256-GCM encrypted payload back to original JSON object or string.
 */
export function decryptData(encryptedPayload: string, ivHex: string, authTagHex?: string): any {
  try {
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');

    let cipherText = encryptedPayload;
    let tag = authTagHex;

    if (encryptedPayload.includes(':')) {
      const parts = encryptedPayload.split(':');
      cipherText = parts[0];
      tag = tag || parts[1];
    }

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    if (tag) {
      decipher.setAuthTag(Buffer.from(tag, 'hex'));
    }

    let decrypted = decipher.update(cipherText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (err) {
    console.error('Decryption error in AES-GCM:', err);
    throw new Error('Failed to decrypt data payload');
  }
}
