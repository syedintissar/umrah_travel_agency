import { randomBytes } from 'node:crypto';
import { FieldEncryption } from './field-encryption';

describe('FieldEncryption', () => {
  const fe = new FieldEncryption(randomBytes(32).toString('base64'), 'h'.repeat(32));

  it('round-trips and uses a random IV', () => {
    const a = fe.encrypt('AB1234567');
    const b = fe.encrypt('AB1234567');
    expect(a).not.toEqual(b);
    expect(fe.decrypt(a)).toBe('AB1234567');
  });

  it('rejects tampered ciphertext', () => {
    const parts = fe.encrypt('35202-1234567-1').split(':');
    parts[3] = Buffer.from('tampered').toString('base64');
    expect(() => fe.decrypt(parts.join(':'))).toThrow();
  });

  it('hashes deterministically after normalisation', () => {
    expect(fe.hash('35202-1234567-1')).toBe(fe.hash('3520212345671'));
    expect(fe.hash('ab 123')).toBe(fe.hash('AB123'));
  });

  it('rejects invalid keys and masks values', () => {
    expect(() => new FieldEncryption('short', 'h'.repeat(32))).toThrow();
    expect(FieldEncryption.mask('AB1234567')).toBe('*****4567');
  });
});
