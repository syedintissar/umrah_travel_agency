import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { ThemeProvider } from '@/components/layout/theme';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SITE } from '@/config/site';
import './globals.css';

// Self-hosted (SIL OFL) so builds never depend on Google Fonts and visitors make no third-party requests.
const inter = localFont({
  src: './fonts/inter-latin-wght-normal.woff2',
  variable: '--font-inter',
  weight: '100 900',
  display: 'swap',
});
const fraunces = localFont({
  src: './fonts/fraunces-latin-wght-normal.woff2',
  variable: '--font-fraunces',
  weight: '100 900',
  display: 'swap',
});
// Decorative Arabic only (e.g. Bismillah ornament).
const amiri = localFont({
  src: [
    { path: './fonts/amiri-arabic-400-normal.woff2', weight: '400' },
    { path: './fonts/amiri-arabic-700-normal.woff2', weight: '700' },
  ],
  variable: '--font-amiri',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} | Umrah packages, hotels, transport & visa`, template: `%s | ${SITE.name}` },
  description: SITE.tagline,
  openGraph: { type: 'website', siteName: SITE.name, locale: 'en_PK' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf6' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1c17' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `dir` is fixed to ltr until Arabic/Urdu are added (the UI already uses logical CSS properties).
    <html lang="en" dir="ltr" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable} ${amiri.variable}`}>
      <body>
        <a
          href="#main-content"
          className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
