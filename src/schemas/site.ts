import { z } from 'zod';
import { cateringSchema } from './catering.ts';
import { id, image, price, span, text } from './primitives.ts';

const link = z.object({ label: text, href: z.string().regex(/^#[a-z-]+$/) });
const phone = z.string().regex(/^\+1\d{10}$/);
const named = z.object({ id, name: text });
export const siteSchema = z.object({
  demoMode: z.boolean(),
  demoBanner: z.boolean(),
  banner: z.object({ text, shortText: text, href: z.url().refine(value => value.startsWith('https://')), dismissLabel: text }),
  business: z.object({
    name: text, shortName: text, descriptor: text, phone, phoneDisplay: text, email: z.email(),
    street: text, city: text, region: z.string().length(2), postalCode: z.string().regex(/^\d{5}$/), serviceArea: text,
    timeZone: z.string().refine(value => Intl.supportedValuesOf('timeZone').includes(value), 'Unknown time zone.'),
    hours: z.array(span.nullable()).length(7), // Sunday first; null = closed
    indicators: z.array(z.object({ id, label: text, active: z.boolean() })).max(4),
  }),
  seo: z.object({ title: text, description: text }),
  nav: z.array(link).min(1).max(6),
  hero: z.object({
    eyebrow: text, heading: text, description: text, primaryCta: text, secondaryCta: text, note: text, image,
    specialsLabel: text, specialsCategory: id, specialties: z.array(text).min(1).max(8),
  }),
  intro: z.object({ label: text, heading: text, description: text, link: text, photos: z.array(image.extend({ item: id })).max(4) }),
  menu: z.object({
    label: text, heading: text, description: text, note: text,
    categories: z.array(named).min(1).max(8), diets: z.array(named).max(6),
    items: z.array(z.object({ id, name: text, description: text, price, category: id, diets: z.array(id).max(6) })).min(1).max(80),
  }),
  catering: cateringSchema,
  reviews: z.object({ label: text, heading: text, disclaimer: text, items: z.array(z.object({ quote: text, name: text, detail: text, stars: z.number().int().min(1).max(5) })).max(8) }),
  faq: z.object({ heading: text, items: z.array(z.object({ question: text, answer: text })).max(10) }),
  visit: z.object({ label: text, heading: text, description: text, directionsCta: text, image }),
  footer: z.object({ description: text, copyright: text, demoNotice: text }),
}).superRefine((site, ctx) => {
  const issue = (path: PropertyKey[], message: string) => ctx.addIssue({ code: 'custom', path, message });
  const lists = { categories: site.menu.categories, diets: site.menu.diets, items: site.menu.items, boxes: site.catering.boxes, timeWindows: site.catering.timeWindows, indicators: site.business.indicators };
  for (const [key, list] of Object.entries(lists)) {
    if (new Set(list.map(item => item.id)).size !== list.length) issue([key], 'IDs must be unique.');
  }
  const categories = new Set(site.menu.categories.map(item => item.id));
  const diets = new Set(site.menu.diets.map(item => item.id));
  site.menu.items.forEach((item, index) => {
    if (!categories.has(item.category)) issue(['menu', 'items', index, 'category'], 'Unknown menu category.');
    if (item.diets.some(diet => !diets.has(diet))) issue(['menu', 'items', index, 'diets'], 'Unknown dietary tag.');
  });
  site.intro.photos.forEach((photo, index) => {
    if (!site.menu.items.some(item => item.id === photo.item)) issue(['intro', 'photos', index, 'item'], 'Unknown menu item.');
  });
  if (!categories.has(site.hero.specialsCategory)) issue(['hero', 'specialsCategory'], 'Unknown menu category.');
  if (site.catering.minHeadcount > site.catering.maxHeadcount) issue(['catering', 'minHeadcount'], 'Minimum headcount exceeds the maximum.');
});
export type Site = z.infer<typeof siteSchema>;
export type Hours = Site['business']['hours'];
