import React from 'react';
import type { Site } from '../../schemas/site.ts';

type Item = Site['menu']['items'][number];
export interface AdminMenuProps {
  site: Site;
  disabled?: boolean;
  onUpdateSite: (updater: (prev: Site) => Site) => void;
}

const input = 'w-full min-h-[44px] bg-background border border-border p-2 rounded text-sm text-foreground';
const toPrice = (value: string) => Math.max(0.01, Math.round(parseFloat(value) * 100) / 100 || 0.01);

export const AdminMenu: React.FC<AdminMenuProps> = ({ site, disabled = false, onUpdateSite }) => {
  const setItem = (id: string, patch: Partial<Item>) => onUpdateSite(prev => ({
    ...prev, menu: { ...prev.menu, items: prev.menu.items.map(item => item.id === id ? { ...item, ...patch } : item) },
  }));
  const setBoxPrice = (id: string, pricePerPerson: number) => onUpdateSite(prev => ({
    ...prev, catering: { ...prev.catering, boxes: prev.catering.boxes.map(box => box.id === id ? { ...box, pricePerPerson } : box) },
  }));
  return (
    <fieldset disabled={disabled} className="space-y-6 border-0 p-0 m-0">
      {site.menu.categories.map(category => (
        <section key={category.id} className="space-y-3">
          <h3 className="text-lg font-semibold text-accent">{category.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {site.menu.items.filter(item => item.category === category.id).map(item => (
              <div key={item.id} className="border border-border p-3 rounded bg-secondary space-y-2">
                <label className="block text-xs">
                  <span className="text-muted block mb-1">Item name</span>
                  <input type="text" value={item.name} onChange={e => setItem(item.id, { name: e.target.value })} className={input} />
                </label>
                <label className="block text-xs">
                  <span className="text-muted block mb-1">Description</span>
                  <input type="text" value={item.description} onChange={e => setItem(item.id, { description: e.target.value })} className={input} />
                </label>
                <label className="block text-xs">
                  <span className="text-muted block mb-1">Price (USD)</span>
                  <input type="number" min="0.01" max="50000" step="0.01" value={item.price} onChange={e => setItem(item.id, { price: toPrice(e.target.value) })} className={input} />
                </label>
              </div>
            ))}
          </div>
        </section>
      ))}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-accent">Catering Boxes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {site.catering.boxes.map(box => (
            <label key={box.id} className="block text-xs border border-border p-3 rounded bg-secondary">
              <span className="text-sm font-semibold block mb-2">{box.name}</span>
              <span className="text-muted block mb-1">Price per person (USD)</span>
              <input type="number" min="0.01" max="50000" step="0.01" value={box.pricePerPerson} onChange={e => setBoxPrice(box.id, toPrice(e.target.value))} className={input} />
            </label>
          ))}
        </div>
      </section>
    </fieldset>
  );
};
