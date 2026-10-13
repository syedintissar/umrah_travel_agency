import { ALL_PERMISSIONS, ROLE_DEFINITIONS } from '@umrah/shared';
import { ADMIN_NAV, filterNavByPermissions } from './site';
import { getStatusMeta } from '@/lib/status';

const labelsFor = (role: keyof typeof ROLE_DEFINITIONS) =>
  filterNavByPermissions(ADMIN_NAV, ROLE_DEFINITIONS[role].permissions).flatMap((g) => g.items.map((i) => i.label));

describe('admin navigation vs RBAC', () => {
  it('only references permissions that exist', () => {
    const known = new Set<string>(ALL_PERMISSIONS);
    const used = ADMIN_NAV.flatMap((g) => g.items.map((i) => i.permission)).filter(Boolean) as string[];
    expect(used.filter((p) => !known.has(p))).toEqual([]);
  });

  it('shows every item to Super Admin', () => {
    const total = ADMIN_NAV.reduce((n, g) => n + g.items.length, 0);
    expect(labelsFor('SUPER_ADMIN')).toHaveLength(total);
  });

  it('applies least privilege per role', () => {
    const sales = labelsFor('SALES_AGENT');
    expect(sales).toEqual(expect.arrayContaining(['Leads', 'Quotations', 'Follow-ups', 'Customers']));
    expect(sales).not.toEqual(expect.arrayContaining(['Payments']));
    expect(sales).not.toContain('Settings');
    expect(sales).not.toContain('Staff');

    const finance = labelsFor('FINANCE_OFFICER');
    expect(finance).toEqual(expect.arrayContaining(['Payments', 'Invoices', 'Refunds', 'Reports']));
    expect(finance).not.toContain('Leads');

    const visa = labelsFor('VISA_OFFICER');
    expect(visa).toEqual(expect.arrayContaining(['Documents', 'Visa applications']));
    expect(visa).not.toContain('Payments');

    const content = labelsFor('CONTENT_MANAGER');
    expect(content).toEqual(expect.arrayContaining(['Pages & CMS', 'Blog & guides', 'FAQs', 'Hotels', 'Packages']));
    expect(content).not.toContain('Bookings');
  });

  it('hides empty groups and returns the full nav when permissions are null', () => {
    const groups = filterNavByPermissions(ADMIN_NAV, ['dashboard:read']);
    expect(groups).toHaveLength(1);
    expect(filterNavByPermissions(ADMIN_NAV, null)).toBe(ADMIN_NAV);
  });
});

describe('status metadata', () => {
  it('maps proposal statuses and falls back gracefully for unknown values', () => {
    expect(getStatusMeta('payment', 'SUCCESSFUL')).toEqual({ label: 'Successful', tone: 'success' });
    expect(getStatusMeta('lead', 'FOLLOW_UP').label).toBe('Follow-up');
    expect(getStatusMeta('booking', 'SOMETHING_NEW')).toEqual({ label: 'Something new', tone: 'neutral' });
  });
});
