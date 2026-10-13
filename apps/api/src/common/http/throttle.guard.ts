import { timingSafeEqual } from 'node:crypto';
import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ENV } from '../../config/config.module';
import type { Env } from '../../config/env';

/**
 * Per-IP rate limiting. Requests from our own Next.js server (SSR) carry a shared secret and are exempt,
 * because every server-rendered page would otherwise appear to come from one IP.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  @Inject(ENV) private readonly env!: Env;

  protected override async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const key = this.env.INTERNAL_API_KEY;
    if (!key) return false;
    const req = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const provided = req.headers['x-internal-key'];
    if (typeof provided !== 'string') return false;
    const a = Buffer.from(provided);
    const b = Buffer.from(key);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
