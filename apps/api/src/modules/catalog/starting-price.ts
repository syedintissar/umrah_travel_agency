import type { Prisma, PrismaClient } from '../../generated/prisma/client';

type Db = Pick<PrismaClient, 'packageDeparture' | 'package'>;

/**
 * Recomputes the denormalised `Package.startingPrice` (lowest adult price across upcoming, open departures).
 * Call whenever departures or their prices change (admin edits, seeds, imports).
 */
export async function refreshStartingPrice(db: Db, packageId: string, now = new Date()): Promise<Prisma.Decimal | null> {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const departures = await db.packageDeparture.findMany({
    where: { packageId, status: 'OPEN', departureDate: { gte: today } },
    select: { prices: { select: { adultPrice: true } } },
  });
  const min = departures
    .flatMap((d) => d.prices.map((p) => p.adultPrice))
    .reduce<Prisma.Decimal | null>((m, v) => (m === null || v.lt(m) ? v : m), null);
  await db.package.update({ where: { id: packageId }, data: { startingPrice: min } });
  return min;
}
