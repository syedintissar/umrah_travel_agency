import { cn } from './utils';

describe('cn', () => {
  it('keeps a background colour alongside the pattern utility', () => {
    expect(cn('bg-sidebar text-sidebar-foreground bg-pattern')).toBe('bg-sidebar text-sidebar-foreground bg-pattern');
    expect(cn('py-4 bg-sidebar', 'bg-pattern')).toBe('py-4 bg-sidebar bg-pattern');
  });
  it('still resolves genuine conflicts', () => {
    expect(cn('bg-primary', 'bg-sidebar')).toBe('bg-sidebar');
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
