import { packageListQuerySchema } from '@umrah/shared';
import { buildPackageOrderBy, buildPackageWhere } from './package-filters';
import { isBookable } from './catalog.mappers';

const today = new Date('2026-10-13T00:00:00.000Z');
const parse = (q: Record<string, string>) => packageListQuerySchema.parse(q);

describe('buildPackageWhere', () => {
  it('always restricts to published, non-deleted packages', () => {
    const where = buildPackageWhere(parse({}), today);
    expect(where).toMatchObject({ status: 'PUBLISHED', deletedAt: null, AND: [] });
  });

  it('maps every filter', () => {
    const where = buildPackageWhere(
      parse({ city: 'Karachi', category: 'premium-umrah', tier: 'PREMIUM,VIP', minDays: '10', maxDays: '15', minPrice: '300000', maxPrice: '600000', stars: '4,5', services: 'visa,flight', q: 'ramadan' }),
      today,
    );
    const and = JSON.stringify(where.AND);
    expect(and).toContain('"departureCities":{"has":"Karachi"}');
    expect(and).toContain('"category":{"slug":"premium-umrah"}');
    expect(and).toContain('"tier":{"in":["PREMIUM","VIP"]}');
    expect(and).toContain('"durationDays":{"gte":10}');
    expect(and).toContain('"durationDays":{"lte":15}');
    expect(and).toContain('"startingPrice":{"gte":300000}');
    expect(and).toContain('"startingPrice":{"lte":600000}');
    expect(and).toContain('"starRating":{"in":[4,5]}');
    expect(and).toContain('"visaIncluded":true');
    expect(and).toContain('"flightIncluded":true');
    expect(and).toContain('"insensitive"');
  });

  it('date filters only match open departures that are still bookable', () => {
    const where = buildPackageWhere(parse({ from: '2027-02-01', to: '2027-02-28' }), today);
    const dep = (where.AND as { departures: { some: Record<string, unknown> } }[])[0]!.departures.some;
    expect(dep.status).toBe('OPEN');
    expect(dep.departureDate).toEqual({ gte: new Date('2027-02-01T00:00:00.000Z'), lte: new Date('2027-02-28T00:00:00.000Z') });
    expect(JSON.stringify(dep.OR)).toContain('bookingCutoffDate');
  });

  it('defaults the lower date bound to today so past departures never match', () => {
    const where = buildPackageWhere(parse({ to: '2027-03-01' }), today);
    const dep = (where.AND as { departures: { some: { departureDate: { gte: Date } } } }[])[0]!.departures.some;
    expect(dep.departureDate.gte).toEqual(today);
  });
});

describe('buildPackageOrderBy', () => {
  it('sorts nulls last for price', () => {
    expect(buildPackageOrderBy('price_asc')[0]).toEqual({ startingPrice: { sort: 'asc', nulls: 'last' } });
  });
  it('defaults to featured first', () => {
    expect(buildPackageOrderBy('featured')[0]).toEqual({ isFeatured: 'desc' });
  });
});

describe('package list query schema', () => {
  it('coerces numbers and applies defaults', () => {
    const q = parse({ minDays: '10', page: '2' });
    expect(q).toMatchObject({ minDays: 10, page: 2, pageSize: 12, sort: 'featured' });
  });
  it('rejects unknown sort values and oversized pages', () => {
    expect(packageListQuerySchema.safeParse({ sort: 'cheapest' }).success).toBe(false);
    expect(packageListQuerySchema.safeParse({ pageSize: '500' }).success).toBe(false);
    expect(packageListQuerySchema.safeParse({ services: 'visa,teleport' }).success).toBe(false);
  });
  it('treats empty strings as absent (URL forms submit blanks)', () => {
    expect(packageListQuerySchema.parse({ city: '', minPrice: '' })).toMatchObject({ page: 1 });
  });
});

describe('isBookable', () => {
  const base = { status: 'OPEN', seatsTotal: 40, seatsReserved: 10, bookingCutoffDate: new Date('2026-12-01T00:00:00.000Z'), departureDate: new Date('2026-12-15T00:00:00.000Z') };
  it('is true for an open departure with seats before cut-off', () => expect(isBookable(base, today)).toBe(true));
  it('is false when sold out, closed, past cut-off or departed', () => {
    expect(isBookable({ ...base, seatsReserved: 40 }, today)).toBe(false);
    expect(isBookable({ ...base, status: 'CLOSED' }, today)).toBe(false);
    expect(isBookable({ ...base, bookingCutoffDate: new Date('2026-10-01T00:00:00.000Z') }, today)).toBe(false);
    expect(isBookable({ ...base, departureDate: new Date('2026-10-01T00:00:00.000Z') }, today)).toBe(false);
  });
  it('treats a missing cut-off as open-ended', () => expect(isBookable({ ...base, bookingCutoffDate: null }, today)).toBe(true));
});
