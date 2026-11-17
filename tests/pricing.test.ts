import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { siteSchema } from '../src/schemas/site.ts';
import { leadSchema } from '../src/schemas/lead.ts';
import { cateringTotal, money } from '../src/lib/pricing.ts';
import { statusLabel } from '../src/lib/hours.ts';

const data = JSON.parse(readFileSync('src/data/site.json', 'utf8')) as unknown;
const site = siteSchema.parse(data);

test('catering total multiplies headcount by the box price, rounded to cents', () => {
  const [morning, breakfast] = site.catering.boxes;
  assert.equal(cateringTotal(morning, 12), 114);
  assert.equal(cateringTotal(breakfast, 40), 560);
  assert.equal(cateringTotal({ ...morning, pricePerPerson: 9.99 }, 3), 29.97);
  assert.equal(money(114), '$114.00');
});

test('open status follows the shop time zone, not the visitor clock', () => {
  const { hours, timeZone } = site.business;
  // Monday 16 Nov 2026: 12:00 UTC is 7:00 AM in Worcester, 23:00 UTC is 6:00 PM.
  assert.equal(statusLabel(hours, timeZone, new Date('2026-11-16T12:00:00Z')), '🟢 Open Today: 6:30 AM – 5:00 PM');
  assert.equal(statusLabel(hours, timeZone, new Date('2026-11-16T23:00:00Z')), '🔴 Closed now · Today: 6:30 AM – 5:00 PM');
  assert.equal(statusLabel(hours.map(() => null), timeZone), '🔴 Closed today');
});

test('content rejects duplicate IDs, unknown categories, bad prices, hours and time zones', () => {
  const [item] = site.menu.items;
  const withItems = (items: typeof site.menu.items) => ({ ...site, menu: { ...site.menu, items } });
  const withBusiness = (patch: Partial<typeof site.business>) => ({ ...site, business: { ...site.business, ...patch } });
  assert.equal(siteSchema.safeParse(withItems([item, item])).success, false);
  assert.equal(siteSchema.safeParse(withItems([{ ...item, category: 'missing' }])).success, false);
  assert.equal(siteSchema.safeParse(withItems([{ ...item, diets: ['missing'] }])).success, false);
  assert.equal(siteSchema.safeParse(withItems([{ ...item, price: -1 }])).success, false);
  assert.equal(siteSchema.safeParse(withBusiness({ hours: site.business.hours.slice(1) })).success, false);
  assert.equal(siteSchema.safeParse(withBusiness({ hours: site.business.hours.map(() => ({ open: '17:00', close: '06:30' })) })).success, false);
  assert.equal(siteSchema.safeParse(withBusiness({ timeZone: 'Mars/Olympus' })).success, false);
  assert.equal(siteSchema.safeParse({ ...site, banner: { ...site.banner, href: 'javascript:alert(1)' } }).success, false);
});

test('lead validation requires consent, a date and a complete US phone number', () => {
  const lead = { name: 'Test Manager', phone: '(508) 555-0100', email: 'test@example.com', eventDate: '2026-12-01', headcount: 20, boxId: site.catering.boxes[0].id, consent: true, website: '' };
  assert.equal(leadSchema.safeParse(lead).success, true);
  assert.equal(leadSchema.safeParse({ ...lead, consent: false }).success, false);
  assert.equal(leadSchema.safeParse({ ...lead, phone: '123' }).success, false);
  assert.equal(leadSchema.safeParse({ ...lead, eventDate: 'next week' }).success, false);
  assert.equal(leadSchema.safeParse({ ...lead, headcount: 12.5 }).success, false);
});
