import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { EmptyState } from '@/components/feedback/states';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Dashboard' };

// Placeholder: the business dashboard is built in Phase 6 on top of the authenticated API.
export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader title="Business overview" description="Bookings, revenue, leads and operational tasks." />
      <EmptyState
        title="Staff sign-in required"
        description="This area is available to authorised staff once authentication and role-based access are enabled."
        action={<Button asChild><Link href="/login"><LogIn /> Staff sign in</Link></Button>}
      />
    </>
  );
}
