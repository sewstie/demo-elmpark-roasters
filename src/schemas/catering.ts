import { z } from 'zod';
import { id, price, text, texts, time } from './primitives.ts';

const step = texts('short', 'title');
export const cateringSchema = z.object({
  label: text, heading: text, description: text, note: text, privacy: text, totalLabel: text, error: text,
  minHeadcount: z.number().int().min(1).max(1000), maxHeadcount: z.number().int().min(1).max(1000),
  leadDays: z.number().int().min(0).max(60),
  boxes: z.array(z.object({ id, name: text, description: text, pricePerPerson: price })).min(1).max(6),
  timeWindows: z.array(z.object({ id, open: time, close: time }).refine(value => value.open < value.close, 'Window must start before it ends.')).min(1).max(8),
  steps: z.object({ order: step, details: step, review: step }),
  fields: texts(
    'headcount', 'decrease', 'increase', 'headcountHint', 'box', 'perPerson', 'date', 'dateHint', 'time', 'timePlaceholder',
    'fulfillment', 'pickup', 'delivery', 'address', 'deliveryNote', 'notes', 'notesPlaceholder', 'optional',
    'name', 'company', 'contact', 'contactHint',
  ),
  actions: texts('back', 'next', 'edit', 'submit', 'sending', 'calendar', 'restart'),
  success: texts('title', 'body', 'demoTag', 'emailTitle', 'emailSubject', 'emailName', 'emailCompany', 'emailContact', 'emailSubmitted', 'calendarTitle'),
});
export type Catering = z.infer<typeof cateringSchema>;
export type Box = Catering['boxes'][number];
