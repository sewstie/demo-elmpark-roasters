import { useState } from 'react';
import type { Site } from '../../schemas/site';
import { money } from '../../lib/pricing';

interface Props { menu: Site['menu'] }
export default function MenuBoard({ menu }: Props) {
  const [category, setCategory] = useState<string | null>(null);
  const [diets, setDiets] = useState<string[]>([]);
  const items = menu.items.filter(item => (!category || item.category === category) && diets.every(diet => item.diets.includes(diet)));
  const toggleDiet = (id: string) => setDiets(current => current.includes(id) ? current.filter(diet => diet !== id) : [...current, id]);
  return <section id="menu" className="menu-section section-space" aria-labelledby="menu-title">
    <div className="section-shell">
      <div className="section-heading"><p className="section-label">{menu.label}</p><h2 id="menu-title">{menu.heading}</h2><p className="section-description">{menu.description}</p></div>
      <div className="menu-controls" role="group" aria-label="Menu categories">
        <button type="button" className="chip" aria-pressed={!category} onClick={() => setCategory(null)}>All</button>
        {menu.categories.map(item => <button type="button" className="chip" key={item.id} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.name}</button>)}
      </div>
      <div className="menu-controls menu-diets" role="group" aria-label="Dietary filters">
        {menu.diets.map(item => <button type="button" className="chip" key={item.id} aria-pressed={diets.includes(item.id)} onClick={() => toggleDiet(item.id)}>{item.name}</button>)}
      </div>
      <p className="sr-only" role="status">{items.length} menu items shown</p>
      <ul className="menu-grid">{items.map(item => <li className="menu-item" key={item.id}>
        <div className="menu-item-head"><h3>{item.name}</h3><strong>{money(item.price)}</strong></div>
        <p>{item.description}</p>
        <div className="menu-tags">{menu.diets.filter(diet => item.diets.includes(diet.id)).map(diet => <span key={diet.id}>{diet.name}</span>)}</div>
      </li>)}</ul>
      {!items.length && <p className="menu-empty">Nothing matches those filters right now. Try removing one.</p>}
      <p className="section-note">{menu.note}</p>
    </div>
  </section>;
}
