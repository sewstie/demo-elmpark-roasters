import { z } from 'zod';

const text = z.string().trim().min(1).max(1000);
const id = z.string().regex(/^[a-z][a-z0-9-]{0,39}$/);
const link = z.object({ label: text, href: z.string().regex(/^#[a-z-]+$/) });
const phone = z.string().regex(/^\+1\d{10}$/);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const price = z.number().min(0.01).max(50000);
const named = z.object({ id, name: text });
const day = z.object({ open: time, close: time }).refine(value => value.open < value.close, 'Opening time must be before closing time.');
export const siteSchema = z.object({
  demo: z.boolean(),
  demoBanner: z.boolean(),
  banner: z.object({ text, href: z.url().refine(value => value.startsWith('https://')) }),
  business: z.object({
    name: text, shortName: text, descriptor: text, phone, phoneDisplay: text, email: z.email(),
    street: text, city: text, region: z.string().length(2), postalCode: z.string().regex(/^\d{5}$/), serviceArea: text,
    timeZone: z.string().refine(value => Intl.supportedValuesOf('timeZone').includes(value), 'Unknown time zone.'),
    hours: z.array(day.nullable()).length(7), // Sunday first; null = closed
    indicators: z.array(z.object({ id, label: text, active: z.boolean() })).max(4),
  }),
  seo: z.object({ title: text, description: text }),
  nav: z.array(link).min(1).max(6),
  hero: z.object({
    eyebrow: text, heading: text, description: text, primaryCta: text, secondaryCta: text, note: text,
    specialsLabel: text, specialsCategory: id, specialties: z.array(text).min(1).max(8),
  }),
  intro: z.object({ label: text, heading: text, description: text, link: text }),
  menu: z.object({
    label: text, heading: text, description: text, note: text,
    categories: z.array(named).min(1).max(8), diets: z.array(named).max(6),
    items: z.array(z.object({ id, name: text, description: text, price, category: id, diets: z.array(id).max(6) })).min(1).max(80),
  }),
  catering: z.object({
    label: text, heading: text, description: text, note: text, cta: text, privacy: text, success: text, error: text,
    minHeadcount: z.number().int().min(1).max(1000), maxHeadcount: z.number().int().min(1).max(1000),
    boxes: z.array(z.object({ id, name: text, description: text, pricePerPerson: price })).min(1).max(6),
  }),
  reviews: z.object({ label: text, heading: text, disclaimer: text, items: z.array(z.object({ quote: text, name: text, detail: text, stars: z.number().int().min(1).max(5) })).max(8) }),
  faq: z.object({ heading: text, items: z.array(z.object({ question: text, answer: text })).max(10) }),
  visit: z.object({ label: text, heading: text, description: text, directionsCta: text }),
  footer: z.object({ description: text, copyright: text, demoNotice: text }),
}).superRefine((site, ctx) => {
  const issue = (path: PropertyKey[], message: string) => ctx.addIssue({ code: 'custom', path, message });
  const lists = { categories: site.menu.categories, diets: site.menu.diets, items: site.menu.items, boxes: site.catering.boxes, indicators: site.business.indicators };
  for (const [key, list] of Object.entries(lists)) {
    if (new Set(list.map(item => item.id)).size !== list.length) issue([key], 'IDs must be unique.');
  }
  const categories = new Set(site.menu.categories.map(item => item.id));
  const diets = new Set(site.menu.diets.map(item => item.id));
  site.menu.items.forEach((item, index) => {
    if (!categories.has(item.category)) issue(['menu', 'items', index, 'category'], 'Unknown menu category.');
    if (item.diets.some(diet => !diets.has(diet))) issue(['menu', 'items', index, 'diets'], 'Unknown dietary tag.');
  });
  if (!categories.has(site.hero.specialsCategory)) issue(['hero', 'specialsCategory'], 'Unknown menu category.');
  if (site.catering.minHeadcount > site.catering.maxHeadcount) issue(['catering', 'minHeadcount'], 'Minimum headcount exceeds the maximum.');
});
export type Site = z.infer<typeof siteSchema>;
export type Box = Site['catering']['boxes'][number];
export type Hours = Site['business']['hours'];
