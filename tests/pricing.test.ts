import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { siteSchema } from '../src/schemas/site.ts';
import { leadSchema } from '../src/schemas/lead.ts';
import { cateringTotal, money } from '../src/lib/pricing.ts';
import { statusLabel } from '../src/lib/hours.ts';
import { calendarFile, minEventDate, orderSummary } from '../src/lib/catering.ts';

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

const lead = { headcount: 20, boxId: site.catering.boxes[0].id, eventDate: '2026-12-01', timeWindowId: site.catering.timeWindows[0].id, fulfillment: 'pickup' as const, address: '', notes: '', name: 'Test Manager', company: '', contact: 'test@example.com', website: '' };
const schema = leadSchema(site.catering, '2026-11-18');
const valid = (patch: object) => schema.safeParse({ ...lead, ...patch }).success;

test('earliest event date is today plus the lead days on the shop calendar', () => {
  // 03:00 UTC on 17 Nov is still 16 Nov in Worcester.
  assert.equal(minEventDate(2, 'America/New_York', new Date('2026-11-17T03:00:00Z')), '2026-11-18');
  assert.equal(minEventDate(2, 'America/New_York', new Date('2026-12-31T15:00:00Z')), '2027-01-02');
});

test('lead accepts an email or a US phone as the single contact', () => {
  assert.equal(valid({}), true);
  assert.equal(valid({ contact: '(508) 555-0100' }), true);
  assert.equal(valid({ contact: 'call me' }), false);
  assert.equal(valid({ contact: '' }), false);
});

test('lead enforces site bounds: headcount, box, window, lead time and delivery address', () => {
  assert.equal(valid({ headcount: site.catering.minHeadcount - 1 }), false);
  assert.equal(valid({ headcount: site.catering.maxHeadcount + 1 }), false);
  assert.equal(valid({ headcount: 12.5 }), false);
  assert.equal(valid({ boxId: 'retired-box' }), false);
  assert.equal(valid({ timeWindowId: '' }), false);
  assert.equal(valid({ eventDate: '2026-11-17' }), false);
  assert.equal(valid({ eventDate: '2026-11-18' }), true);
  assert.equal(valid({ eventDate: 'next week' }), false);
  assert.equal(valid({ fulfillment: 'delivery' }), false);
  assert.equal(valid({ fulfillment: 'delivery', address: '1 Sample Street' }), true);
});

test('order summary and calendar file describe the same order', () => {
  const order = { ...lead, fulfillment: 'delivery' as const, address: '1 Sample Street, Suite 2', notes: '2 vegan; 1 nut-free' };
  const summary = orderSummary(order, site.catering, 'Cafe address');
  assert.equal(summary.line, '20 × Morning Meeting Box');
  assert.equal(summary.total, 190);
  assert.equal(summary.order.some(([, value]) => value === 'Tuesday, December 1, 2026'), true);
  assert.equal(orderSummary(lead, site.catering, 'Cafe address').location, 'Cafe address');
  const ics = calendarFile(order, site.catering, site.business.name, 'Cafe address', new Date('2026-11-16T12:00:00Z'));
  assert.equal(ics.includes('DTSTART:20261201T070000\r\nDTEND:20261201T090000'), true);
  assert.equal(ics.includes('LOCATION:1 Sample Street\\, Suite 2'), true);
  assert.equal(ics.includes('2 vegan\\; 1 nut-free'), true);
  assert.equal(ics.endsWith('END:VCALENDAR'), true);
});
