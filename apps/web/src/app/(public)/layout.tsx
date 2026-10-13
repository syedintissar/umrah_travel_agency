import { PublicShell } from '@/components/layout/public-shell';

// Pages render on request and rely on the API's cached responses (revalidated via Next's data cache),
// so `next build` does not need the API to be reachable.
export const dynamic = 'force-dynamic';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
