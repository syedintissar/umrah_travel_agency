'use client';

import * as React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { ErrorState } from '@/components/feedback/states';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    // Monitoring hook (Sentry is wired in Phase 9). Never render the message to users.
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className="grid min-h-dvh place-items-center p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <ErrorState
          title="Something went wrong on our side"
          description={error.digest ? `Please try again. If it keeps happening, quote reference ${error.digest} when you contact us.` : 'Please try again in a moment.'}
          onRetry={reset}
          className="[&_div]:flex-wrap"
        />
        <p className="mt-4 text-center text-sm"><Button asChild variant="link"><Link href="/">Go to home page</Link></Button></p>
      </div>
    </main>
  );
}
