import type { INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import type { Env } from './config/env';

/** Shared HTTP setup for main.ts and e2e tests. */
export function configureApp(app: INestApplication, env: Env): void {
  // Correct client IPs behind a load balancer (rate limiting, abuse logging).
  app.getHttpAdapter().getInstance().set('trust proxy', env.TRUST_PROXY);
  app.use(helmet());
  app.enableCors({ origin: env.CORS_ORIGINS, credentials: true });
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
}
