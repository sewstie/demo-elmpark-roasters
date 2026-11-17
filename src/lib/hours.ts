import type { Hours } from '../schemas/site.ts';

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const clock = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
};
export const range = (day: Hours[number]) => day ? `${clock(day.open)} – ${clock(day.close)}` : 'Closed';

// Evaluated in the shop's time zone, not the visitor's.
export function statusLabel(hours: Hours, timeZone: string, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone, weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map(part => [part.type, part.value]));
  const today = hours[DAY_NAMES.indexOf(parts.weekday)];
  if (!today) return '🔴 Closed today';
  const time = `${parts.hour}:${parts.minute}`;
  return time >= today.open && time < today.close ? `🟢 Open Today: ${range(today)}` : `🔴 Closed now · Today: ${range(today)}`;
}
