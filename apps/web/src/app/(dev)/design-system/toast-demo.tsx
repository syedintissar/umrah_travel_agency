'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => toast.success('Document uploaded', { description: 'Your passport copy is awaiting review.' })}>Success toast</Button>
      <Button variant="outline" onClick={() => toast.error('Payment could not be completed', { description: 'No amount was charged.' })}>Error toast</Button>
      <Button variant="outline" onClick={() => toast.info('Seat hold expires in 30 minutes')}>Info toast</Button>
    </div>
  );
}
