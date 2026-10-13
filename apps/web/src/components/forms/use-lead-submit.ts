'use client';

import * as React from 'react';
import type { ZodType } from 'zod';
import type { LeadSubmitResult } from '@umrah/shared';

export type FieldErrors = Record<string, string>;

type State =
  | { status: 'idle' | 'submitting'; fieldErrors: FieldErrors; message?: string }
  | { status: 'success'; reference: string; fieldErrors: FieldErrors };

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/** UTM parameters from the landing URL, attached to the lead for campaign attribution. */
function readUtm(): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
  const sp = new URLSearchParams(window.location.search);
  const pick = (k: string) => sp.get(k)?.slice(0, 150) || undefined;
  return { utmSource: pick('utm_source'), utmMedium: pick('utm_medium'), utmCampaign: pick('utm_campaign') };
}

/**
 * Shared submit logic for public enquiry forms: validates with the same zod schema as the API, posts JSON, and maps
 * server-side validation errors back to fields. Success is only reported when the API confirms the lead was stored.
 */
export function useLeadSubmit<T>(endpoint: 'contact' | 'package-inquiry' | 'custom-package', schema: ZodType<T>) {
  const [state, setState] = React.useState<State>({ status: 'idle', fieldErrors: {} });
  const startedAt = React.useRef<number>(0);
  React.useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const submit = React.useCallback(
    async (payload: Record<string, unknown>) => {
      const body = { ...payload, formStartedAt: startedAt.current || undefined, ...readUtm() };
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        const fieldErrors: FieldErrors = {};
        for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? '_')] ??= issue.message;
        setState({ status: 'idle', fieldErrors, message: 'Please check the highlighted fields.' });
        return;
      }
      setState({ status: 'submitting', fieldErrors: {} });
      try {
        const res = await fetch(`${API}/public/leads/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data = (await res.json()) as LeadSubmitResult;
          setState({ status: 'success', reference: data.reference, fieldErrors: {} });
          return;
        }
        if (res.status === 400) {
          const data = (await res.json().catch(() => null)) as { errors?: { field: string; message: string }[] } | null;
          const fieldErrors: FieldErrors = {};
          for (const e of data?.errors ?? []) fieldErrors[e.field] ??= e.message;
          setState({ status: 'idle', fieldErrors, message: 'Please check the highlighted fields.' });
          return;
        }
        if (res.status === 429) {
          setState({ status: 'idle', fieldErrors: {}, message: 'Too many requests. Please wait a minute and try again.' });
          return;
        }
        if (res.status === 404) {
          setState({ status: 'idle', fieldErrors: {}, message: 'This package or departure is no longer available. Please refresh the page.' });
          return;
        }
        setState({ status: 'idle', fieldErrors: {}, message: 'We could not send your request. Please try again, or contact us by phone or WhatsApp.' });
      } catch {
        setState({ status: 'idle', fieldErrors: {}, message: 'Network problem: your request was not sent. Please check your connection and try again.' });
      }
    },
    [endpoint, schema],
  );

  return { state, submit, reset: () => setState({ status: 'idle', fieldErrors: {} }) };
}
