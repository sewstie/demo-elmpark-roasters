import React from 'react';
import type { Site, Hours } from '../../schemas/site.ts';
import { DAY_NAMES } from '../../lib/hours.ts';

export interface AdminHoursProps {
  site: Site;
  disabled?: boolean;
  onUpdateSite: (updater: (prev: Site) => Site) => void;
}

const input = 'min-h-[44px] bg-background border border-border p-2 rounded text-sm text-foreground';
const row = 'flex flex-wrap items-center gap-3 p-3 min-h-[44px] border border-border rounded bg-secondary';

export const AdminHours: React.FC<AdminHoursProps> = ({ site, disabled = false, onUpdateSite }) => {
  const setDay = (index: number, day: Hours[number]) => onUpdateSite(prev => ({
    ...prev, business: { ...prev.business, hours: prev.business.hours.map((current, i) => i === index ? day : current) },
  }));
  const setIndicator = (id: string, active: boolean) => onUpdateSite(prev => ({
    ...prev, business: { ...prev.business, indicators: prev.business.indicators.map(item => item.id === id ? { ...item, active } : item) },
  }));
  return (
    <fieldset disabled={disabled} className="space-y-6 border-0 p-0 m-0">
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-accent">Opening Hours</h3>
        <div className="space-y-2">
          {site.business.hours.map((day, index) => (
            <div key={DAY_NAMES[index]} className={row}>
              <label className="flex items-center gap-3 min-h-[44px] w-36 cursor-pointer text-sm font-medium">
                <input type="checkbox" checked={!!day} onChange={e => setDay(index, e.target.checked ? { open: '07:00', close: '16:00' } : null)} className="w-5 h-5 accent-primary" />
                {DAY_NAMES[index]}
              </label>
              {day ? <>
                <input type="time" value={day.open} aria-label={`${DAY_NAMES[index]} opening time`} onChange={e => setDay(index, { ...day, open: e.target.value })} className={input} />
                <input type="time" value={day.close} aria-label={`${DAY_NAMES[index]} closing time`} onChange={e => setDay(index, { ...day, close: e.target.value })} className={input} />
              </> : <span className="text-xs text-muted">Closed</span>}
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-accent">Live Status</h3>
        <div className="space-y-2">
          {site.business.indicators.map(item => (
            <label key={item.id} className={`${row} cursor-pointer`}>
              <input type="checkbox" checked={item.active} onChange={e => setIndicator(item.id, e.target.checked)} className="w-5 h-5 accent-primary" />
              <span className="text-sm font-medium">{item.label}</span>
            </label>
          ))}
          <label className={`${row} cursor-pointer`}>
            <input type="checkbox" checked={site.demoBanner} onChange={e => { const demoBanner = e.target.checked; onUpdateSite(prev => ({ ...prev, demoBanner })); }} className="w-5 h-5 accent-primary" />
            <span className="text-sm font-medium">Show demo banner (also hides the site from search engines)</span>
          </label>
        </div>
      </section>
    </fieldset>
  );
};
