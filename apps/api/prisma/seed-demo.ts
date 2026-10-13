/**
 * Development/demo data: sample hotels, packages, departures, ziyarat, guides, FAQs and CMS pages.
 * Everything is clearly labelled as sample content and meant to be replaced via the admin CMS.
 * Not run in production (pass --force to override). No customers, bookings, payments, reviews or
 * accreditations are fabricated. Idempotent: safe to re-run.
 */
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { cmsContentSchema, readingMinutes, type CmsBlock, type CmsContent } from '@umrah/shared';
import { PrismaClient, type City, type RoomOccupancy } from '../src/generated/prisma/client';
import { refreshStartingPrice } from '../src/modules/catalog/starting-price';

loadEnv({ path: path.resolve(__dirname, '../../../.env'), quiet: true });

if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
  throw new Error('Refusing to seed demo data in production (use --force to override)');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const SAMPLE_NOTE = 'Sample content for demonstration. Replace it from the admin CMS before going live.';
const content = (...blocks: CmsBlock[]): CmsContent => cmsContentSchema.parse({ version: 1, blocks });
const h2 = (text: string): CmsBlock => ({ type: 'heading', level: 2, text });
const p = (text: string): CmsBlock => ({ type: 'paragraph', text });
const ul = (...items: string[]): CmsBlock => ({ type: 'list', ordered: false, items });
const ol = (...items: string[]): CmsBlock => ({ type: 'list', ordered: true, items });
const note = (text: string, tone: 'info' | 'warning' | 'note' = 'note', title?: string): CmsBlock => ({ type: 'callout', tone, text, ...(title ? { title } : {}) });

const addDays = (d: Date, n: number): Date => new Date(d.getTime() + n * 86_400_000);
const utc = (y: number, m: number, d: number): Date => new Date(Date.UTC(y, m - 1, d));

/* -------------------------------------------------------------------------- */
/* Hotels                                                                     */
/* -------------------------------------------------------------------------- */

interface HotelSeed {
  slug: string;
  name: string;
  city: City;
  stars: number;
  distance: number;
  walking: number;
  double: number; // PKR per night, double room
  amenities: string[];
}

const COMMON_AMENITIES = ['Air conditioning', 'Wi-Fi', 'Prayer mats', 'Lifts', 'Daily housekeeping'];
const HOTELS: HotelSeed[] = [
  { slug: 'demo-haram-view-hotel', name: 'Demo Haram View Hotel', city: 'MAKKAH', stars: 5, distance: 150, walking: 3, double: 45000, amenities: [...COMMON_AMENITIES, 'Haram-view rooms', 'Buffet restaurant', 'Concierge'] },
  { slug: 'demo-ajyad-suites', name: 'Demo Ajyad Suites', city: 'MAKKAH', stars: 4, distance: 600, walking: 9, double: 22000, amenities: [...COMMON_AMENITIES, 'Breakfast buffet'] },
  { slug: 'demo-aziziyah-inn', name: 'Demo Aziziyah Inn', city: 'MAKKAH', stars: 3, distance: 1800, walking: 25, double: 11000, amenities: [...COMMON_AMENITIES, 'Free Haram shuttle'] },
  { slug: 'demo-nabawi-plaza', name: 'Demo Nabawi Plaza', city: 'MADINAH', stars: 5, distance: 100, walking: 2, double: 30000, amenities: [...COMMON_AMENITIES, 'Masjid-view rooms', 'Buffet restaurant', 'Concierge'] },
  { slug: 'demo-markazia-hotel', name: 'Demo Markazia Hotel', city: 'MADINAH', stars: 4, distance: 350, walking: 6, double: 16000, amenities: [...COMMON_AMENITIES, 'Breakfast buffet'] },
  { slug: 'demo-quba-lodge', name: 'Demo Quba Lodge', city: 'MADINAH', stars: 3, distance: 1200, walking: 18, double: 8000, amenities: [...COMMON_AMENITIES, 'Free masjid shuttle'] },
];

async function seedHotels(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const h of HOTELS) {
    const data = {
      name: h.name,
      city: h.city,
      starRating: h.stars,
      distanceToHaramMeters: h.distance,
      walkingMinutes: h.walking,
      summary: `${h.stars}-star hotel about ${h.distance} m from the ${h.city === 'MAKKAH' ? 'Haram' : 'Masjid an-Nabawi'}. ${SAMPLE_NOTE}`,
      description: `Sample listing. ${SAMPLE_NOTE}`,
      amenities: h.amenities,
      checkInTime: '15:00',
      checkOutTime: '12:00',
      status: 'PUBLISHED' as const,
    };
    const hotel = await prisma.hotel.upsert({ where: { slug: h.slug }, update: data, create: { slug: h.slug, ...data } });
    ids.set(h.slug, hotel.id);

    await prisma.hotelRoomType.deleteMany({ where: { hotelId: hotel.id } });
    const rooms: { name: string; occupancy: RoomOccupancy; guests: number; factor: number }[] = [
      { name: 'Double Room', occupancy: 'DOUBLE', guests: 2, factor: 1 },
      { name: 'Triple Room', occupancy: 'TRIPLE', guests: 3, factor: 1.25 },
      { name: 'Quad Room', occupancy: 'QUAD', guests: 4, factor: 1.5 },
    ];
    for (const [i, r] of rooms.entries()) {
      await prisma.hotelRoomType.create({
        data: {
          hotelId: hotel.id,
          name: r.name,
          occupancy: r.occupancy,
          maxGuests: r.guests,
          sortOrder: i,
          amenities: ['Private bathroom', 'Air conditioning', 'TV'],
          rates: { create: { validFrom: utc(2026, 1, 1), validTo: utc(2027, 12, 31), pricePerNight: Math.round(h.double * r.factor), mealPlan: h.stars >= 4 ? 'BREAKFAST' : 'ROOM_ONLY' } },
        },
      });
    }
  }
  return ids;
}

/* -------------------------------------------------------------------------- */
/* Transport & Ziyarat                                                        */
/* -------------------------------------------------------------------------- */

async function seedTransport(): Promise<void> {
  const rows = [
    { name: 'Jeddah Airport to Makkah: private sedan', type: 'SEDAN', serviceKind: 'AIRPORT_TRANSFER', isShared: false, vehicleModel: 'Toyota Camry or similar', capacity: 3, fromLocation: 'Jeddah (JED)', toLocation: 'Makkah', priceBasis: 'PER_VEHICLE', basePrice: 18000, description: 'Door-to-hotel transfer with meet-and-greet at arrivals.' },
    { name: 'Jeddah Airport to Makkah: shared coach', type: 'BUS', serviceKind: 'AIRPORT_TRANSFER', isShared: true, vehicleModel: 'Air-conditioned coach', capacity: 45, fromLocation: 'Jeddah (JED)', toLocation: 'Makkah', priceBasis: 'PER_PERSON', basePrice: 4500, description: 'Scheduled group coach with luggage handling.' },
    { name: 'Makkah to Madinah: Haramain high-speed train', type: 'HARAMAIN_TRAIN', serviceKind: 'INTERCITY', isShared: true, vehicleModel: 'Haramain Express', capacity: null, fromLocation: 'Makkah', toLocation: 'Madinah', priceBasis: 'PER_PERSON', basePrice: 9500, description: 'Economy seats on the high-speed rail link between the Holy Cities.' },
    { name: 'Makkah to Madinah: private SUV', type: 'SUV', serviceKind: 'INTERCITY', isShared: false, vehicleModel: 'GMC Yukon or similar', capacity: 6, fromLocation: 'Makkah', toLocation: 'Madinah', priceBasis: 'PER_VEHICLE', basePrice: 55000, description: 'Private road transfer with a stop for rest along the way.' },
    { name: 'Makkah ziyarat tour: shared coaster', type: 'COASTER', serviceKind: 'ZIYARAT_TOUR', isShared: true, vehicleModel: 'Toyota Coaster', capacity: 20, fromLocation: 'Makkah', toLocation: 'Makkah', priceBasis: 'PER_PERSON', basePrice: 3500, description: 'Guided half-day visit to the main historical sites in Makkah.' },
    { name: 'Madinah ziyarat tour: private van', type: 'VAN', serviceKind: 'ZIYARAT_TOUR', isShared: false, vehicleModel: 'Hyundai H1 or similar', capacity: 7, fromLocation: 'Madinah', toLocation: 'Madinah', priceBasis: 'PER_VEHICLE', basePrice: 22000, description: 'Private guided visit to the main sites in Madinah.' },
  ] as const;
  for (const r of rows) {
    const existing = await prisma.transportService.findFirst({ where: { name: r.name } });
    const data = { ...r, currency: 'PKR', isActive: true };
    if (existing) await prisma.transportService.update({ where: { id: existing.id }, data });
    else await prisma.transportService.create({ data });
  }
}

const ZIYARAT: { slug: string; name: string; city: City; summary: string }[] = [
  { slug: 'jabal-al-noor-ghar-e-hira', name: 'Jabal al-Noor and Ghar-e-Hira', city: 'MAKKAH', summary: 'The mountain containing the Cave of Hira, where the first revelation came to the Prophet ﷺ.' },
  { slug: 'jabal-thawr', name: 'Jabal Thawr', city: 'MAKKAH', summary: 'The mountain with the cave where the Prophet ﷺ and Abu Bakr (RA) sheltered during the Hijrah.' },
  { slug: 'mount-arafat-mina-muzdalifah', name: 'Arafat, Mina and Muzdalifah', city: 'MAKKAH', summary: 'The plains of the Hajj rites, visited outside the Hajj season for reflection.' },
  { slug: 'masjid-aisha-taneem', name: 'Masjid Aisha (Taneem)', city: 'MAKKAH', summary: 'A miqat for pilgrims already in Makkah who wish to perform an additional Umrah.' },
  { slug: 'masjid-quba', name: 'Masjid Quba', city: 'MADINAH', summary: 'The first mosque built in Islam, visited for two rak\'ahs of prayer.' },
  { slug: 'masjid-al-qiblatayn', name: 'Masjid al-Qiblatayn', city: 'MADINAH', summary: 'The mosque of the two qiblas, where the direction of prayer was changed toward the Kaaba.' },
  { slug: 'mount-uhud', name: 'Mount Uhud and the Martyrs of Uhud', city: 'MADINAH', summary: 'The site of the Battle of Uhud and the graves of its martyrs, including Hamza (RA).' },
  { slug: 'jannat-al-baqi', name: 'Jannat al-Baqi', city: 'MADINAH', summary: 'The historic cemetery beside Masjid an-Nabawi where many Companions are buried.' },
];

async function seedZiyarat(): Promise<void> {
  for (const [i, z] of ZIYARAT.entries()) {
    const data = { name: z.name, city: z.city, summary: z.summary, description: `${z.summary} ${SAMPLE_NOTE}`, status: 'PUBLISHED' as const, sortOrder: i };
    await prisma.ziyarat.upsert({ where: { slug: z.slug }, update: data, create: { slug: z.slug, ...data } });
  }
}

/* -------------------------------------------------------------------------- */
/* Packages                                                                   */
/* -------------------------------------------------------------------------- */

interface PackageSeed {
  slug: string;
  title: string;
  category: string;
  tier: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'VIP';
  nightsMakkah: number;
  nightsMadinah: number;
  makkah: string;
  madinah: string;
  meal: 'ROOM_ONLY' | 'BREAKFAST' | 'HALF_BOARD' | 'FULL_BOARD';
  flights: boolean;
  ziyarat: boolean;
  featured: boolean;
  /** Per-adult PKR prices by occupancy. */
  prices: Partial<Record<RoomOccupancy, number>>;
  /** Fixed departures (ISO dates); otherwise rolling dates from today. */
  fixedDepartures?: string[];
  summary: string;
}

const PACKAGES: PackageSeed[] = [
  { slug: 'economy-umrah-10-days', title: 'Economy Umrah, 10 Days', category: 'economy-umrah', tier: 'ECONOMY', nightsMakkah: 5, nightsMadinah: 4, makkah: 'demo-aziziyah-inn', madinah: 'demo-quba-lodge', meal: 'ROOM_ONLY', flights: false, ziyarat: false, featured: false, prices: { DOUBLE: 285000, TRIPLE: 265000, QUAD: 245000 }, summary: 'Essential Umrah with visa, shared transfers and 3-star stays with shuttle service to the Holy Mosques.' },
  { slug: 'standard-umrah-12-days', title: 'Standard Umrah, 12 Days', category: 'group-umrah', tier: 'STANDARD', nightsMakkah: 6, nightsMadinah: 5, makkah: 'demo-ajyad-suites', madinah: 'demo-markazia-hotel', meal: 'BREAKFAST', flights: true, ziyarat: true, featured: true, prices: { DOUBLE: 395000, TRIPLE: 365000, QUAD: 340000 }, summary: 'Return flights, 4-star hotels within walking distance, breakfast and guided ziyarat in both cities.' },
  { slug: 'premium-umrah-14-days', title: 'Premium Umrah, 14 Days', category: 'premium-umrah', tier: 'PREMIUM', nightsMakkah: 8, nightsMadinah: 5, makkah: 'demo-haram-view-hotel', madinah: 'demo-nabawi-plaza', meal: 'BREAKFAST', flights: true, ziyarat: true, featured: true, prices: { DOUBLE: 585000, TRIPLE: 545000, QUAD: 510000 }, summary: 'Five-star stays steps from the Haram and Masjid an-Nabawi, flights, private transfers and ziyarat.' },
  { slug: 'family-umrah-12-days', title: 'Family Umrah, 12 Days', category: 'family-umrah', tier: 'STANDARD', nightsMakkah: 6, nightsMadinah: 5, makkah: 'demo-ajyad-suites', madinah: 'demo-markazia-hotel', meal: 'HALF_BOARD', flights: true, ziyarat: true, featured: false, prices: { TRIPLE: 375000, QUAD: 345000, QUINT: 325000 }, summary: 'Family-sized rooms, half-board meals, flights and a relaxed schedule suited to children and elders.' },
  { slug: 'group-umrah-14-days', title: 'Group Umrah, 14 Days', category: 'group-umrah', tier: 'STANDARD', nightsMakkah: 8, nightsMadinah: 5, makkah: 'demo-ajyad-suites', madinah: 'demo-markazia-hotel', meal: 'BREAKFAST', flights: true, ziyarat: true, featured: false, prices: { DOUBLE: 420000, TRIPLE: 390000, QUAD: 365000 }, summary: 'Travel with a guided group and resident scholar, with 4-star hotels and flights included.' },
  { slug: 'ramadan-vip-umrah-15-days', title: 'Ramadan VIP Umrah, 15 Days', category: 'ramadan-umrah', tier: 'VIP', nightsMakkah: 9, nightsMadinah: 5, makkah: 'demo-haram-view-hotel', madinah: 'demo-nabawi-plaza', meal: 'FULL_BOARD', flights: true, ziyarat: true, featured: true, prices: { DOUBLE: 890000, TRIPLE: 830000 }, fixedDepartures: ['2027-02-07', '2027-02-21'], summary: 'Spend Ramadan in the Holy Cities with premium rooms, full-board meals with iftar and suhoor, and private transfers.' },
];

const PKG_INCLUSIONS = ['Umrah visa processing', 'Accommodation as listed', 'Airport and intercity transfers', 'Guidance on rituals from our team'];
const PKG_EXCLUSIONS = ['Personal expenses', 'Laundry', 'Anything not listed in the inclusions', 'Optional extra nights'];

function itineraryFor(pkg: PackageSeed) {
  const days: { dayNumber: number; title: string; description: string; city: City }[] = [];
  let d = 1;
  days.push({ dayNumber: d++, title: 'Departure and arrival in Jeddah', description: 'Depart from your city and arrive in Jeddah. After immigration, transfer to Makkah and check in.', city: 'JEDDAH' });
  days.push({ dayNumber: d++, title: 'Perform Umrah', description: 'Assume Ihram, perform Tawaf and Sa\'i, and complete Umrah with Halq or Taqsir, guided by our team.', city: 'MAKKAH' });
  for (let i = 0; i < pkg.nightsMakkah - 2; i++) {
    days.push({ dayNumber: d++, title: i === 1 && pkg.ziyarat ? 'Makkah ziyarat' : 'Worship at the Haram', description: i === 1 && pkg.ziyarat ? 'Guided visit to the historical sites of Makkah.' : 'Free days for prayers, Tawaf and reflection.', city: 'MAKKAH' });
  }
  days.push({ dayNumber: d++, title: 'Travel to Madinah', description: 'Check out and travel to Madinah, then check in near Masjid an-Nabawi.', city: 'MADINAH' });
  for (let i = 0; i < pkg.nightsMadinah - 1; i++) {
    days.push({ dayNumber: d++, title: i === 1 && pkg.ziyarat ? 'Madinah ziyarat' : 'Worship at Masjid an-Nabawi', description: i === 1 && pkg.ziyarat ? 'Guided visit to Quba, Qiblatayn, Uhud and other sites.' : 'Prayers, salutations at the Rawdah (subject to permit slots) and personal worship.', city: 'MADINAH' });
  }
  days.push({ dayNumber: d, title: 'Return journey', description: 'Transfer to the airport for your return flight.', city: 'MADINAH' });
  return days;
}

async function seedPackages(hotelIds: Map<string, string>): Promise<void> {
  const categories = await prisma.packageCategory.findMany();
  const transport = await prisma.transportService.findMany();
  const ziyarat = await prisma.ziyarat.findMany();
  const now = new Date();

  for (const [index, pkg] of PACKAGES.entries()) {
    const durationDays = pkg.nightsMakkah + pkg.nightsMadinah + 1;
    const data = {
      title: pkg.title,
      subtitle: 'Sample package (demo data)',
      summary: pkg.summary,
      description: `${pkg.summary}\n\n${SAMPLE_NOTE}`,
      categoryId: categories.find((c) => c.slug === pkg.category)?.id,
      tier: pkg.tier,
      durationDays,
      nightsMakkah: pkg.nightsMakkah,
      nightsMadinah: pkg.nightsMadinah,
      departureCities: ['Karachi', 'Lahore', 'Islamabad'],
      mealPlan: pkg.meal,
      inclusions: [...PKG_INCLUSIONS, ...(pkg.flights ? ['Return economy flights'] : []), ...(pkg.ziyarat ? ['Guided ziyarat in Makkah and Madinah'] : []), ...(pkg.meal !== 'ROOM_ONLY' ? [`Meals: ${pkg.meal.replace('_', ' ').toLowerCase()}`] : [])],
      exclusions: [...PKG_EXCLUSIONS, ...(pkg.flights ? [] : ['International flights'])],
      terms: 'Sample terms. Prices are per person and subject to availability at the time of booking.',
      visaIncluded: true,
      flightIncluded: pkg.flights,
      transportIncluded: true,
      ziyaratIncluded: pkg.ziyarat,
      depositType: 'PERCENTAGE' as const,
      depositValue: 25,
      isFeatured: pkg.featured,
      sortOrder: index,
      status: 'PUBLISHED' as const,
      publishedAt: addDays(now, -30 + index),
    };
    const record = await prisma.package.upsert({ where: { slug: pkg.slug }, update: data, create: { slug: pkg.slug, ...data } });

    // Rebuild child rows so re-running stays idempotent.
    await prisma.$transaction([
      prisma.packageHotel.deleteMany({ where: { packageId: record.id } }),
      prisma.packageItineraryDay.deleteMany({ where: { packageId: record.id } }),
      prisma.packageTransport.deleteMany({ where: { packageId: record.id } }),
      prisma.packageZiyarat.deleteMany({ where: { packageId: record.id } }),
      prisma.packageDeparture.deleteMany({ where: { packageId: record.id, bookings: { none: {} } } }),
    ]);

    await prisma.packageHotel.createMany({
      data: [
        { packageId: record.id, hotelId: hotelIds.get(pkg.makkah)!, city: 'MAKKAH', nights: pkg.nightsMakkah, sortOrder: 0 },
        { packageId: record.id, hotelId: hotelIds.get(pkg.madinah)!, city: 'MADINAH', nights: pkg.nightsMadinah, sortOrder: 1 },
      ],
    });
    await prisma.packageItineraryDay.createMany({ data: itineraryFor(pkg).map((i) => ({ ...i, packageId: record.id })) });
    await prisma.packageTransport.createMany({
      data: transport.filter((t) => ['AIRPORT_TRANSFER', 'INTERCITY'].includes(t.serviceKind) && (pkg.tier === 'ECONOMY' ? t.isShared : true)).map((t) => ({ packageId: record.id, transportServiceId: t.id })),
    });
    if (pkg.ziyarat) await prisma.packageZiyarat.createMany({ data: ziyarat.map((z) => ({ packageId: record.id, ziyaratId: z.id })) });

    const dates = pkg.fixedDepartures?.map((s) => new Date(`${s}T00:00:00.000Z`)) ?? [21, 50, 85, 120].map((n) => addDays(utc(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate()), n + index * 2));
    for (const [i, departureDate] of dates.entries()) {
      const bump = 1 + i * 0.03; // later departures cost slightly more
      await prisma.packageDeparture.create({
        data: {
          packageId: record.id,
          departureDate,
          returnDate: addDays(departureDate, durationDays - 1),
          departureCity: ['Karachi', 'Lahore', 'Islamabad'][i % 3],
          airline: pkg.flights ? 'Sample Airline' : null,
          seatsTotal: 45,
          seatsReserved: i === 0 ? 38 + index : 8 + i * 4,
          bookingCutoffDate: addDays(departureDate, -14),
          status: 'OPEN',
          prices: {
            create: Object.entries(pkg.prices).map(([occupancy, adult]) => ({
              occupancy: occupancy as RoomOccupancy,
              adultPrice: Math.round(((adult as number) * bump) / 1000) * 1000,
              childPrice: Math.round(((adult as number) * bump * 0.85) / 1000) * 1000,
              infantPrice: 45000,
            })),
          },
        },
      });
    }
    await refreshStartingPrice(prisma, record.id);
  }
}

/* -------------------------------------------------------------------------- */
/* CMS: pages, guides, blog, FAQs, settings                                   */
/* -------------------------------------------------------------------------- */

const POLICY_NOTE = 'This is a template placeholder, not legal text. Replace it with your agency\'s own policy, reviewed by your legal advisor, before launch.';

async function seedPages(): Promise<void> {
  const pages: { slug: string; title: string; type: 'STANDARD' | 'POLICY'; excerpt: string; body: CmsContent }[] = [
    {
      slug: 'about',
      title: 'About us',
      type: 'STANDARD',
      excerpt: 'Who we are and how we look after pilgrims from first enquiry to safe return.',
      body: content(
        note(SAMPLE_NOTE, 'note', 'Sample content'),
        h2('Our approach'),
        p('We organise Umrah journeys end to end: visa processing, accommodation, transport and on-the-ground guidance, so you can focus on your worship.'),
        h2('What you can expect'),
        ul('A named consultant from enquiry to return', 'Transparent pricing with deposits and clear payment schedules', 'Your documents kept in secure, private storage', 'Updates by email and WhatsApp at every step'),
      ),
    },
    {
      slug: 'visa-information',
      title: 'Umrah visa information',
      type: 'STANDARD',
      excerpt: 'Typical requirements, the process and timelines for an Umrah visa.',
      body: content(
        note('Visa rules and processing times change. Our visa team confirms the current requirements for your booking.', 'warning', 'Always confirm current rules'),
        h2('Typical documents'),
        ul('Passport valid for at least six months after your return date', 'Recent passport-style photograph with a plain background', 'Copy of CNIC or national ID', 'Vaccination certificates as currently required (our team will advise)', 'For women under the age required to travel alone: mahram details and proof of relationship'),
        h2('How it works'),
        { type: 'steps', items: [
          { title: 'Book your package', text: 'Choose a departure and pay your deposit to confirm.' },
          { title: 'Upload your documents', text: 'Add each traveler\'s passport, photo and ID in your secure customer portal.' },
          { title: 'We review and submit', text: 'Our visa officers check every document and file the application.' },
          { title: 'Track your visa', text: 'You see the status change in your portal and receive notifications.' },
        ] },
        note(SAMPLE_NOTE),
      ),
    },
    ...(
      [
        ['terms', 'Terms and conditions'],
        ['privacy', 'Privacy policy'],
        ['refund-cancellation', 'Refund and cancellation policy'],
        ['payment', 'Payment policy'],
        ['cookies', 'Cookie policy'],
      ] as const
    ).map(([slug, title]) => ({
      slug,
      title,
      type: 'POLICY' as const,
      excerpt: `${title} (template).`,
      body: content(note(POLICY_NOTE, 'warning', 'Placeholder'), h2('Overview'), p('Your policy text goes here.')),
    })),
  ];
  for (const pg of pages) {
    const data = { title: pg.title, type: pg.type, excerpt: pg.excerpt, content: pg.body, status: 'PUBLISHED' as const, publishedAt: new Date() };
    await prisma.page.upsert({ where: { slug: pg.slug }, update: data, create: { slug: pg.slug, ...data } });
  }
}

interface PostSeed { slug: string; type: 'GUIDE' | 'BLOG'; category: string; title: string; excerpt: string; tags: string[]; body: CmsBlock[]; daysAgo: number }

const SCHOLAR_NOTE = 'Rulings can differ between schools of thought. Follow the guidance of your group\'s scholar and use this guide as a general orientation.';

const POSTS: PostSeed[] = [
  {
    slug: 'first-time-umrah-guide', type: 'GUIDE', category: 'umrah-guide', daysAgo: 60, tags: ['first-time', 'rituals'],
    title: 'Umrah for first-time travelers: the complete overview',
    excerpt: 'A calm walk-through of the four rites of Umrah and what to prepare before you leave.',
    body: [
      p('Umrah is a visit to Makkah that can be performed at any time of the year. It has four essential parts, which you will perform in this order.'),
      { type: 'steps', items: [
        { title: 'Ihram', text: 'Enter the sacred state at the miqat with the intention for Umrah and recite the Talbiyah.' },
        { title: 'Tawaf', text: 'Circle the Kaaba seven times, beginning and ending at the Black Stone.' },
        { title: 'Sa\'i', text: 'Walk seven laps between the hills of Safa and Marwa.' },
        { title: 'Halq or Taqsir', text: 'Shave or trim the hair to complete Umrah and leave the state of Ihram.' },
      ] },
      note(SCHOLAR_NOTE, 'note'),
      { type: 'cta', label: 'See our Umrah packages', href: '/packages', text: 'Every package includes guidance from our team.' },
    ],
  },
  {
    slug: 'ihram-guide', type: 'GUIDE', category: 'umrah-guide', daysAgo: 59, tags: ['ihram'],
    title: 'Ihram explained: clothing, intention and what to avoid',
    excerpt: 'How to enter Ihram correctly, what to wear and the rules to observe while in the state of Ihram.',
    body: [
      h2('Clothing'),
      ul('Men wear two plain, unstitched white sheets: one wrapped around the waist and one draped over the shoulders.', 'Women wear modest, loose clothing of their choice that covers the body; the face and hands are left uncovered.'),
      h2('The intention and Talbiyah'),
      p('At the miqat, make the intention for Umrah and begin reciting the Talbiyah, continuing until you begin Tawaf.'),
      { type: 'quote', text: 'Labbaik Allahumma labbaik, labbaika la shareeka laka labbaik, innal hamda wan-ni\'mata laka wal-mulk, la shareeka lak.' },
      h2('While in Ihram, avoid'),
      ul('Cutting hair or nails', 'Wearing perfume or scented products', 'Hunting or harming animals', 'Marital relations', 'Arguing and quarrelling', 'For men: covering the head and wearing stitched garments'),
      note(SCHOLAR_NOTE, 'note'),
    ],
  },
  {
    slug: 'tawaf-guide', type: 'GUIDE', category: 'umrah-guide', daysAgo: 58, tags: ['tawaf'],
    title: 'How to perform Tawaf',
    excerpt: 'The seven circuits around the Kaaba, step by step.',
    body: [
      ol('Make wudu and approach the Black Stone corner, aligning with it so that the Kaaba is on your left.', 'Begin each circuit at the line of the Black Stone and say "Bismillahi Allahu Akbar". Gesture toward it; do not push to kiss it.', 'Complete seven circuits counter-clockwise, ending at the Black Stone line.', 'Men uncover the right shoulder (idtiba) for the whole Tawaf, and walk briskly (raml) in the first three circuits when possible.', 'Pray two rak\'ahs behind the Station of Ibrahim if space allows, or anywhere in the Haram.', 'Drink Zamzam water.'),
      note('The Haram can be very crowded. Stay with your group, protect your belongings, and be considerate of elders and families.', 'info'),
      note(SCHOLAR_NOTE, 'note'),
    ],
  },
  {
    slug: 'saee-guide', type: 'GUIDE', category: 'umrah-guide', daysAgo: 57, tags: ['saee'],
    title: 'Sa\'i between Safa and Marwa',
    excerpt: 'Seven laps between the hills of Safa and Marwa, and how to complete Umrah.',
    body: [
      ol('Go to Safa and face the Kaaba, making dua.', 'Walk toward Marwa. This is the first lap. Men jog lightly between the green markers.', 'Finish at Marwa, then return to Safa for the second lap. Continue until the seventh lap ends at Marwa.', 'Complete Umrah by shaving the head (Halq) or trimming the hair (Taqsir). Women trim a fingertip length from the ends.'),
      note('Wheelchairs are available for Sa\'i. Ask your guide to arrange one if needed.', 'info'),
      note(SCHOLAR_NOTE, 'note'),
    ],
  },
  {
    slug: 'umrah-packing-list', type: 'GUIDE', category: 'umrah-guide', daysAgo: 56, tags: ['packing'],
    title: 'Umrah packing list',
    excerpt: 'What to bring, what to leave at home and how to pack light.',
    body: [
      h2('Documents'),
      ul('Passport and visa copies', 'Booking confirmation and vouchers', 'Emergency contacts and any medical prescriptions'),
      h2('Clothing and worship'),
      ul('Two sets of Ihram (men) and comfortable modest clothing', 'Slip-on, comfortable footwear and a small bag for shoes', 'Prayer mat, dua book and a small bag for the Haram', 'Unscented soap and toiletries for Ihram'),
      h2('Health and comfort'),
      ul('Personal medication in original packaging', 'Sun protection, reusable water bottle and electrolyte sachets', 'Power bank and a universal adapter'),
    ],
  },
  {
    slug: 'umrah-travel-preparation-checklist', type: 'GUIDE', category: 'umrah-guide', daysAgo: 55, tags: ['preparation'],
    title: 'Travel preparation checklist',
    excerpt: 'What to arrange in the weeks before you travel.',
    body: [
      ol('Check your passport validity and arrange required vaccinations.', 'Upload all traveler documents to your portal and respond to any review requests.', 'Pay any remaining balance by the due date shown in your booking.', 'Read your travel itinerary and save your group leader\'s contact details.', 'Exchange a small amount of local currency and notify your bank about travel.', 'Learn the key duas and rites so the journey feels familiar.'),
    ],
  },
  {
    slug: 'best-time-to-perform-umrah', type: 'BLOG', category: 'travel-tips', daysAgo: 20, tags: ['planning'],
    title: 'When is the best time to perform Umrah?',
    excerpt: 'How seasons, school holidays and Ramadan affect crowds, weather and prices.',
    body: [
      p('Umrah can be performed all year, but the experience and the cost change with the calendar.'),
      ul('**Ramadan** is the most spiritually special and also the busiest and most expensive period.', '**School holidays** raise demand for family packages, so book early.', '**Outside peak periods** you will usually find quieter rites and better availability near the Haram.'),
      note('Weather in Makkah and Madinah is hot for much of the year. Plan rest between worship and drink plenty of water.', 'info'),
    ],
  },
  {
    slug: 'choosing-a-hotel-near-the-haram', type: 'BLOG', category: 'travel-tips', daysAgo: 10, tags: ['hotels'],
    title: 'How to choose a hotel near the Haram',
    excerpt: 'Distance is not the only thing that matters: what to look at before you book.',
    body: [
      ul('**Walking time**, not just metres: some routes involve slopes and crowded roads at prayer times.', '**Lifts and prayer-time waiting**: tall hotels can have long waits around Fajr and Isha.', '**Shuttle service**: useful for elders if the hotel is farther away.', '**Room type**: a quad room is cheaper per person but needs flexibility from everyone sharing.'),
    ],
  },
];

async function seedPosts(): Promise<void> {
  const cats = await prisma.postCategory.findMany();
  for (const post of POSTS) {
    const body = content(...post.body);
    const data = {
      type: post.type,
      title: post.title,
      excerpt: post.excerpt,
      content: body,
      categoryId: cats.find((c) => c.slug === post.category)?.id,
      tags: post.tags,
      readingMinutes: readingMinutes(body),
      status: 'PUBLISHED' as const,
      publishedAt: addDays(new Date(), -post.daysAgo),
    };
    await prisma.post.upsert({ where: { slug: post.slug }, update: data, create: { slug: post.slug, ...data } });
  }
}

const FAQS: [string, string, string][] = [
  ['general', 'What is the difference between Umrah and Hajj?', 'Hajj is an obligatory pilgrimage performed once a year during specific days of Dhul Hijjah. Umrah is a shorter, voluntary pilgrimage that can be performed at any time of the year.'],
  ['general', 'Can I travel with my family?', 'Yes. Family packages offer larger rooms and a relaxed schedule. Add every traveler to one booking and we keep their documents and visas together.'],
  ['general', 'Do you provide guidance on the rituals?', 'Our team briefs you before departure and guides you on the rites. Rulings can differ between schools of thought, so follow your group\'s scholar.'],
  ['booking', 'How do I book a package?', 'Pick a package and departure, tell us who is travelling and your room preference, upload documents, and pay the deposit. Your booking is confirmed once the deposit is verified.'],
  ['booking', 'Can I customise a package?', 'Yes. Use the customised package form to tell us your preferred dates, hotels, transport and budget, and we will send you a quotation.'],
  ['booking', 'Can I change or cancel my booking?', 'Changes and cancellations follow our refund and cancellation policy. Contact us as early as possible so we can help.'],
  ['payments', 'Can I pay in installments?', 'Yes. A deposit confirms your booking and the balance follows the payment schedule shown in your portal and on your invoice.'],
  ['payments', 'Which payment methods do you accept?', 'We accept the payment methods listed on your payment page, including bank transfer. Offline payments are confirmed once our finance team verifies them.'],
  ['visa', 'Which documents are needed for the visa?', 'Typically a passport valid for at least six months, a recent photograph and a national ID. Our visa team confirms the current requirements for your booking.'],
  ['visa', 'How long does visa processing take?', 'Processing times vary by season and authority. We submit applications as soon as your documents are approved and you can track progress in your portal.'],
  ['visa', 'Can women travel without a mahram?', 'Rules depend on age and current regulations. Contact our visa team for the requirements that apply to you.'],
  ['travel', 'Are meals included?', 'Each package page lists the meal plan, from room-only to full board.'],
  ['travel', 'What should I pack?', 'See our packing list in the Umrah guide for documents, clothing and health essentials.'],
  ['travel', 'Is transport between the cities included?', 'Packages include the airport and intercity transfers listed on the package page, such as the Haramain train or private road transfers.'],
];

async function seedFaqs(): Promise<void> {
  await prisma.faq.deleteMany({});
  await prisma.faq.createMany({ data: FAQS.map(([category, question, answer], i) => ({ category, question, answer, sortOrder: i })) });
}

async function seedSettings(): Promise<void> {
  const demo = [
    ['company.name', 'Umrah Travel'],
    ['company.officeHours', 'Mon-Sat, 9:00-18:00 (sample)'],
  ] as const;
  for (const [key, value] of demo) {
    await prisma.setting.update({ where: { key }, data: { value } }).catch(() => undefined);
  }
}

async function main(): Promise<void> {
  const hotelIds = await seedHotels();
  await seedTransport();
  await seedZiyarat();
  await seedPackages(hotelIds);
  await seedPages();
  await seedPosts();
  await seedFaqs();
  await seedSettings();
  console.log('✓ Demo data seeded (hotels, transport, ziyarat, 6 packages, pages, guides, blog, FAQs)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
