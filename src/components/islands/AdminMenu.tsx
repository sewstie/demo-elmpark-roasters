import React from 'react';
import type { Site } from '../../schemas/site.ts';

type Item = Site['menu']['items'][number];
export interface AdminMenuProps {
  site: Site;
  onUpdateSite: (updater: (prev: Site) => Site) => void;
}

const toPrice = (value: string) => Math.max(0.01, Math.round(parseFloat(value) * 100) / 100 || 0.01);

export const AdminMenu: React.FC<AdminMenuProps> = ({ site, onUpdateSite }) => {
  const setItem = (id: string, patch: Partial<Item>) => onUpdateSite(prev => ({
    ...prev, menu: { ...prev.menu, items: prev.menu.items.map(item => item.id === id ? { ...item, ...patch } : item) },
  }));
  const setBoxPrice = (id: string, pricePerPerson: number) => onUpdateSite(prev => ({
    ...prev, catering: { ...prev.catering, boxes: prev.catering.boxes.map(box => box.id === id ? { ...box, pricePerPerson } : box) },
  }));
  return (
    <>
      {site.menu.categories.map(category => (
        <section key={category.id} className="admin-card">
          <h2>{category.name}</h2>
          <div className="admin-grid">
            {site.menu.items.filter(item => item.category === category.id).map(item => (
              <fieldset key={item.id} className="admin-group">
                <legend>{item.name}</legend>
                <label className="admin-field">Name
                  <input value={item.name} onChange={e => setItem(item.id, { name: e.target.value })} required />
                </label>
                <label className="admin-field">Description
                  <input value={item.description} onChange={e => setItem(item.id, { description: e.target.value })} required />
                </label>
                <label className="admin-field">Price (USD)
                  <input type="number" min="0.01" max="50000" step="0.01" value={item.price} onChange={e => setItem(item.id, { price: toPrice(e.target.value) })} required />
                </label>
              </fieldset>
            ))}
          </div>
        </section>
      ))}
      <section className="admin-card">
        <h2>Catering boxes</h2>
        <div className="admin-grid">
          {site.catering.boxes.map(box => (
            <fieldset key={box.id} className="admin-group">
              <legend>{box.name}</legend>
              <label className="admin-field">Price per person (USD)
                <input type="number" min="0.01" max="50000" step="0.01" value={box.pricePerPerson} onChange={e => setBoxPrice(box.id, toPrice(e.target.value))} required />
              </label>
            </fieldset>
          ))}
        </div>
      </section>
    </>
  );
};
