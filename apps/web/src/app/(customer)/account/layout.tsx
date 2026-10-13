import type { Metadata } from 'next';
import { PortalShell } from '@/components/layout/portal-shell';

export const metadata: Metadata = {
  title: { default: 'My account', template: '%s | My account' },
  robots: { index: false, follow: false },
};

// Phase 4/5: replace `user` with the signed-in customer and redirect unauthenticated visitors to /login.
export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell variant="customer" user={null}>
      {children}
    </PortalShell>
  );
}
