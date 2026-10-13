import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Tx = Pick<PrismaService, '$queryRaw'>;

/** Gap-free yearly human-readable references (ENQ-2026-000045), allocated atomically in Postgres. */
@Injectable()
export class ReferenceService {
  constructor(private readonly prisma: PrismaService) {}

  async next(prefix: string, db: Tx = this.prisma, now = new Date()): Promise<string> {
    const year = now.getUTCFullYear();
    const key = `${prefix.toLowerCase()}:${year}`;
    const rows = await db.$queryRaw<{ value: number }[]>`
      INSERT INTO "Sequence" ("key", "value") VALUES (${key}, 1)
      ON CONFLICT ("key") DO UPDATE SET "value" = "Sequence"."value" + 1
      RETURNING "value"`;
    const value = rows[0]?.value;
    if (value === undefined) throw new Error('Could not allocate reference');
    return `${prefix.toUpperCase()}-${year}-${String(value).padStart(6, '0')}`;
  }
}
