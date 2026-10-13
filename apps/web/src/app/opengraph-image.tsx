import { ImageResponse } from 'next/og';
import { SITE } from '@/config/site';

export const alt = SITE.name;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Default social-sharing card; pages with their own cover image override it. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          background: 'linear-gradient(135deg, #14573f 0%, #0b2a1f 100%)',
          color: '#f6f1e3',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 40 40">
            <rect width="40" height="40" rx="10" fill="#1c6b4d" />
            <g fill="none" stroke="#dcb35a" strokeWidth="1.6" strokeLinejoin="round">
              <rect x="11" y="11" width="18" height="18" />
              <rect x="11" y="11" width="18" height="18" transform="rotate(45 20 20)" />
            </g>
            <circle cx="20" cy="20" r="3.2" fill="#dcb35a" />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>{SITE.name}</div>
        </div>
        <div style={{ marginTop: 48, fontSize: 68, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2, maxWidth: 950 }}>
          {SITE.tagline}
        </div>
        <div style={{ marginTop: 36, fontSize: 30, color: '#dcb35a' }}>Umrah packages · Hotels · Transport · Visa support</div>
      </div>
    ),
    size,
  );
}
