import path from 'node:path';
import { config as loadDotenv } from 'dotenv';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';
import { ENV } from '../src/config/config.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ROLE_KEYS, ALL_PERMISSIONS, LEAD_STAGES, PAYMENT_STATUSES } from '@umrah/shared';

loadDotenv({ path: path.resolve(__dirname, '../../../.env'), quiet: true });

// Requires a migrated + seeded database (DATABASE_URL).
describe('Foundation (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app, app.get(ENV));
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /api/v1/health reports database up', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('seed created all roles and permissions with Super Admin holding all', async () => {
    expect(await prisma.role.count()).toBe(ROLE_KEYS.length);
    expect(await prisma.permission.count()).toBe(ALL_PERMISSIONS.length);
    const superAdmin = await prisma.role.findUniqueOrThrow({
      where: { key: 'SUPER_ADMIN' },
      include: { _count: { select: { permissions: true } } },
    });
    expect(superAdmin._count.permissions).toBe(ALL_PERMISSIONS.length);
  });

  it('enforces DB check constraints', async () => {
    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "Hotel"(id, slug, name, city, "starRating", amenities, "updatedAt")
         VALUES (gen_random_uuid(), 'bad-hotel', 'Bad', 'MAKKAH', 9, '{}', now())`,
      ),
    ).rejects.toThrow();
  });

  it('matches proposal enums, constraints and seeded templates', async () => {
    const stages = await prisma.$queryRaw<{ v: string }[]>`
      SELECT unnest(enum_range(NULL::"LeadStage"))::text AS v`;
    expect(stages.map((s) => s.v)).toEqual([...LEAD_STAGES]);
    const pay = await prisma.$queryRaw<{ v: string }[]>`
      SELECT unnest(enum_range(NULL::"PaymentStatus"))::text AS v`;
    expect(pay.map((s) => s.v).sort()).toEqual([...PAYMENT_STATUSES].sort());

    const wa = await prisma.notificationTemplate.findMany({ where: { channel: 'WHATSAPP' } });
    expect(wa.length).toBeGreaterThan(0);
    expect(wa.every((t) => !t.isActive)).toBe(true); // inactive until Meta approves templates

    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "HotelRoomRate"(id, "roomTypeId", "validFrom", "validTo", "pricePerNight")
         VALUES (gen_random_uuid(), gen_random_uuid(), '2026-02-01', '2026-01-01', 10)`,
      ),
    ).rejects.toThrow();
  });

  it('audit log is append-only', async () => {
    const log = await prisma.auditLog.create({
      data: { actorType: 'SYSTEM', action: 'test.append_only', entityType: 'Test' },
    });
    await expect(
      prisma.auditLog.update({ where: { id: log.id }, data: { action: 'tampered' } }),
    ).rejects.toThrow(/append-only/);
    await expect(prisma.auditLog.delete({ where: { id: log.id } })).rejects.toThrow(/append-only/);
  });
});
