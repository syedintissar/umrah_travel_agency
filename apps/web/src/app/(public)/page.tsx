import Link from 'next/link';
import { ArrowRight, BedDouble, BookOpenCheck, FileLock2, Landmark, ShieldCheck, Stamp, Truck, Wallet, Wand2 } from 'lucide-react';
import { ArabicOrnament } from '@/components/brand/ornament';
import { PackageCard } from '@/components/commerce/package-card';
import { Container, Section, SectionHeading } from '@/components/layout/section';
import { PostCard, ReviewCard } from '@/components/public/cards';
import { FaqList } from '@/components/public/faq-list';
import { PackageSearchBar } from '@/components/public/package-search-bar';
import { JsonLd } from '@/components/seo/json-ld';
import { Reveal } from '@/components/motion/reveal';
import { Button } from '@/components/ui/button';
import { SITE } from '@/config/site';
import { getAccreditations, getCompany, getFaqs, getPackages, getPosts, getReviews } from '@/lib/public-api';
import { buildMetadata, organizationJsonLd, websiteJsonLd } from '@/lib/seo';

export const metadata = buildMetadata({
  title: `${SITE.name} | Umrah packages, hotels, transport & visa`,
  description: SITE.tagline,
  path: '/',
});

const SERVICES = [
  { href: '/hotels', icon: BedDouble, title: 'Hotels', text: 'Stays near the Haram and Masjid an-Nabawi, from 3 to 5 stars.' },
  { href: '/transportation', icon: Truck, title: 'Transportation', text: 'Airport transfers, the Haramain train and private vehicles.' },
  { href: '/visa-information', icon: Stamp, title: 'Visa support', text: 'Requirements, timelines and tracking, handled by our visa team.' },
  { href: '/ziyarat', icon: Landmark, title: 'Ziyarat', text: 'Guided visits to the historic sites of Makkah and Madinah.' },
  { href: '/umrah-guide', icon: BookOpenCheck, title: 'Umrah guide', text: 'Step-by-step help with Ihram, Tawaf, Sa\'i and preparation.' },
  { href: '/custom-package', icon: Wand2, title: 'Custom package', text: 'Tell us your dates, hotels and budget for a tailored quotation.' },
];

const STEPS = [
  { title: 'Choose your package', text: 'Compare packages, hotels and departure dates with clear per-person prices.' },
  { title: 'Reserve with a deposit', text: 'Confirm your seats with a deposit and follow a clear payment schedule.' },
  { title: 'Upload documents securely', text: 'Add passports and photos once; they stay in private, access-controlled storage.' },
  { title: 'Track visa and travel', text: 'Follow every visa and booking update in your portal and by notification.' },
];

const BENEFITS = [
  { icon: Wallet, title: 'Transparent payments', text: 'Deposits, installments and balances are always visible in your account, with invoices for every payment.' },
  { icon: FileLock2, title: 'Private document storage', text: 'Passport and ID files are stored privately and only opened by authorised staff, with every access logged.' },
  { icon: ShieldCheck, title: 'One team, start to finish', text: 'The same consultants handle your booking, visa and travel preparation, from first enquiry to return.' },
];

export default async function HomePage() {
  const [company, featuredList, accreditations, reviews, guides, faqs] = await Promise.all([
    getCompany(),
    getPackages({ featured: true, pageSize: 6 }),
    getAccreditations(),
    getReviews(3),
    getPosts({ pageSize: 3, type: 'BLOG' }),
    getFaqs(),
  ]);
  // Fall back to the latest packages when none are flagged as featured.
  const featured = featuredList.items.length > 0 ? featuredList : await getPackages({ pageSize: 6 });
  const cities = featured.facets.cities;
  const homeFaqs = faqs.filter((f) => f.category === 'general' || f.category === 'booking').slice(0, 6);

  return (
    <>
      <JsonLd data={[organizationJsonLd(company), websiteJsonLd(company)]} />

      <section className="relative isolate overflow-hidden bg-sidebar text-sidebar-foreground bg-pattern">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/40 via-transparent to-sidebar" aria-hidden />
        <Container className="flex flex-col items-center py-16 text-center sm:py-24">
          <ArabicOrnament className="animate-fade-in text-3xl sm:text-4xl">بسم الله الرحمن الرحيم</ArabicOrnament>
          <h1 className="mt-6 max-w-3xl animate-fade-up text-4xl font-semibold sm:text-6xl">{SITE.tagline}</h1>
          <p className="mt-5 max-w-xl animate-fade-up text-base text-sidebar-foreground/80 [animation-delay:120ms] sm:text-lg">
            Hand-picked Umrah packages, trusted hotels near the Haram, and visa support from start to finish.
          </p>
          <div className="mt-9 w-full max-w-3xl animate-fade-up [animation-delay:240ms]">
            <PackageSearchBar cities={cities} />
            <p className="mt-4 text-sm text-sidebar-foreground/75">
              Not sure yet? <Link href="/custom-package" className="font-medium text-gold underline underline-offset-4">Request a custom package</Link>
            </p>
          </div>
        </Container>
      </section>

      {accreditations.length > 0 && (
        <section aria-label="Accreditations" className="border-b bg-card">
          <Container className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-5 text-sm text-muted-foreground">
            {accreditations.map((a) => <span key={a.id} className="font-medium">{a.name}{a.number ? ` · ${a.number}` : ''}</span>)}
          </Container>
        </section>
      )}

      {featured.items.length > 0 && (
        <Section>
          <SectionHeading
            eyebrow="Featured packages"
            title="Find your journey"
            description="Prices are per person and include the services listed on each package."
            action={<Button asChild variant="outline"><Link href="/packages">All packages <ArrowRight className="rtl:rotate-180" /></Link></Button>}
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.items.slice(0, 6).map((p, i) => <Reveal key={p.id} delay={i * 60}><PackageCard pkg={p} className="h-full" /></Reveal>)}
          </div>
        </Section>
      )}

      <Section tone="muted">
        <SectionHeading eyebrow="Everything in one place" title="Services for your whole journey" align="center" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ href, icon: Icon, title, text }) => (
            <Link key={href} href={href} className="group flex gap-4 rounded-2xl border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="size-6" aria-hidden /></span>
              <span>
                <span className="block font-display text-lg font-semibold">{title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{text}</span>
              </span>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="How it works" title="From enquiry to arrival" description="A clear, trackable process, so you always know what happens next." />
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border bg-card p-6 shadow-card">
              <span className="grid size-10 place-items-center rounded-full bg-gold font-display text-lg font-semibold text-gold-foreground">{i + 1}</span>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="brand">
        <SectionHeading eyebrow="Why book with us" title="Care you can see" invert align="center" />
        <div className="grid gap-6 md:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-6">
              <Icon className="size-8 text-gold" aria-hidden />
              <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-sidebar-foreground/80">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      {reviews.items.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Pilgrim feedback" title="What our travelers say" description={reviews.summary.average ? `Rated ${reviews.summary.average} out of 5 from ${reviews.summary.count} reviews.` : undefined} />
          <div className="grid gap-6 md:grid-cols-3">{reviews.items.map((r) => <ReviewCard key={r.id} review={r} />)}</div>
        </Section>
      )}

      {guides.items.length > 0 && (
        <Section tone="muted">
          <SectionHeading eyebrow="From the blog" title="Travel tips and updates" action={<Button asChild variant="outline"><Link href="/blog">Read more <ArrowRight className="rtl:rotate-180" /></Link></Button>} />
          <div className="grid gap-6 md:grid-cols-3">{guides.items.map((p) => <PostCard key={p.slug} post={p} base="/blog" />)}</div>
        </Section>
      )}

      {homeFaqs.length > 0 && (
        <Section>
          <div className="mx-auto max-w-3xl">
            <SectionHeading eyebrow="FAQs" title="Questions pilgrims often ask" align="center" />
            <FaqList faqs={homeFaqs} />
            <p className="mt-6 text-center"><Button asChild variant="link"><Link href="/faq">See all questions <ArrowRight className="rtl:rotate-180" /></Link></Button></p>
          </div>
        </Section>
      )}

      <Section tone="brand" className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Ready to plan your Umrah?</h2>
          <p className="mt-3 text-sidebar-foreground/80">Tell us what you need and a consultant will send you a tailored quotation.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild variant="gold" size="xl"><Link href="/custom-package">Request a quotation</Link></Button>
            <Button asChild variant="outline" size="xl" className="border-sidebar-foreground/30 bg-transparent text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"><Link href="/contact">Contact us</Link></Button>
          </div>
        </div>
      </Section>
    </>
  );
}
