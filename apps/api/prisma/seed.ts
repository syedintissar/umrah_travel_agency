/**
 * Idempotent reference-data seed: RBAC, first Super Admin, settings, notification templates,
 * automation rules, CMS taxonomy. Safe to re-run. Contains no demo bookings/payments.
 */
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { ALL_PERMISSIONS, ROLE_DEFINITIONS, ROLE_KEYS } from '@umrah/shared';
import { PrismaClient, type NotificationChannel } from '../src/generated/prisma/client';

loadEnv({ path: path.resolve(__dirname, '../../../.env'), quiet: true });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function seedRbac(): Promise<void> {
  for (const key of ALL_PERMISSIONS) {
    const [module, action] = key.split(':') as [string, string];
    await prisma.permission.upsert({
      where: { key },
      update: { module, action },
      create: { key, module, action },
    });
  }
  // Remove permissions no longer defined in code.
  await prisma.permission.deleteMany({ where: { key: { notIn: ALL_PERMISSIONS } } });

  const permissions = await prisma.permission.findMany({ select: { id: true, key: true } });
  const idByKey = new Map(permissions.map((p) => [p.key, p.id]));

  for (const key of ROLE_KEYS) {
    const def = ROLE_DEFINITIONS[key];
    const role = await prisma.role.upsert({
      where: { key },
      update: { name: def.name, description: def.description, isSystem: true },
      create: { key, name: def.name, description: def.description, isSystem: true },
    });
    // System role permissions are code-defined: reset to the canonical set.
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
      prisma.rolePermission.createMany({
        data: [...new Set(def.permissions)].map((p) => ({
          roleId: role.id,
          permissionId: idByKey.get(p)!,
        })),
      }),
    ]);
  }
}

async function seedSuperAdmin(): Promise<void> {
  const email = process.env.SEED_SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_SUPERADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('! SEED_SUPERADMIN_EMAIL/PASSWORD not set — skipping Super Admin creation');
    return;
  }
  if (password.length < 12) throw new Error('SEED_SUPERADMIN_PASSWORD must be >= 12 chars');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return; // never overwrite an existing admin's credentials

  const [firstName = 'Super', ...rest] = (process.env.SEED_SUPERADMIN_NAME ?? 'Super Admin').split(
    ' ',
  );
  const role = await prisma.role.findUniqueOrThrow({ where: { key: 'SUPER_ADMIN' } });
  await prisma.user.create({
    data: {
      email,
      type: 'STAFF',
      status: 'ACTIVE',
      firstName,
      lastName: rest.join(' ') || 'Admin',
      emailVerifiedAt: new Date(),
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      roles: { create: { roleId: role.id } },
    },
  });
  console.log(`✓ Super Admin created: ${email} (enable 2FA on first login)`);
}

const SETTINGS: { key: string; value: unknown; group: string; isPublic?: boolean }[] = [
  { key: 'company.name', value: 'Umrah Travel', group: 'company', isPublic: true },
  { key: 'company.email', value: '', group: 'company', isPublic: true },
  { key: 'company.phone', value: '', group: 'company', isPublic: true },
  { key: 'company.whatsapp', value: '', group: 'company', isPublic: true },
  { key: 'company.address', value: '', group: 'company', isPublic: true },
  { key: 'company.licenseNumber', value: '', group: 'company', isPublic: true },
  { key: 'company.officeHours', value: '', group: 'company', isPublic: true },
  { key: 'company.mapEmbedUrl', value: '', group: 'company', isPublic: true },
  { key: 'company.social', value: {}, group: 'company', isPublic: true },
  { key: 'analytics.gaMeasurementId', value: '', group: 'analytics', isPublic: true },
  { key: 'analytics.searchConsoleVerification', value: '', group: 'analytics', isPublic: true },
  { key: 'locale.defaultCurrency', value: 'PKR', group: 'locale', isPublic: true },
  { key: 'locale.timezone', value: 'Asia/Karachi', group: 'locale', isPublic: true },
  { key: 'booking.seatHoldMinutes', value: 30, group: 'booking' },
  { key: 'booking.balanceDueDaysBeforeDeparture', value: 30, group: 'booking' },
  { key: 'booking.referencePrefix', value: 'UMR', group: 'booking' },
  { key: 'payments.provider', value: 'manual', group: 'payments' },
  { key: 'payments.allowOffline', value: true, group: 'payments' },
  { key: 'documents.maxUploadMb', value: 10, group: 'documents' },
  {
    key: 'documents.allowedMimeTypes',
    value: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    group: 'documents',
  },
  { key: 'security.staff2faRequired', value: true, group: 'security' },
];

async function seedSettings(): Promise<void> {
  for (const s of SETTINGS) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {}, // keep admin-edited values
      create: { key: s.key, value: s.value as object, group: s.group, isPublic: s.isPublic ?? false },
    });
  }
}

const TEMPLATES: {
  key: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}[] = [
  {
    key: 'auth.welcome',
    name: 'Welcome',
    subject: 'Welcome to {{companyName}}',
    body: 'Assalamu alaikum {{firstName}}, your account is ready. Sign in to manage your bookings: {{link}}',
    variables: ['firstName', 'companyName', 'link'],
  },
  {
    key: 'auth.verify_email',
    name: 'Verify email',
    subject: 'Verify your email address',
    body: 'Assalamu alaikum {{firstName}}, please verify your email: {{link}}',
    variables: ['firstName', 'link'],
  },
  {
    key: 'auth.password_reset',
    name: 'Password reset',
    subject: 'Reset your password',
    body: 'Use this link to reset your password (valid for 30 minutes): {{link}}',
    variables: ['link'],
  },
  {
    key: 'booking.submitted',
    name: 'Booking received',
    subject: 'Booking {{reference}} received',
    body: 'We have received booking {{reference}} for {{packageTitle}} departing {{departureDate}}. Amount due: {{amountDue}}.',
    variables: ['reference', 'packageTitle', 'departureDate', 'amountDue'],
  },
  {
    key: 'booking.confirmed',
    name: 'Booking confirmed',
    subject: 'Booking {{reference}} confirmed',
    body: 'Your booking {{reference}} is confirmed. Outstanding balance: {{balanceDue}} due by {{balanceDueDate}}.',
    variables: ['reference', 'balanceDue', 'balanceDueDate'],
  },
  {
    key: 'payment.received',
    name: 'Payment received',
    subject: 'Payment {{paymentReference}} received',
    body: 'We received {{amount}} for booking {{reference}}. Remaining balance: {{balanceDue}}.',
    variables: ['paymentReference', 'amount', 'reference', 'balanceDue'],
  },
  {
    key: 'payment.reminder',
    name: 'Payment reminder',
    subject: 'Payment reminder for booking {{reference}}',
    body: 'A payment of {{amount}} for booking {{reference}} is due on {{dueDate}}.',
    variables: ['amount', 'reference', 'dueDate'],
  },
  {
    key: 'invoice.issued',
    name: 'Invoice issued',
    subject: 'Invoice {{invoiceNumber}} for booking {{reference}}',
    body: 'Invoice {{invoiceNumber}} for {{total}} has been issued for booking {{reference}}. Balance due: {{balanceDue}}. Download it from your portal: {{link}}',
    variables: ['invoiceNumber', 'reference', 'total', 'balanceDue', 'link'],
  },
  {
    key: 'document.missing_reminder',
    name: 'Missing documents reminder',
    subject: 'Documents needed for booking {{reference}}',
    body: 'We still need the following for {{travelerName}} on booking {{reference}}: {{missingDocuments}}. Upload them securely here: {{link}}',
    variables: ['reference', 'travelerName', 'missingDocuments', 'link'],
  },
  {
    key: 'document.rejected',
    name: 'Document needs attention',
    subject: 'Action needed: {{documentType}}',
    body: 'The {{documentType}} for {{travelerName}} could not be accepted: {{reason}}. Please upload a new copy.',
    variables: ['documentType', 'travelerName', 'reason'],
  },
  {
    key: 'visa.status_changed',
    name: 'Visa status update',
    subject: 'Visa update for {{travelerName}}',
    body: 'Visa status for {{travelerName}} (booking {{reference}}) is now: {{status}}.',
    variables: ['travelerName', 'reference', 'status'],
  },
  {
    key: 'travel.pre_departure',
    name: 'Pre-departure reminder',
    subject: 'Your Umrah journey begins on {{departureDate}}',
    body: 'Your departure for booking {{reference}} is on {{departureDate}}. Your travel documents are available in your portal.',
    variables: ['reference', 'departureDate'],
  },
];

/** WhatsApp Business only allows pre-approved templates: seeded inactive until providerTemplateName is set. */
const WHATSAPP_KEYS = [
  'booking.confirmed',
  'payment.reminder',
  'document.missing_reminder',
  'visa.status_changed',
  'travel.pre_departure',
];

async function seedTemplates(): Promise<void> {
  const channels: NotificationChannel[] = ['EMAIL', 'IN_APP'];
  for (const t of TEMPLATES) {
    for (const channel of channels) {
      await prisma.notificationTemplate.upsert({
        where: { key_channel_locale: { key: t.key, channel, locale: 'en' } },
        update: {},
        create: { ...t, channel, locale: 'en' },
      });
    }
    if (WHATSAPP_KEYS.includes(t.key)) {
      await prisma.notificationTemplate.upsert({
        where: { key_channel_locale: { key: t.key, channel: 'WHATSAPP', locale: 'en' } },
        update: {},
        create: { ...t, channel: 'WHATSAPP', locale: 'en', isActive: false },
      });
    }
  }
}

async function seedAutomation(): Promise<void> {
  const rules = [
    {
      key: 'payment.reminder.3d_before_due',
      name: 'Installment reminder (3 days before due)',
      triggerEvent: 'installment.due',
      offsetMinutes: -3 * 24 * 60,
      templateKey: 'payment.reminder',
    },
    {
      key: 'payment.reminder.overdue',
      name: 'Overdue installment reminder',
      triggerEvent: 'installment.due',
      offsetMinutes: 24 * 60,
      templateKey: 'payment.reminder',
    },
    {
      key: 'document.missing_reminder.3d',
      name: 'Missing documents reminder (3 days after booking)',
      triggerEvent: 'booking.confirmed',
      offsetMinutes: 3 * 24 * 60,
      conditions: { requires: 'missing_documents' },
      templateKey: 'document.missing_reminder',
    },
    {
      key: 'travel.pre_departure.7d',
      name: 'Pre-departure reminder (7 days)',
      triggerEvent: 'departure.date',
      offsetMinutes: -7 * 24 * 60,
      templateKey: 'travel.pre_departure',
    },
  ];
  for (const r of rules) {
    await prisma.automationRule.upsert({
      where: { key: r.key },
      update: {},
      create: { ...r, channels: ['EMAIL', 'WHATSAPP', 'IN_APP'] },
    });
  }
}

async function seedTaxonomy(): Promise<void> {
  const categories = [
    { slug: 'economy-umrah', name: 'Economy Umrah', sortOrder: 1 },
    { slug: 'premium-umrah', name: 'Premium Umrah', sortOrder: 2 },
    { slug: 'family-umrah', name: 'Family Umrah', sortOrder: 3 },
    { slug: 'group-umrah', name: 'Group Umrah', sortOrder: 4 },
    { slug: 'ramadan-umrah', name: 'Ramadan Umrah', sortOrder: 5 },
  ];
  for (const c of categories) {
    await prisma.packageCategory.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
  const postCategories = [
    { slug: 'umrah-guide', name: 'Umrah Guide', type: 'GUIDE' as const },
    { slug: 'travel-tips', name: 'Travel Tips', type: 'BLOG' as const },
    { slug: 'news', name: 'News & Updates', type: 'NEWS' as const },
  ];
  for (const c of postCategories) {
    await prisma.postCategory.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }
}

async function main(): Promise<void> {
  await seedRbac();
  await seedSuperAdmin();
  await seedSettings();
  await seedTemplates();
  await seedAutomation();
  await seedTaxonomy();
  console.log('✓ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
