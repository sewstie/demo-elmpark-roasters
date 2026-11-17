import { z } from 'zod';
import type { Catering } from './catering.ts';

const PHONE = /^(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/;

// Built per request so the bounds always match the live site data and today's date.
export const leadSchema = (catering: Catering, minDate: string) => {
  const guests = `Enter a headcount from ${catering.minHeadcount} to ${catering.maxHeadcount}.`;
  return z.object({
    headcount: z.number(guests).int('Enter a whole number of guests.').min(catering.minHeadcount, guests).max(catering.maxHeadcount, guests),
    boxId: z.string().refine(value => catering.boxes.some(box => box.id === value), 'Choose a box style.'),
    eventDate: z.iso.date('Choose your event date.').refine(value => value >= minDate, `Choose a date at least ${catering.leadDays} days from today.`),
    timeWindowId: z.string().refine(value => catering.timeWindows.some(item => item.id === value), 'Choose a time window.'),
    fulfillment: z.enum(['pickup', 'delivery']),
    address: z.string().trim().max(200, 'Keep the address under 200 characters.'),
    notes: z.string().trim().max(500, 'Keep notes under 500 characters.'),
    name: z.string().trim().min(2, 'Enter your name.').max(100),
    company: z.string().trim().max(100),
    contact: z.string().trim().max(254).refine(value => z.email().safeParse(value).success || PHONE.test(value), 'Enter a valid email address or US phone number.'),
    website: z.string().max(0, 'Leave this field empty.').optional(),
  }).refine(lead => lead.fulfillment === 'pickup' || lead.address.length >= 5, { path: ['address'], message: 'Enter the delivery street address.' });
};
export type Lead = z.infer<ReturnType<typeof leadSchema>>;
