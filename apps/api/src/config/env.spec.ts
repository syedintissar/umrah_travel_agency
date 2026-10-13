import { randomBytes } from 'node:crypto';
import { loadEnv } from './env';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  FIELD_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
  FIELD_HASH_KEY: 'c'.repeat(32),
};

describe('loadEnv', () => {
  it('applies defaults and parses CORS list', () => {
    const env = loadEnv({ ...valid, CORS_ORIGINS: 'http://a.com, http://b.com' });
    expect(env.API_PORT).toBe(4000);
    expect(env.CORS_ORIGINS).toEqual(['http://a.com', 'http://b.com']);
    expect(env.RESEND_API_KEY).toBeUndefined();
  });

  it('fails fast on weak secrets and bad keys', () => {
    expect(() => loadEnv({ ...valid, JWT_ACCESS_SECRET: 'short' })).toThrow(/JWT_ACCESS_SECRET/);
    expect(() => loadEnv({ ...valid, FIELD_ENCRYPTION_KEY: 'abc' })).toThrow(
      /FIELD_ENCRYPTION_KEY/,
    );
    expect(() => loadEnv({ ...valid, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });
});
