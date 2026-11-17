import type { RefObject } from 'react';
import { CalendarPlus, CheckCircle2 } from 'lucide-react';
import type { Site } from '../../../schemas/site';
import type { Lead } from '../../../schemas/lead';
import { calendarFile, orderSummary } from '../../../lib/catering';
import { money } from '../../../lib/pricing';
import { address } from '../../../lib/paths';
import { Rows } from './ReviewStep';

interface Props { lead: Lead; catering: Site['catering']; business: Site['business']; demo: boolean; heading: RefObject<HTMLHeadingElement | null>; onRestart: () => void }
export default function Success({ lead, catering, business, demo, heading, onRestart }: Props) {
  const { success, actions, totalLabel } = catering;
  const summary = orderSummary(lead, catering, address(business));
  const rows = [...summary.order, ...summary.details];
  const total = money(summary.total);
  const email = [`To: ${business.email}`, `Subject: ${success.emailSubject}: ${summary.line}`, '', ...rows.map(row => row.join(': ')), `${totalLabel}: ${total}`].join('\n');
  return <div className="catering-form form-success">
    {demo && <p className="demo-tag">{success.demoTag}</p>}
    <CheckCircle2 size={36} aria-hidden="true" />
    <h3 ref={heading} tabIndex={-1} className="step-title">{success.title}</h3>
    <p>{success.body}</p>
    <Rows rows={rows} />
    <p className="catering-total"><span>{summary.line}</span><strong>{total}<small>{totalLabel}</small></strong></p>
    {demo && <figure className="email-preview"><figcaption>{success.emailTitle}</figcaption><pre>{email}</pre></figure>}
    <div className="step-actions">
      <a className="button button-secondary" download="catering-order.ics" href={`data:text/calendar;charset=utf-8,${encodeURIComponent(calendarFile(lead, catering, business.name, address(business)))}`}><CalendarPlus size={17} aria-hidden="true" />{actions.calendar}</a>
      <button type="button" className="button button-primary" onClick={onRestart}>{actions.restart}</button>
    </div>
  </div>;
}
