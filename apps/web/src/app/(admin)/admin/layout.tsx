import type { Metadata } from 'next';
import { PortalShell } from '@/components/layout/portal-shell';

export const metadata: Metadata = {
  title: { default: 'Staff portal', template: '%s | Staff portal' },
  robots: { index: false, follow: false },
};

// Phase 4/6: load the session, require a staff user with 2FA, and pass `permissions` + `user`.
// `permissions` stays null (unfiltered nav) only while there is no data behind these pages.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell variant="admin" permissions={null} user={null}>
      {children}
    </PortalShell>
  );
}
