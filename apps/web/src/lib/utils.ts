import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Our `bg-pattern` utilities set only a background *image*. Registering them as their own class group stops
// tailwind-merge from treating them as a conflict with `bg-<color>` and silently dropping the colour.
const twMerge = extendTailwindMerge<'brand-pattern'>({
  extend: { classGroups: { 'brand-pattern': ['bg-pattern', 'bg-pattern-dark'] } },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
