import { WhatsAppButton } from '@/components/public/contact-widgets';
import { getCompany } from '@/lib/public-api';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

/** Public site chrome. Company name, contact details and the WhatsApp button come from admin-editable settings. */
export async function PublicShell({ children }: { children: React.ReactNode }) {
  const company = await getCompany();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader siteName={company.name} />
      <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter company={company} />
      <WhatsAppButton company={company} />
    </div>
  );
}
