'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, Send } from 'lucide-react';
import {
  contactInquirySchema,
  customPackageRequestSchema,
  packageInquirySchema,
  ROOM_OCCUPANCIES,
} from '@umrah/shared';
import { SuccessState } from '@/components/feedback/states';
import { FormField } from '@/components/forms/form-field';
import { useLeadSubmit, type FieldErrors } from '@/components/forms/use-lead-submit';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { humanize } from '@/lib/format';

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

const str = (fd: FormData, k: string): string => String(fd.get(k) ?? '').trim();
const bool = (fd: FormData, k: string): boolean => fd.get(k) === 'on';

/** Hidden trap for bots: invisible and unreachable to people using a keyboard or screen reader. */
function Honeypot() {
  return (
    <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}

function ContactFields({ errors, whatsapp = true }: { errors: FieldErrors; whatsapp?: boolean }) {
  return (
    <>
      <FormField label="Full name" required error={errors.fullName}><Input name="fullName" autoComplete="name" maxLength={120} /></FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Email" error={errors.email} hint="Email or phone is required.">
          <Input name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} />
        </FormField>
        <FormField label="Phone" error={errors.phone}><Input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+92 300 1234567" maxLength={30} /></FormField>
      </div>
      {whatsapp && (
        <FormField label="WhatsApp number" error={errors.whatsappNumber} hint="Only if different from your phone.">
          <Input name="whatsappNumber" type="tel" inputMode="tel" maxLength={30} />
        </FormField>
      )}
    </>
  );
}

function Consent({ error }: { error?: string }) {
  const id = React.useId();
  return (
    <div className="grid gap-1.5">
      <div className="flex items-start gap-2.5">
        <Checkbox id={id} name="consent" aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} className="mt-0.5" />
        <Label htmlFor={id} className="text-sm leading-snug font-normal">
          I agree that you may contact me about this request and I have read the <Link href="/policies/privacy" className="font-medium text-primary underline underline-offset-4">privacy policy</Link>.
        </Label>
      </div>
      {error && <p id={`${id}-err`} role="alert" className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

function SubmitBar({ submitting, label, message }: { submitting: boolean; label: string; message?: string }) {
  return (
    <div className="grid gap-3">
      {message && <Alert variant="destructive" role="alert"><AlertDescription>{message}</AlertDescription></Alert>}
      <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto sm:justify-self-start">
        {submitting ? <><Loader2 className="animate-spin" /> Sending…</> : <><Send /> {label}</>}
      </Button>
    </div>
  );
}

function Success({ reference, title, children }: { reference: string; title: string; children?: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => ref.current?.focus(), []);
  return (
    <div ref={ref} tabIndex={-1} className="focus:outline-none">
      <SuccessState
        title={title}
        description={reference === 'ENQ-RECEIVED' ? 'We have received your request and will be in touch soon.' : `Your reference is ${reference}. We have received your request and will be in touch soon.`}
        action={children}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */

export function ContactForm() {
  const { state, submit } = useLeadSubmit('contact', contactInquirySchema);
  if (state.status === 'success') return <Success reference={state.reference} title="Message received" />;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    void submit({
      fullName: str(fd, 'fullName'), email: str(fd, 'email'), phone: str(fd, 'phone'), whatsappNumber: str(fd, 'whatsappNumber'),
      subject: str(fd, 'subject'), message: str(fd, 'message'), consent: bool(fd, 'consent') || undefined, website: str(fd, 'website'),
    });
  };
  const errors = state.fieldErrors;
  return (
    <form onSubmit={onSubmit} noValidate className="relative grid gap-4" aria-label="Contact form">
      <Honeypot />
      <ContactFields errors={errors} />
      <FormField label="Subject" error={errors.subject}><Input name="subject" maxLength={150} /></FormField>
      <FormField label="How can we help?" required error={errors.message}><Textarea name="message" rows={5} maxLength={2000} /></FormField>
      <Consent error={errors.consent} />
      <SubmitBar submitting={state.status === 'submitting'} label="Send message" message={state.status === 'idle' ? state.message : undefined} />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Package enquiry                                                     */
/* ------------------------------------------------------------------ */

export interface DepartureOption { id: string; label: string }

export function PackageInquiryForm({ packageSlug, departures, defaultDepartureId }: { packageSlug: string; departures: DepartureOption[]; defaultDepartureId?: string }) {
  const { state, submit } = useLeadSubmit('package-inquiry', packageInquirySchema);
  const [departureId, setDepartureId] = React.useState(departures.some((d) => d.id === defaultDepartureId) ? defaultDepartureId : undefined);
  React.useEffect(() => {
    if (departures.some((d) => d.id === defaultDepartureId)) setDepartureId(defaultDepartureId);
  }, [defaultDepartureId, departures]);

  if (state.status === 'success') return <Success reference={state.reference} title="Enquiry received" />;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    void submit({
      packageSlug, departureId, fullName: str(fd, 'fullName'), email: str(fd, 'email'), phone: str(fd, 'phone'), whatsappNumber: str(fd, 'whatsappNumber'),
      travelersCount: str(fd, 'travelersCount') || undefined, message: str(fd, 'message'), consent: bool(fd, 'consent') || undefined, website: str(fd, 'website'),
    });
  };
  const errors = state.fieldErrors;
  return (
    <form onSubmit={onSubmit} noValidate className="relative grid gap-4" aria-label="Package enquiry form">
      <Honeypot />
      {departures.length > 0 && (
        <FormField label="Preferred departure" error={errors.departureId}>
          {(p) => (
            <Select value={departureId ?? ''} onValueChange={(v) => setDepartureId(v || undefined)}>
              <SelectTrigger {...p} className="w-full"><SelectValue placeholder="Select a departure (optional)" /></SelectTrigger>
              <SelectContent>{departures.map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}</SelectContent>
            </Select>
          )}
        </FormField>
      )}
      <FormField label="Number of travelers" error={errors.travelersCount}><Input name="travelersCount" type="number" min={1} max={50} inputMode="numeric" defaultValue={2} /></FormField>
      <ContactFields errors={errors} whatsapp={false} />
      <FormField label="Questions or requests" error={errors.message}><Textarea name="message" rows={3} maxLength={2000} /></FormField>
      <Consent error={errors.consent} />
      <SubmitBar submitting={state.status === 'submitting'} label="Request details" message={state.status === 'idle' ? state.message : undefined} />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Custom package                                                      */
/* ------------------------------------------------------------------ */

const ROOM_LABEL: Record<(typeof ROOM_OCCUPANCIES)[number], string> = { SINGLE: 'Single', DOUBLE: 'Double', TRIPLE: 'Triple', QUAD: 'Quad (4)', QUINT: 'Quint (5)', SHARING: 'Shared' };
const DEFAULT_CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Peshawar', 'Quetta', 'Multan', 'Faisalabad', 'Sialkot'];

function FieldGroup({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-4 rounded-xl border p-4 sm:p-5">
      <legend className="px-2 font-display text-lg font-semibold">{title}</legend>
      {description && <p className="-mt-2 text-sm text-muted-foreground">{description}</p>}
      {children}
    </fieldset>
  );
}

function ServiceCheck({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  const id = React.useId();
  return (
    <div className="flex items-center gap-2.5 rounded-lg border p-3 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
      <Checkbox id={id} name={name} defaultChecked={defaultChecked} />
      <Label htmlFor={id} className="cursor-pointer font-normal">{label}</Label>
    </div>
  );
}

export function CustomPackageForm({ cities }: { cities?: string[] }) {
  const { state, submit } = useLeadSubmit('custom-package', customPackageRequestSchema);
  const [stars, setStars] = React.useState<string>('');
  const [room, setRoom] = React.useState<string>('');
  const cityOptions = cities && cities.length ? cities : DEFAULT_CITIES;
  if (state.status === 'success') {
    return (
      <Success reference={state.reference} title="Request received">
        <p className="max-w-md text-sm text-muted-foreground">A consultant will review your requirements and send a tailored quotation.</p>
      </Success>
    );
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    void submit({
      fullName: str(fd, 'fullName'), email: str(fd, 'email'), phone: str(fd, 'phone'), whatsappNumber: str(fd, 'whatsappNumber'),
      adults: str(fd, 'adults'), children: str(fd, 'children') || '0', infants: str(fd, 'infants') || '0',
      departureCity: str(fd, 'departureCity'), preferredDepartureDate: str(fd, 'preferredDepartureDate'), flexibleDates: bool(fd, 'flexibleDates'),
      nightsMakkah: str(fd, 'nightsMakkah'), nightsMadinah: str(fd, 'nightsMadinah'), hotelStarPreference: stars, roomPreference: room,
      needsVisa: bool(fd, 'needsVisa'), needsFlights: bool(fd, 'needsFlights'), needsTransport: bool(fd, 'needsTransport'), needsZiyarat: bool(fd, 'needsZiyarat'),
      budget: str(fd, 'budget'), notes: str(fd, 'notes'), consent: bool(fd, 'consent') || undefined, website: str(fd, 'website'),
    });
  };
  const errors = state.fieldErrors;

  return (
    <form onSubmit={onSubmit} noValidate className="relative grid gap-6" aria-label="Customized package request form">
      <Honeypot />
      <FieldGroup title="Who is travelling?">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Adults" required error={errors.adults}><Input name="adults" type="number" min={1} max={50} inputMode="numeric" defaultValue={2} /></FormField>
          <FormField label="Children (2-11)" error={errors.children}><Input name="children" type="number" min={0} max={50} inputMode="numeric" defaultValue={0} /></FormField>
          <FormField label="Infants (under 2)" error={errors.infants}><Input name="infants" type="number" min={0} max={50} inputMode="numeric" defaultValue={0} /></FormField>
        </div>
      </FieldGroup>

      <FieldGroup title="When and from where?">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Departure city" error={errors.departureCity}>
            <Input name="departureCity" list="custom-cities" autoComplete="off" maxLength={100} />
          </FormField>
          <datalist id="custom-cities">{cityOptions.map((c) => <option key={c} value={c} />)}</datalist>
          <FormField label="Preferred departure date" error={errors.preferredDepartureDate}><Input name="preferredDepartureDate" type="date" /></FormField>
        </div>
        <ServiceCheck name="flexibleDates" label="My dates are flexible" defaultChecked />
      </FieldGroup>

      <FieldGroup title="Your stay" description="Leave blank if you would like our recommendation.">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nights in Makkah" error={errors.nightsMakkah}><Input name="nightsMakkah" type="number" min={0} max={60} inputMode="numeric" /></FormField>
          <FormField label="Nights in Madinah" error={errors.nightsMadinah}><Input name="nightsMadinah" type="number" min={0} max={60} inputMode="numeric" /></FormField>
          <FormField label="Hotel category" error={errors.hotelStarPreference}>
            {(p) => (
              <Select value={stars} onValueChange={(v) => setStars(v === 'any' ? '' : v)}>
                <SelectTrigger {...p} className="w-full"><SelectValue placeholder="No preference" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">No preference</SelectItem>
                  {[5, 4, 3].map((n) => <SelectItem key={n} value={String(n)}>{n}-star</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </FormField>
          <FormField label="Room type" error={errors.roomPreference}>
            {(p) => (
              <Select value={room} onValueChange={(v) => setRoom(v === 'any' ? '' : v)}>
                <SelectTrigger {...p} className="w-full"><SelectValue placeholder="No preference" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">No preference</SelectItem>
                  {ROOM_OCCUPANCIES.map((r) => <SelectItem key={r} value={r}>{ROOM_LABEL[r] ?? humanize(r)}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </FormField>
        </div>
      </FieldGroup>

      <FieldGroup title="What should be included?">
        <div className="grid gap-3 sm:grid-cols-2">
          <ServiceCheck name="needsVisa" label="Umrah visa" defaultChecked />
          <ServiceCheck name="needsFlights" label="Flights" />
          <ServiceCheck name="needsTransport" label="Transport and transfers" defaultChecked />
          <ServiceCheck name="needsZiyarat" label="Ziyarat tours" />
        </div>
        <FormField label="Approximate total budget (PKR)" error={errors.budget} hint="Optional. Helps us suggest suitable options."><Input name="budget" type="number" min={0} inputMode="numeric" /></FormField>
        <FormField label="Anything else we should know?" error={errors.notes}><Textarea name="notes" rows={4} maxLength={2000} placeholder="Elderly travelers, wheelchair needs, preferred hotels, special occasions…" /></FormField>
      </FieldGroup>

      <FieldGroup title="How can we reach you?">
        <ContactFields errors={errors} />
        <Consent error={errors.consent} />
      </FieldGroup>

      <SubmitBar submitting={state.status === 'submitting'} label="Request my quotation" message={state.status === 'idle' ? state.message : undefined} />
    </form>
  );
}
