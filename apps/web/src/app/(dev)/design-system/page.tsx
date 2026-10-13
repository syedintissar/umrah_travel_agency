import { notFound } from 'next/navigation';
import { CalendarCheck, CreditCard, Luggage, Users } from 'lucide-react';
import { Rating, PriceTag } from '@/components/commerce/primitives';
import { PackageCard } from '@/components/commerce/package-card';
import { PriceSummary } from '@/components/commerce/price-summary';
import { StepIndicator } from '@/components/commerce/step-indicator';
import { DataTable, type Column } from '@/components/data/data-table';
import { StatCard } from '@/components/data/stat-card';
import { StatusBadge } from '@/components/data/status-badge';
import { EmptyState, ErrorState, SuccessState } from '@/components/feedback/states';
import { PackageCardSkeleton, StatCardSkeleton } from '@/components/feedback/skeletons';
import { FormField, PasswordInput } from '@/components/forms/form-field';
import { OrnamentDivider } from '@/components/brand/ornament';
import { Section, SectionHeading } from '@/components/layout/section';
import { Reveal } from '@/components/motion/reveal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { STATUS_META, type StatusDomain } from '@/lib/status';
import type { PackageSummary } from '@/types/catalog';
import { SelectFieldDemo } from './select-demo';
import { ToastDemo } from './toast-demo';

export const metadata = { title: 'Design system', robots: { index: false, follow: false } };

// Sample values for visual review only. This page is disabled in production builds.
const sample = (o: Partial<PackageSummary> & Pick<PackageSummary, 'slug' | 'title' | 'tier' | 'durationDays' | 'nightsMakkah' | 'nightsMadinah' | 'startingPrice'>): PackageSummary => ({
  id: o.slug,
  subtitle: null,
  summary: null,
  categoryName: null,
  departureCities: ['Karachi'],
  mealPlan: 'BREAKFAST',
  currency: 'PKR',
  coverUrl: null,
  coverAlt: null,
  makkahHotel: null,
  madinahHotel: null,
  visaIncluded: true,
  flightIncluded: false,
  transportIncluded: false,
  ziyaratIncluded: false,
  isFeatured: false,
  nextDepartureDate: null,
  seatsLeft: null,
  ...o,
});

const SAMPLE: PackageSummary[] = [
  sample({
    slug: 'sample-premium', title: 'Premium Umrah — 14 Days', tier: 'PREMIUM', durationDays: 14, nightsMakkah: 8, nightsMadinah: 5, startingPrice: '485000',
    flightIncluded: true, transportIncluded: true, ziyaratIncluded: true,
    makkahHotel: { slug: 'a', name: 'Sample Hotel Makkah', city: 'MAKKAH', starRating: 5, distanceToHaramMeters: 150 },
    madinahHotel: { slug: 'b', name: 'Sample Hotel Madinah', city: 'MADINAH', starRating: 5, distanceToHaramMeters: 200 },
    nextDepartureDate: '2027-02-14', seatsLeft: 5,
  }),
  sample({
    slug: 'sample-economy', title: 'Economy Umrah — 10 Days', tier: 'ECONOMY', durationDays: 10, nightsMakkah: 5, nightsMadinah: 4, startingPrice: '289000', transportIncluded: true,
    makkahHotel: { slug: 'c', name: 'Sample Hotel Makkah', city: 'MAKKAH', starRating: 3, distanceToHaramMeters: 900 },
    madinahHotel: { slug: 'd', name: 'Sample Hotel Madinah', city: 'MADINAH', starRating: 3, distanceToHaramMeters: 600 },
  }),
  sample({ slug: 'sample-none', title: 'Custom Family Umrah', tier: 'STANDARD', durationDays: 12, nightsMakkah: 6, nightsMadinah: 5, startingPrice: null }),
];

interface Row { id: string; ref: string; customer: string; amount: number; status: string }
const ROWS: Row[] = [
  { id: '1', ref: 'UMR-2027-000101', customer: 'Sample Customer A', amount: 970000, status: 'CONFIRMED' },
  { id: '2', ref: 'UMR-2027-000102', customer: 'Sample Customer B', amount: 289000, status: 'PENDING_PAYMENT' },
];
const COLUMNS: Column<Row>[] = [
  { key: 'ref', header: 'Reference', cell: (r) => <span className="font-medium">{r.ref}</span> },
  { key: 'customer', header: 'Customer', cell: (r) => r.customer, hideOnMobile: true },
  { key: 'amount', header: 'Total', align: 'end', cell: (r) => `PKR ${r.amount.toLocaleString()}` },
  { key: 'status', header: 'Status', cell: (r) => <StatusBadge domain="booking" value={r.status} /> },
];

const SWATCHES = [
  ['Primary', 'bg-primary'], ['Gold', 'bg-gold'], ['Secondary', 'bg-secondary'], ['Muted', 'bg-muted'],
  ['Accent', 'bg-accent'], ['Success', 'bg-success'], ['Warning', 'bg-warning'], ['Info', 'bg-info'], ['Destructive', 'bg-destructive'], ['Sidebar', 'bg-sidebar'],
] as const;

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DESIGN_SYSTEM_PAGE !== '1') notFound();

  return (
    <>
      <Section>
        <SectionHeading as="h1" eyebrow="Internal" title="Design system" description="Tokens and shared components. Sample data on this page is for visual review only." />

        <div className="space-y-16">
          <div>
            <h2 className="mb-4 text-xl font-semibold">Colour</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {SWATCHES.map(([name, cls]) => (
                <div key={name} className="overflow-hidden rounded-lg border">
                  <div className={`${cls} h-16`} />
                  <p className="p-2 text-xs font-medium">{name}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Typography</h2>
            <div className="space-y-2">
              <p className="font-display text-5xl font-semibold tracking-tight">Display heading</p>
              <p className="font-display text-3xl font-semibold">Section heading</p>
              <p className="text-lg">Body large — comfortable reading size for descriptions and package summaries.</p>
              <p className="text-sm text-muted-foreground">Body small muted — hints, captions and metadata.</p>
              <OrnamentDivider className="max-w-md pt-2" />
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Buttons</h2>
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button><Button variant="gold">Gold CTA</Button><Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button><Button size="xl" variant="gold">Large CTA</Button><Button disabled>Disabled</Button>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Status badges</h2>
            <div className="space-y-4">
              {(Object.keys(STATUS_META) as StatusDomain[]).map((domain) => (
                <div key={domain}>
                  <p className="mb-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{domain}</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(STATUS_META[domain]).map((v) => <StatusBadge key={v} domain={domain} value={v} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Booking steps</h2>
            <Card><CardContent><StepIndicator current="ROOMS" /></CardContent></Card>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Package cards</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {SAMPLE.map((p) => <PackageCard key={p.slug} pkg={p} />)}
              <PackageCardSkeleton />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-xl font-semibold">Forms</h2>
              <Card>
                <CardContent className="grid gap-4">
                  <FormField label="Full name" required hint="As printed on the passport."><Input placeholder="Muhammad Ali" /></FormField>
                  <FormField label="Email" error="Enter a valid email address."><Input type="email" defaultValue="not-an-email" /></FormField>
                  <FormField label="Password" required><PasswordInput placeholder="At least 12 characters" /></FormField>
                  <SelectFieldDemo />
                  <FormField label="Special requirements"><Textarea rows={3} /></FormField>
                  <RadioGroup defaultValue="double" className="grid grid-cols-3 gap-2">
                    {['double', 'triple', 'quad'].map((v) => (
                      <Label key={v} className="flex cursor-pointer items-center gap-2 rounded-lg border p-3 capitalize has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                        <RadioGroupItem value={v} /> {v}
                      </Label>
                    ))}
                  </RadioGroup>
                  <div className="flex items-center gap-2"><Checkbox id="terms" /><Label htmlFor="terms">I accept the terms & conditions</Label></div>
                  <div className="flex items-center gap-2"><Switch id="wa" /><Label htmlFor="wa">WhatsApp updates</Label></div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="mb-4 text-xl font-semibold">Price summary</h2>
                <PriceSummary
                  currency="PKR"
                  lines={[{ label: '2 adults × Double', amount: 970000 }, { label: 'Early-bird discount', amount: 20000, discount: true }]}
                  total={950000} dueNow={237500} balance={712500} balanceDueDate="14 Jan 2027"
                />
              </div>
              <div>
                <h2 className="mb-4 text-xl font-semibold">Price & rating</h2>
                <div className="flex flex-wrap items-end gap-8">
                  <PriceTag amount={485000} currency="PKR" size="lg" /><PriceTag amount={null} currency="PKR" /><Rating value={4.5} size="md" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Dashboard stats</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Active bookings" value="—" icon={Luggage} hint="Live data in Phase 6" />
              <StatCard label="Revenue (month)" value="PKR 4.2M" icon={CreditCard} delta={12.4} hint="vs last month" />
              <StatCard label="Open leads" value="38" icon={Users} delta={-3.1} />
              <StatCard label="Departures soon" value="4" icon={CalendarCheck} />
              <StatCardSkeleton />
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Data table</h2>
            <Card className="p-0"><DataTable caption="Recent bookings" columns={COLUMNS} rows={ROWS} rowKey={(r) => r.id} /></Card>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold">Feedback states</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <EmptyState title="No documents yet" description="Upload each traveler's passport and photo to continue." action={<Button>Upload document</Button>} />
              <ErrorState onRetry={undefined} />
              <SuccessState title="Booking received" description="We'll email you once your deposit is verified." />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Alert><AlertTitle>Passport validity</AlertTitle><AlertDescription>Passports must be valid for at least 6 months after the return date.</AlertDescription></Alert>
              <Alert variant="destructive"><AlertTitle>Document rejected</AlertTitle><AlertDescription>The passport scan is blurry. Please upload a clearer copy.</AlertDescription></Alert>
            </div>
            <div className="mt-4"><ToastDemo /></div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-xl font-semibold">Tabs</h2>
              <Tabs defaultValue="overview">
                <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="itinerary">Itinerary</TabsTrigger><TabsTrigger value="policies">Policies</TabsTrigger></TabsList>
                <TabsContent value="overview" className="pt-4 text-sm text-muted-foreground">Package overview content.</TabsContent>
                <TabsContent value="itinerary" className="pt-4 text-sm text-muted-foreground">Day-by-day itinerary.</TabsContent>
                <TabsContent value="policies" className="pt-4 text-sm text-muted-foreground">Cancellation and refund policy.</TabsContent>
              </Tabs>
            </div>
            <div>
              <h2 className="mb-4 text-xl font-semibold">Accordion (FAQ)</h2>
              <Accordion type="single" collapsible>
                <AccordionItem value="a"><AccordionTrigger>How long does visa processing take?</AccordionTrigger><AccordionContent>Timelines are published by the visa team and shown here from the CMS.</AccordionContent></AccordionItem>
                <AccordionItem value="b"><AccordionTrigger>Can I pay in installments?</AccordionTrigger><AccordionContent>Yes — a deposit confirms the booking and the balance follows a schedule.</AccordionContent></AccordionItem>
              </Accordion>
            </div>
          </div>

          <Reveal>
            <Card><CardHeader><CardTitle>Scroll reveal</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">This card fades up on scroll and respects reduced-motion settings.</CardContent></Card>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
