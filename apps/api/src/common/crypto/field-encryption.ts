import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const VERSION = 'v1';

/**
 * AES-256-GCM encryption for sensitive identifiers (passport, CNIC, TOTP secrets).
 * Output format: `v1:<iv b64>:<tag b64>:<ciphertext b64>` (versioned for key rotation).
 */
export class FieldEncryption {
  private readonly key: Buffer;

  constructor(
    base64Key: string,
    private readonly hashKey: string,
  ) {
    this.key = Buffer.from(base64Key, 'base64');
    if (this.key.length !== 32) throw new Error('FIELD_ENCRYPTION_KEY must be 32 bytes');
    if (hashKey.length < 32) throw new Error('FIELD_HASH_KEY must be at least 32 chars');
  }

  encrypt(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGO, this.key, iv);
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [VERSION, iv.toString('base64'), tag.toString('base64'), data.toString('base64')].join(
      ':',
    );
  }

  decrypt(payload: string): string {
    const [version, iv, tag, data] = payload.split(':');
    if (version !== VERSION || !iv || !tag || !data) throw new Error('Unsupported ciphertext');
    const decipher = createDecipheriv(ALGO, this.key, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(data, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  /** Deterministic keyed hash for equality lookups (normalised: upper-case, no spaces/dashes). */
  hash(value: string): string {
    const normalised = value.replace(/[\s-]/g, '').toUpperCase();
    return createHmac('sha256', this.hashKey).update(normalised).digest('hex');
  }

  /** Display-safe mask, e.g. `*****4321`. */
  static mask(value: string, visible = 4): string {
    return value.length <= visible
      ? '*'.repeat(value.length)
      : '*'.repeat(value.length - visible) + value.slice(-visible);
  }
}
