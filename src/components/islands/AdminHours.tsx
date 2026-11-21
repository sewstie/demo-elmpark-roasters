import React from 'react';
import type { Site, Hours } from '../../schemas/site.ts';
import { DAY_NAMES } from '../../lib/hours.ts';

export interface AdminHoursProps {
  site: Site;
  onUpdateSite: (updater: (prev: Site) => Site) => void;
}

export const AdminHours: React.FC<AdminHoursProps> = ({ site, onUpdateSite }) => {
  const setDay = (index: number, day: Hours[number]) => onUpdateSite(prev => ({
    ...prev, business: { ...prev.business, hours: prev.business.hours.map((current, i) => i === index ? day : current) },
  }));
  const setIndicator = (id: string, active: boolean) => onUpdateSite(prev => ({
    ...prev, business: { ...prev.business, indicators: prev.business.indicators.map(item => item.id === id ? { ...item, active } : item) },
  }));
  return (
    <>
      <section className="admin-card">
        <h2>Opening hours</h2>
        {site.business.hours.map((day, index) => (
          <div key={DAY_NAMES[index]} className="admin-row">
            <label className="admin-check">
              <input type="checkbox" checked={!!day} onChange={e => setDay(index, e.target.checked ? { open: '07:00', close: '16:00' } : null)} />
              {DAY_NAMES[index]}
            </label>
            {day ? <>
              <input type="time" value={day.open} aria-label={`${DAY_NAMES[index]} opening time`} onChange={e => setDay(index, { ...day, open: e.target.value })} required />
              <span aria-hidden="true">–</span>
              <input type="time" value={day.close} aria-label={`${DAY_NAMES[index]} closing time`} onChange={e => setDay(index, { ...day, close: e.target.value })} required />
            </> : <span className="admin-note">Closed</span>}
          </div>
        ))}
      </section>
      <section className="admin-card">
        <h2>Live status</h2>
        {site.business.indicators.map(item => (
          <label key={item.id} className="admin-check">
            <input type="checkbox" checked={item.active} onChange={e => setIndicator(item.id, e.target.checked)} />
            {item.label}
          </label>
        ))}
        <label className="admin-check">
          <input type="checkbox" checked={site.demoBanner} onChange={e => { const demoBanner = e.target.checked; onUpdateSite(prev => ({ ...prev, demoBanner })); }} />
          Show demo banner (also hides the site from search engines)
        </label>
      </section>
    </>
  );
};
