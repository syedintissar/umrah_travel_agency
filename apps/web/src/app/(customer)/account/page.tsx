import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { EmptyState } from '@/components/feedback/states';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Dashboard' };

// Placeholder: the real dashboard (bookings, balances, visa progress) is built in Phase 5.
export default function AccountDashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Your bookings, payments and visa progress in one place." />
      <EmptyState
        title="Sign in to see your bookings"
        description="Customer accounts are enabled with authentication. Until then there is nothing to show here."
        action={<Button asChild><Link href="/login"><LogIn /> Sign in</Link></Button>}
      />
    </>
  );
}
