import type { Box } from '../schemas/site.ts';

export const cateringTotal = (box: Box, headcount: number) => Math.round(box.pricePerPerson * headcount * 100) / 100;
export const money = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
