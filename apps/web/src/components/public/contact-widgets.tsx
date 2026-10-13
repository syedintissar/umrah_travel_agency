import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { safeMapEmbed, telLink, whatsappLink, type CompanyInfo } from '@/lib/company';

/** Floating WhatsApp button, rendered only when a number is configured in settings. */
export function WhatsAppButton({ company }: { company: CompanyInfo }) {
  const href = whatsappLink(company.whatsapp, `Assalamu alaikum, I would like to know more about your Umrah packages.`);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp (opens in a new tab)"
      className="fixed end-4 bottom-4 z-30 inline-flex items-center gap-2 rounded-full bg-[#1f9e57] px-4 py-3 text-sm font-semibold text-white shadow-elevated transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-[#1f9e57]/40 focus-visible:outline-none max-lg:bottom-20"
    >
      <MessageCircle className="size-5" aria-hidden />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}

/** Address, phone, email and hours: only fields that are configured are shown. */
export function ContactDetails({ company }: { company: CompanyInfo }) {
  const tel = telLink(company.phone);
  const wa = whatsappLink(company.whatsapp);
  const rows = [
    company.phone && { icon: Phone, label: 'Phone', node: tel ? <a href={tel} className="hover:underline">{company.phone}</a> : company.phone },
    company.whatsapp && { icon: MessageCircle, label: 'WhatsApp', node: wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:underline">{company.whatsapp}</a> : company.whatsapp },
    company.email && { icon: Mail, label: 'Email', node: <a href={`mailto:${company.email}`} className="break-all hover:underline">{company.email}</a> },
    company.address && { icon: MapPin, label: 'Office', node: <span className="whitespace-pre-line">{company.address}</span> },
    company.officeHours && { icon: Clock, label: 'Hours', node: company.officeHours },
  ].filter(Boolean) as { icon: typeof Phone; label: string; node: React.ReactNode }[];

  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Contact details will appear here once they are added in the admin settings.</p>;
  return (
    <dl className="grid gap-4">
      {rows.map(({ icon: Icon, label, node }) => (
        <div key={label} className="flex items-start gap-3">
          <dt className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden />
            <span className="sr-only">{label}</span>
          </dt>
          <dd className="min-w-0">
            <span className="block text-xs font-medium tracking-wide text-muted-foreground uppercase" aria-hidden>{label}</span>
            <span className="mt-0.5 block font-medium">{node}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function MapEmbed({ url, title }: { url: string; title: string }) {
  const src = safeMapEmbed(url);
  if (!src) return null;
  return (
    <div className="overflow-hidden rounded-2xl border shadow-card">
      <iframe src={src} title={title} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="aspect-[16/10] w-full border-0" allowFullScreen />
    </div>
  );
}
