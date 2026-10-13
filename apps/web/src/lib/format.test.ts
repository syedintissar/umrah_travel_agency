import { formatDate, formatDateRange, formatDistance, formatMoney, humanize, initials, pluralize } from './format';

describe('format', () => {
  it('formats money from Decimal strings and handles missing values', () => {
    expect(formatMoney('485000', 'PKR')).toMatch(/485,000/);
    expect(formatMoney(1250.5, 'PKR')).toMatch(/1,250\.50/);
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney('abc')).toBe('—');
  });

  it('formats date-only values without shifting the day', () => {
    expect(formatDate('2027-02-14')).toBe('14 Feb 2027');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDateRange('2027-02-14', '2027-02-28')).toBe('14 Feb – 28 Feb 2027');
  });

  it('pluralises, humanises and builds initials', () => {
    expect(pluralize(1, 'day')).toBe('1 day');
    expect(pluralize(14, 'day')).toBe('14 days');
    expect(humanize('PENDING_PAYMENT')).toBe('Pending payment');
    expect(initials('Muhammad Ali Khan')).toBe('MA');
    expect(initials('')).toBe('?');
  });

  it('formats distance from the Haram', () => {
    expect(formatDistance(150)).toBe('150 m');
    expect(formatDistance(1500)).toBe('1.5 km');
    expect(formatDistance(null)).toBeNull();
  });
});
