/**
 * Single source of truth for staff roles and permissions.
 * Seeded into the database; the API guards and the admin UI both read from here.
 * Permission key format: `<module>:<action>`.
 */

export const ROLE_KEYS = [
  'SUPER_ADMIN',
  'SALES_AGENT',
  'BOOKING_MANAGER',
  'VISA_OFFICER',
  'FINANCE_OFFICER',
  'CONTENT_MANAGER',
] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

const CRUD = ['read', 'create', 'update', 'delete'] as const;

export const PERMISSION_MODULES = {
  dashboard: ['read'],
  packages: [...CRUD, 'publish'],
  departures: CRUD,
  hotels: CRUD,
  transport: CRUD,
  ziyarat: CRUD,
  bookings: [...CRUD, 'cancel', 'assign'],
  customers: [...CRUD, 'export'],
  travelers: CRUD,
  payments: ['read', 'create', 'verify', 'update'],
  refunds: ['read', 'create', 'approve'],
  invoices: ['read', 'create', 'update', 'void'],
  visas: ['read', 'create', 'update', 'assign'],
  documents: ['read', 'create', 'review', 'download', 'delete'],
  leads: [...CRUD, 'assign'],
  quotations: [...CRUD, 'send'],
  followups: CRUD,
  support: ['read', 'update', 'assign'],
  reviews: ['read', 'moderate', 'delete'],
  cms: [...CRUD, 'publish'],
  media: ['read', 'create', 'delete'],
  notifications: ['read', 'send', 'manage_templates'],
  automation: ['read', 'update'],
  reports: ['read', 'export'],
  staff: [...CRUD],
  roles: ['read', 'update'],
  settings: ['read', 'update'],
  audit: ['read'],
} as const satisfies Record<string, readonly string[]>;

export type PermissionModule = keyof typeof PERMISSION_MODULES;
export type PermissionKey = {
  [M in PermissionModule]: `${M}:${(typeof PERMISSION_MODULES)[M][number]}`;
}[PermissionModule];

export const ALL_PERMISSIONS: PermissionKey[] = (
  Object.entries(PERMISSION_MODULES) as [PermissionModule, readonly string[]][]
).flatMap(([module, actions]) => actions.map((a) => `${module}:${a}` as PermissionKey));

const all = (module: PermissionModule): PermissionKey[] =>
  ALL_PERMISSIONS.filter((p) => p.startsWith(`${module}:`));

export const ROLE_DEFINITIONS: Record<
  RoleKey,
  { name: string; description: string; permissions: PermissionKey[] }
> = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full access to every module, staff, roles and settings.',
    permissions: ALL_PERMISSIONS,
  },
  SALES_AGENT: {
    name: 'Sales Agent',
    description: 'Leads, customers, quotations and follow-ups. Read-only view of bookings and catalog.',
    permissions: [
      'dashboard:read',
      'packages:read',
      'departures:read',
      'hotels:read',
      'transport:read',
      'ziyarat:read',
      'customers:read',
      'customers:create',
      'customers:update',
      'travelers:read',
      'bookings:read',
      ...all('leads'),
      ...all('quotations'),
      ...all('followups'),
      'support:read',
      'reviews:read',
    ],
  },
  BOOKING_MANAGER: {
    name: 'Booking Manager',
    description: 'Owns bookings, departures, inventory, rooming and travel preparation.',
    permissions: [
      'dashboard:read',
      'packages:read',
      'packages:update',
      ...all('departures'),
      'hotels:read',
      ...all('transport'),
      'ziyarat:read',
      ...all('bookings'),
      'customers:read',
      'customers:create',
      'customers:update',
      ...all('travelers'),
      'payments:read',
      'invoices:read',
      'documents:read',
      'documents:create',
      'documents:review',
      'documents:download',
      'visas:read',
      'leads:read',
      'quotations:read',
      ...all('followups'),
      'reviews:read',
      'support:read',
      'support:update',
      'support:assign',
      'notifications:read',
      'notifications:send',
      'reports:read',
    ],
  },
  VISA_OFFICER: {
    name: 'Visa Officer',
    description: 'Reviews traveler documents and manages visa applications.',
    permissions: [
      'dashboard:read',
      'bookings:read',
      'customers:read',
      'travelers:read',
      'travelers:update',
      ...all('visas'),
      'documents:read',
      'documents:create',
      'documents:review',
      'documents:download',
      'followups:read',
      'followups:create',
      'followups:update',
      'notifications:read',
      'notifications:send',
    ],
  },
  FINANCE_OFFICER: {
    name: 'Finance Officer',
    description: 'Payments, verification, refunds, invoices and financial reports.',
    permissions: [
      'dashboard:read',
      'bookings:read',
      'customers:read',
      ...all('payments'),
      ...all('refunds'),
      ...all('invoices'),
      'documents:read',
      'documents:download',
      'notifications:read',
      'notifications:send',
      ...all('reports'),
    ],
  },
  CONTENT_MANAGER: {
    name: 'Content Manager',
    description: 'Website content, blog, guides, FAQs, media, package listings and reviews.',
    permissions: [
      'dashboard:read',
      'packages:read',
      'packages:create',
      'packages:update',
      'packages:publish',
      'departures:read',
      ...all('hotels'),
      'transport:read',
      ...all('ziyarat'),
      ...all('cms'),
      ...all('media'),
      'reviews:read',
      'reviews:moderate',
    ],
  },
};
