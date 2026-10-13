'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Fades content up when it scrolls into view. Content is visible by default (no-JS / SSR safe) and
 * the effect is skipped for users who prefer reduced motion.
 */
export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState<'idle' | 'hidden' | 'shown'>('idle');

  React.useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return; // already on screen: don't animate
    setState('hidden');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setState('shown');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={state === 'shown' && delay ? { animationDelay: `${delay}ms` } : undefined}
      className={cn(state === 'hidden' && 'opacity-0', state === 'shown' && 'animate-fade-up', className)}
    >
      {children}
    </div>
  );
}
