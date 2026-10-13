/** Minimum time (ms) a human needs to fill a form. Faster submissions are treated as bots. */
export const MIN_FILL_MS = 800;

export type SpamReason = 'honeypot' | 'too_fast' | null;

/**
 * Cheap, privacy-friendly bot filter: a hidden honeypot field plus a minimum fill time.
 * Rate limiting (per IP) and de-duplication are enforced separately.
 */
export function detectSpam(input: { website?: string; formStartedAt?: number }, now = Date.now()): SpamReason {
  if (input.website && input.website.length > 0) return 'honeypot';
  if (input.formStartedAt !== undefined && now - input.formStartedAt < MIN_FILL_MS) return 'too_fast';
  return null;
}

/** Digits only, for matching the same phone number written differently. */
export const phoneDigits = (value: string | undefined): string | undefined => {
  const d = value?.replace(/\D/g, '');
  return d ? d : undefined;
};
