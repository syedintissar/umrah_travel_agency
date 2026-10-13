import 'server-only';

/**
 * Server-side client for the NestJS public API. Runs only in Server Components / route handlers, so the internal
 * API URL and key never reach the browser. Responses are cached by Next's data cache and revalidated periodically.
 */

const BASE_URL = (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly path: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface FetchOptions {
  /** Seconds before the cached response is considered stale. */
  revalidate?: number;
  tags?: string[];
}

export async function apiGet<T>(path: string, { revalidate = 60, tags }: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  // Lets SSR traffic bypass the per-IP rate limit (all pages would otherwise share the web server's IP).
  if (process.env.INTERNAL_API_KEY) headers['x-internal-key'] = process.env.INTERNAL_API_KEY;

  const request = () => fetch(`${BASE_URL}${path}`, { headers, next: { revalidate, ...(tags ? { tags } : {}) } });
  let res: Response;
  try {
    res = await request();
  } catch {
    // A reused keep-alive connection may have been closed by the server; GETs are safe to retry once.
    try {
      res = await request();
    } catch {
      throw new ApiError(503, 'The service is temporarily unavailable', path);
    }
  }
  if (!res.ok) throw new ApiError(res.status, `API ${res.status} for ${path}`, path);
  return (await res.json()) as T;
}

/** Like `apiGet` but returns `null` on 404 so pages can call `notFound()`. */
export async function apiGetOrNull<T>(path: string, options?: FetchOptions): Promise<T | null> {
  try {
    return await apiGet<T>(path, options);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

type QsValue = string | number | boolean | (string | number)[] | undefined | null;

export function qs(params: Record<string, QsValue>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    sp.set(k, Array.isArray(v) ? v.join(',') : String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}
