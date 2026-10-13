import type { Metadata } from 'next';
import { ArticleBody, CtaPanel, PendingPage } from '@/components/public/content-page';
import { Container } from '@/components/layout/section';
import { PageHero } from '@/components/public/page-hero';
import { Card } from '@/components/ui/card';
import { initials } from '@/lib/format';
import { getAccreditations, getCompany, getPage, getTeam } from '@/lib/public-api';
import { buildMetadata } from '@/lib/seo';

const CRUMBS = [{ name: 'Home', path: '/' }, { name: 'About us' }];

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage('about');
  return buildMetadata({
    title: page?.seo.title ?? 'About us',
    description: page?.seo.description ?? 'Who we are, how we work, and the people behind your Umrah journey.',
    path: '/about',
  });
}

export default async function AboutPage() {
  const [page, team, accreditations, company] = await Promise.all([getPage('about'), getTeam(), getAccreditations(), getCompany()]);
  if (!page) return <PendingPage title={`About ${company.name}`} description="Who we are and how we look after pilgrims." breadcrumbs={CRUMBS} />;
  return (
    <>
      <PageHero eyebrow="About us" title={page.title} description={page.excerpt ?? undefined} breadcrumbs={CRUMBS} />
      <ArticleBody content={page.content} />
      {accreditations.length > 0 && (
        <Container className="pb-10">
          <h2 className="mb-5 text-2xl font-semibold sm:text-3xl">Certifications and accreditations</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accreditations.map((a) => (
              <li key={a.id}>
                <Card className="gap-1 p-5 shadow-card">
                  <p className="font-semibold">{a.name}</p>
                  {a.issuer && <p className="text-sm text-muted-foreground">{a.issuer}</p>}
                  {a.number && <p className="text-sm">No. {a.number}</p>}
                </Card>
              </li>
            ))}
          </ul>
        </Container>
      )}
      {team.length > 0 && (
        <Container className="pb-10">
          <h2 className="mb-5 text-2xl font-semibold sm:text-3xl">Our team</h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((m) => (
              <li key={m.id}>
                <Card className="items-center gap-3 p-6 text-center shadow-card">
                  <span className="grid size-20 place-items-center rounded-full bg-primary/10 font-display text-2xl font-semibold text-primary" aria-hidden>
                    {initials(m.name)}
                  </span>
                  <p className="font-display text-lg font-semibold">{m.name}</p>
                  <p className="text-sm text-primary">{m.roleTitle}</p>
                  {m.bio && <p className="text-sm text-muted-foreground">{m.bio}</p>}
                </Card>
              </li>
            ))}
          </ul>
        </Container>
      )}
      <Container className="pb-14">
        <CtaPanel title="Let’s plan your journey" text="Speak to a consultant about dates, hotels and budget." href="/contact" label="Contact us" />
      </Container>
    </>
  );
}
