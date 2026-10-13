import type { PermissionKey } from '@umrah/shared';
import {
  BedDouble,
  BellRing,
  BookOpenCheck,
  CalendarRange,
  ClipboardList,
  CreditCard,
  FileSearch,
  FileText,
  Files,
  Globe2,
  HelpCircle,
  History,
  LayoutDashboard,
  type LucideIcon,
  Luggage,
  MessagesSquare,
  Newspaper,
  Package,
  ReceiptText,
  RotateCcw,
  ScrollText,
  Settings,
  ShieldCheck,
  Star,
  Stamp,
  Truck,
  UserCog,
  UserRound,
  Users,
  UsersRound,
  Wand2,
  Zap,
  BarChart3,
  ImageIcon,
  LifeBuoy,
  Landmark,
} from 'lucide-react';

export const SITE = {
  // Replaced by the `company.name` setting once the public API exists (Phase 3).
  name: 'Umrah Travel',
  tagline: 'Your journey to the Holy Cities, handled with care.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
} as const;

export interface NavLink {
  label: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
}

export interface NavMenu {
  label: string;
  items: NavLink[];
}

/** Public header: direct links and grouped dropdowns (flattened in the mobile sheet). */
export const PUBLIC_NAV: (NavLink | NavMenu)[] = [
  { label: 'Packages', href: '/packages' },
  {
    label: 'Services',
    items: [
      { label: 'Hotels', href: '/hotels', description: 'Makkah & Madinah stays', icon: BedDouble },
      {
        label: 'Transportation',
        href: '/transportation',
        description: 'Transfers & intercity travel',
        icon: Truck,
      },
      { label: 'Ziyarat', href: '/ziyarat', description: 'Holy sites to visit', icon: Landmark },
      {
        label: 'Customized package',
        href: '/custom-package',
        description: 'Tell us what you need',
        icon: Wand2,
      },
    ],
  },
  {
    label: 'Learn',
    items: [
      {
        label: 'Umrah guide',
        href: '/umrah-guide',
        description: 'Step-by-step for first-timers',
        icon: BookOpenCheck,
      },
      {
        label: 'Visa information',
        href: '/visa-information',
        description: 'Requirements & timelines',
        icon: Stamp,
      },
      { label: 'Blog', href: '/blog', description: 'Tips and updates', icon: Newspaper },
      { label: 'FAQ', href: '/faq', description: 'Common questions', icon: HelpCircle },
    ],
  },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export const FOOTER_LINKS = {
  explore: [
    { label: 'Umrah packages', href: '/packages' },
    { label: 'Hotels', href: '/hotels' },
    { label: 'Transportation', href: '/transportation' },
    { label: 'Ziyarat', href: '/ziyarat' },
    { label: 'Customized package', href: '/custom-package' },
  ],
  learn: [
    { label: 'Umrah guide', href: '/umrah-guide' },
    { label: 'Visa information', href: '/visa-information' },
    { label: 'Blog', href: '/blog' },
    { label: 'FAQ', href: '/faq' },
  ],
  company: [
    { label: 'About us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Sign in', href: '/login' },
  ],
  legal: [
    { label: 'Terms & conditions', href: '/policies/terms' },
    { label: 'Privacy policy', href: '/policies/privacy' },
    { label: 'Refund & cancellation', href: '/policies/refund-cancellation' },
    { label: 'Payment policy', href: '/policies/payment' },
    { label: 'Cookie policy', href: '/policies/cookies' },
  ],
} satisfies Record<string, NavLink[]>;

export interface PortalNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Staff only: item is hidden unless the user holds this permission. */
  permission?: PermissionKey;
}

export interface PortalNavGroup {
  label?: string;
  items: PortalNavItem[];
}

export const CUSTOMER_NAV: PortalNavGroup[] = [
  {
    items: [
      { label: 'Dashboard', href: '/account', icon: LayoutDashboard },
      { label: 'My bookings', href: '/account/bookings', icon: Luggage },
      { label: 'Travelers', href: '/account/travelers', icon: UsersRound },
      { label: 'Documents', href: '/account/documents', icon: Files },
    ],
  },
  {
    label: 'Money',
    items: [
      { label: 'Payments', href: '/account/payments', icon: CreditCard },
      { label: 'Invoices', href: '/account/invoices', icon: ReceiptText },
    ],
  },
  {
    label: 'Journey',
    items: [
      { label: 'Visa tracking', href: '/account/visa', icon: Stamp },
      { label: 'Notifications', href: '/account/notifications', icon: BellRing },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Profile', href: '/account/profile', icon: UserRound },
      { label: 'Support', href: '/account/support', icon: LifeBuoy },
    ],
  },
];

export const ADMIN_NAV: PortalNavGroup[] = [
  {
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, permission: 'dashboard:read' },
    ],
  },
  {
    label: 'Sales & CRM',
    items: [
      { label: 'Leads', href: '/admin/leads', icon: Zap, permission: 'leads:read' },
      {
        label: 'Quotations',
        href: '/admin/quotations',
        icon: FileText,
        permission: 'quotations:read',
      },
      {
        label: 'Follow-ups',
        href: '/admin/follow-ups',
        icon: History,
        permission: 'followups:read',
      },
      { label: 'Customers', href: '/admin/customers', icon: Users, permission: 'customers:read' },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Bookings',
        href: '/admin/bookings',
        icon: ClipboardList,
        permission: 'bookings:read',
      },
      {
        label: 'Travelers',
        href: '/admin/travelers',
        icon: UsersRound,
        permission: 'travelers:read',
      },
      { label: 'Documents', href: '/admin/documents', icon: FileSearch, permission: 'documents:read' },
      { label: 'Visa applications', href: '/admin/visas', icon: Stamp, permission: 'visas:read' },
      { label: 'Support requests', href: '/admin/support', icon: LifeBuoy, permission: 'support:read' },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Packages', href: '/admin/packages', icon: Package, permission: 'packages:read' },
      {
        label: 'Departures',
        href: '/admin/departures',
        icon: CalendarRange,
        permission: 'departures:read',
      },
      { label: 'Hotels', href: '/admin/hotels', icon: BedDouble, permission: 'hotels:read' },
      { label: 'Transportation', href: '/admin/transport', icon: Truck, permission: 'transport:read' },
      { label: 'Ziyarat', href: '/admin/ziyarat', icon: Landmark, permission: 'ziyarat:read' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Payments', href: '/admin/payments', icon: CreditCard, permission: 'payments:read' },
      { label: 'Invoices', href: '/admin/invoices', icon: ReceiptText, permission: 'invoices:read' },
      { label: 'Refunds', href: '/admin/refunds', icon: RotateCcw, permission: 'refunds:read' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Pages & CMS', href: '/admin/cms', icon: Globe2, permission: 'cms:read' },
      { label: 'Blog & guides', href: '/admin/posts', icon: Newspaper, permission: 'cms:read' },
      { label: 'FAQs', href: '/admin/faqs', icon: HelpCircle, permission: 'cms:read' },
      { label: 'Reviews', href: '/admin/reviews', icon: Star, permission: 'reviews:read' },
      { label: 'Media library', href: '/admin/media', icon: ImageIcon, permission: 'media:read' },
    ],
  },
  {
    label: 'Insights',
    items: [{ label: 'Reports', href: '/admin/reports', icon: BarChart3, permission: 'reports:read' }],
  },
  {
    label: 'Administration',
    items: [
      {
        label: 'Notifications',
        href: '/admin/notifications',
        icon: MessagesSquare,
        permission: 'notifications:read',
      },
      { label: 'Automation', href: '/admin/automation', icon: Zap, permission: 'automation:read' },
      { label: 'Staff', href: '/admin/staff', icon: UserCog, permission: 'staff:read' },
      { label: 'Roles & permissions', href: '/admin/roles', icon: ShieldCheck, permission: 'roles:read' },
      { label: 'Settings', href: '/admin/settings', icon: Settings, permission: 'settings:read' },
      { label: 'Audit logs', href: '/admin/audit-logs', icon: ScrollText, permission: 'audit:read' },
    ],
  },
];

/** Keeps only the items (and non-empty groups) a user may see. */
export function filterNavByPermissions(
  groups: PortalNavGroup[],
  permissions: readonly string[] | null,
): PortalNavGroup[] {
  if (permissions === null) return groups;
  const allowed = new Set(permissions);
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.permission || allowed.has(i.permission)),
    }))
    .filter((g) => g.items.length > 0);
}
