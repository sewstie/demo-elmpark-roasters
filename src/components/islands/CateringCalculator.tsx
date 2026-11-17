import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowUpRight, LoaderCircle } from 'lucide-react';
import type { Site } from '../../schemas/site';
import { leadSchema, type Lead } from '../../schemas/lead';
import { minEventDate, orderSummary } from '../../lib/catering';
import { money } from '../../lib/pricing';
import { address, asset } from '../../lib/paths';
import OrderStep from './catering/OrderStep';
import DetailsStep from './catering/DetailsStep';
import ReviewStep from './catering/ReviewStep';
import Success from './catering/Success';

const STEPS = ['order', 'details', 'review'] as const;
const STEP_FIELDS: (keyof Lead)[][] = [['headcount', 'boxId', 'eventDate', 'timeWindowId', 'fulfillment', 'address', 'notes'], ['name', 'company', 'contact']];
const never = () => () => {};

interface Props { catering: Site['catering']; business: Site['business']; demoMode: boolean }
export default function CateringCalculator({ catering, business, demoMode }: Props) {
  const { actions, minHeadcount: min, maxHeadcount: max } = catering;
  const demo = demoMode || import.meta.env.PUBLIC_STATIC_DEMO === 'true';
  const earliest = () => minEventDate(catering.leadDays, business.timeZone);
  // The prerendered HTML has no "today"; the real minimum date arrives after hydration.
  const minDate = useSyncExternalStore(never, earliest, () => '');
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState<Lead | null>(null);
  const [failed, setFailed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const form = useForm<Lead>({
    resolver: (values, context, options) => zodResolver(leadSchema(catering, earliest()))(values, context, options),
    defaultValues: { headcount: min, boxId: catering.boxes[0].id, eventDate: '', timeWindowId: '', fulfillment: 'pickup', address: '', notes: '', name: '', company: '', contact: '', website: '' },
  });
  // Runs only after the visitor changes step, never on first load.
  useEffect(() => { if (moved.current) heading.current?.focus(); }, [step, sent]);
  const go = (next: number) => { moved.current = true; setStep(next); };
  const advance = async () => { if (await form.trigger(STEP_FIELDS[step], { shouldFocus: true })) go(step + 1); };
  async function submit(values: Lead) {
    setFailed(false);
    if (!demo) {
      try {
        const response = await fetch(asset('/api/leads'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values), signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error('Request failed');
      } catch { setFailed(true); return; }
    }
    moved.current = true;
    setSent(values);
  }
  if (sent) return <Success lead={sent} catering={catering} business={business} demo={demo} heading={heading} onRestart={() => { form.reset(); setSent(null); go(0); }} />;
  const values = form.watch();
  const summary = orderSummary(values, catering, address(business));
  const inRange = Number.isInteger(values.headcount) && values.headcount >= min && values.headcount <= max;
  const sending = form.formState.isSubmitting;
  return <form onSubmit={step < 2 ? event => { event.preventDefault(); void advance(); } : form.handleSubmit(submit)} className="catering-form" noValidate>
    <ol className="steps">{STEPS.map((key, index) => <li key={key} aria-current={index === step ? 'step' : undefined}><span>{index + 1}</span>{catering.steps[key].short}</li>)}</ol>
    <h3 ref={heading} tabIndex={-1} className="step-title">{catering.steps[STEPS[step]].title}</h3>
    {step === 0 && <OrderStep form={form} catering={catering} minDate={minDate} />}
    {step === 1 && <DetailsStep form={form} fields={catering.fields} />}
    {step === 2 && <ReviewStep editLabel={actions.edit} onEdit={go} groups={[{ title: catering.steps.order.title, rows: summary.order }, { title: catering.steps.details.title, rows: summary.details }]} />}
    <label className="honeypot" aria-hidden="true">Leave empty<input {...form.register('website')} tabIndex={-1} autoComplete="off" /></label>
    <p className="catering-total" aria-live="polite"><span>{inRange ? summary.line : summary.box.name}</span><strong>{inRange ? money(summary.total) : '—'}<small>{catering.totalLabel}</small></strong></p>
    {failed && <p role="alert" className="field-error">{catering.error} <a className="text-link" href={`tel:${business.phone}`}>{business.phoneDisplay}</a></p>}
    <div className="step-actions">
      {step > 0 && <button type="button" className="button button-secondary" onClick={() => go(step - 1)} disabled={sending}><ArrowLeft size={17} aria-hidden="true" />{actions.back}</button>}
      {step < 2
        ? <button type="submit" className="button button-primary">{actions.next}<ArrowUpRight size={17} aria-hidden="true" /></button>
        // A double-click on Continue must not land on Send as a second click.
        : <button type="submit" className="button button-primary" disabled={sending} onClick={event => { if (event.detail > 1) event.preventDefault(); }}>{sending ? <><LoaderCircle size={18} aria-hidden="true" />{actions.sending}</> : <>{actions.submit}<ArrowUpRight size={17} aria-hidden="true" /></>}</button>}
    </div>
    {step > 0 && <p className="form-footnote">{catering.privacy}</p>}
  </form>;
}
