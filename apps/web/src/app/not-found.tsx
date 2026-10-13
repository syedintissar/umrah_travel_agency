import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { EmptyState } from '@/components/feedback/states';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <main id="main-content" className="grid min-h-dvh place-items-center p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <EmptyState
          icon={Compass}
          title="We couldn't find that page"
          description="The link may be out of date, or the page may have moved."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild><Link href="/">Back to home</Link></Button>
              <Button asChild variant="outline"><Link href="/packages">View packages</Link></Button>
            </div>
          }
        />
      </div>
    </main>
  );
}
