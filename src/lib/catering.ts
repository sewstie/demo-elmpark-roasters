import type { Catering } from '../schemas/catering.ts';
import type { Lead } from '../schemas/lead.ts';
import { cateringTotal } from './pricing.ts';
import { range } from './hours.ts';

export type Row = [label: string, value: string];

// Earliest bookable date (YYYY-MM-DD) on the shop's calendar, not the visitor's.
export const minEventDate = (leadDays: number, timeZone: string, now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now.getTime() + leadDays * 86_400_000));

const longDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

export function orderSummary(lead: Lead, catering: Catering, cafeAddress: string) {
  const { fields } = catering;
  const box = catering.boxes.find(item => item.id === lead.boxId) ?? catering.boxes[0];
  const window = catering.timeWindows.find(item => item.id === lead.timeWindowId);
  const location = lead.fulfillment === 'delivery' ? lead.address : cafeAddress;
  const filled = (rows: Row[]) => rows.filter(([, value]) => value);
  return {
    box, window, location, total: cateringTotal(box, lead.headcount), line: `${lead.headcount} × ${box.name}`,
    order: filled([
      [fields.headcount, String(lead.headcount)], [fields.box, box.name], [fields.date, lead.eventDate && longDate(lead.eventDate)],
      [fields.time, window ? range(window) : ''], [fields.fulfillment, `${fields[lead.fulfillment]} · ${location}`], [fields.notes, lead.notes],
    ]),
    details: filled([[fields.name, lead.name], [fields.company, lead.company], [fields.contact, lead.contact]]),
  };
}

const escape = (value: string) => value.replace(/[\;,]/g, '\\$&').replace(/\r?\n/g, '\\n');
const compact = (value: string) => value.replace(/[-:]/g, '');

export function calendarFile(lead: Lead, catering: Catering, businessName: string, cafeAddress: string, now = new Date()) {
  const summary = orderSummary(lead, catering, cafeAddress);
  const day = compact(lead.eventDate);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${escape(businessName)}//Catering//EN`, 'BEGIN:VEVENT',
    `UID:${now.getTime()}-${day}@catering`, `DTSTAMP:${compact(now.toISOString().slice(0, 19))}Z`,
    // shortcut: floating local times (no VTIMEZONE) and no 75-octet line folding; upgrade if customers order from other time zones.
    `DTSTART:${day}T${compact(summary.window?.open ?? '09:00')}00`, `DTEND:${day}T${compact(summary.window?.close ?? '10:00')}00`,
    `SUMMARY:${escape(`${catering.success.calendarTitle}: ${summary.line}`)}`, `LOCATION:${escape(summary.location)}`,
    `DESCRIPTION:${escape([...summary.order, ...summary.details].map(row => row.join(': ')).join('\n'))}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}
