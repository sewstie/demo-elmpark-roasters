import { z } from 'zod';

export const text = z.string().trim().min(1).max(1000);
export const id = z.string().regex(/^[a-z][a-z0-9-]{0,39}$/);
export const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const price = z.number().min(0.01).max(50000);
export const span = z.object({ open: time, close: time }).refine(value => value.open < value.close, 'Opening time must be before closing time.');
export const texts = <K extends string>(...keys: K[]) => z.object(Object.fromEntries(keys.map(key => [key, text])) as Record<K, typeof text>);
