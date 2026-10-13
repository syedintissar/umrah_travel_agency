import 'reflect-metadata';
import path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import { ENV } from './config/config.module';
import type { Env } from './config/env';

loadDotenv({ path: path.resolve(__dirname, '../../../.env'), quiet: true });

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const env = app.get<Env>(ENV);
  configureApp(app, env);
  await app.listen(env.API_PORT);
  // Node closes idle keep-alive sockets after 5s, which races with clients/proxies that reuse them (ECONNRESET).
  // Keep them open longer than a typical load-balancer idle timeout (60s).
  const server = app.getHttpServer() as import('node:http').Server;
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
}

void bootstrap();
