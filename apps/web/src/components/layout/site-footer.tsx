import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { ArabicOrnament, OrnamentDivider } from '@/components/brand/ornament';
import { FOOTER_LINKS, SITE, type NavLink } from '@/config/site';
import { telLink, type CompanyInfo } from '@/lib/company';

function LinkColumn({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="font-sans text-xs font-semibold tracking-wider text-sidebar-muted uppercase">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-sidebar-foreground/85 transition-colors hover:text-gold focus-visible:text-gold focus-visible:outline-none">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter({ company }: { company: CompanyInfo }) {
  const tel = telLink(company.phone);
  const social = Object.entries(company.social);
  return (
    <footer className="bg-sidebar text-sidebar-foreground bg-pattern">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <Logo tone="inverse" name={company.name} />
            <p className="mt-4 text-sm leading-relaxed text-sidebar-foreground/80">{SITE.tagline}</p>
            {(company.phone || company.email || company.address) && (
              <address className="mt-4 space-y-1.5 text-sm text-sidebar-foreground/80 not-italic">
                {company.phone && <p>{tel ? <a href={tel} className="hover:text-gold">{company.phone}</a> : company.phone}</p>}
                {company.email && <p><a href={`mailto:${company.email}`} className="break-all hover:text-gold">{company.email}</a></p>}
                {company.address && <p className="whitespace-pre-line">{company.address}</p>}
              </address>
            )}
            {company.licenseNumber && <p className="mt-3 text-xs text-sidebar-muted">License no. {company.licenseNumber}</p>}
            <p className="mt-5"><ArabicOrnament className="text-2xl">بسم الله الرحمن الرحيم</ArabicOrnament></p>
          </div>
          <LinkColumn title="Explore" links={FOOTER_LINKS.explore} />
          <LinkColumn title="Learn" links={FOOTER_LINKS.learn} />
          <div>
            <LinkColumn title="Company" links={FOOTER_LINKS.company} />
            {social.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="Social media">
                {social.map(([name, url]) => <li key={name}><a href={url} target="_blank" rel="noopener noreferrer" className="capitalize text-sidebar-foreground/85 hover:text-gold">{name}</a></li>)}
              </ul>
            )}
          </div>
        </div>

        <OrnamentDivider className="my-10 opacity-70" />

        <div className="flex flex-col gap-4 text-xs text-sidebar-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {company.name}. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {FOOTER_LINKS.legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-gold focus-visible:text-gold focus-visible:outline-none">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
