import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUpRight, CheckCircle2, LoaderCircle } from 'lucide-react';
import type { Site } from '../../schemas/site';
import { leadSchema, type Lead } from '../../schemas/lead';
import { cateringTotal, money } from '../../lib/pricing';
import { asset } from '../../lib/paths';

interface Props { catering: Site['catering']; business: Site['business']; demo: boolean }
export default function CateringCalculator({ catering, business, demo: siteDemo }: Props) {
  const { minHeadcount: min, maxHeadcount: max, boxes } = catering;
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const demo = siteDemo || import.meta.env.PUBLIC_STATIC_DEMO === 'true';
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Lead>({
    resolver: zodResolver(leadSchema),
    defaultValues: { headcount: min, boxId: boxes[0].id, consent: false, website: '' },
  });
  const [headcount, boxId] = watch(['headcount', 'boxId']);
  const box = boxes.find(item => item.id === boxId) ?? boxes[0];
  const inRange = Number.isInteger(headcount) && headcount >= min && headcount <= max;
  async function submit(values: Lead) {
    if (demo) return;
    setStatus('idle');
    try {
      const response = await fetch(asset('/api/leads'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values), signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Request failed');
      setStatus('success');
    } catch { setStatus('error'); }
  }
  return <section id="catering" className="section-shell section-space catering-grid" aria-labelledby="catering-title">
    <div><p className="section-label">{catering.label}</p><h2 id="catering-title" className="whitespace-pre-line">{catering.heading}</h2><p className="section-description">{catering.description}</p><p className="catering-note">{catering.note}</p></div>
    {status === 'success' ? <div className="form-success" role="status"><CheckCircle2 size={36} aria-hidden="true" /><p>{catering.success}</p></div> : <form onSubmit={handleSubmit(submit)} className="catering-form" noValidate>
      <label className="field">Headcount<input type="number" inputMode="numeric" min={min} max={max} {...register('headcount', { valueAsNumber: true })} aria-invalid={!inRange} aria-describedby="headcount-hint" /><span id="headcount-hint" className={inRange ? 'field-hint' : 'field-error'}>Catering is available for {min} to {max} guests.</span></label>
      <fieldset className="box-options"><legend>Box style</legend>{boxes.map(item => <label className="box-option" key={item.id}>
        <input type="radio" value={item.id} {...register('boxId')} /><span><strong>{item.name}</strong><small>{item.description}</small></span><strong>{money(item.pricePerPerson)}<small>per person</small></strong>
      </label>)}</fieldset>
      <div className="form-summary" aria-live="polite"><div><strong>{box.name}</strong><span>{inRange ? `${headcount} guests` : 'Enter a headcount'}</span></div><strong>{inRange ? money(cateringTotal(box, headcount)) : '—'}<small>estimated total</small></strong></div>
      {demo && <p className="form-notice">Demo preview. The calculator is live, but inquiries are disabled and no information is sent.</p>}
      <div className="form-grid">
        <label className="field">Your name<input autoComplete="name" {...register('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} placeholder="Full name" /><span id="name-error" className="field-error">{errors.name?.message}</span></label>
        <label className="field">Phone number<input type="tel" autoComplete="tel" {...register('phone')} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'phone-error' : undefined} placeholder="Your phone number" /><span id="phone-error" className="field-error">{errors.phone?.message}</span></label>
      </div>
      <div className="form-grid">
        <label className="field">Email address<input type="email" autoComplete="email" {...register('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} placeholder="you@example.com" /><span id="email-error" className="field-error">{errors.email?.message}</span></label>
        <label className="field">Event date<input type="date" {...register('eventDate')} aria-invalid={!!errors.eventDate} aria-describedby={errors.eventDate ? 'date-error' : undefined} /><span id="date-error" className="field-error">{errors.eventDate?.message}</span></label>
      </div>
      <label className="honeypot" aria-hidden="true">Leave empty<input {...register('website')} tabIndex={-1} autoComplete="off" /></label>
      <label className="consent-field"><input type="checkbox" {...register('consent')} aria-invalid={!!errors.consent} aria-describedby={errors.consent ? 'consent-error' : undefined} /><span>{catering.privacy}</span></label>
      {errors.consent && <p id="consent-error" className="field-error">{errors.consent.message}</p>}
      {status === 'error' && <p role="alert" className="field-error">{catering.error} <a className="text-link" href={`tel:${business.phone}`}>{business.phoneDisplay}</a></p>}
      <button className="button button-primary w-full" type="submit" disabled={demo || isSubmitting || !inRange}>{isSubmitting ? <><LoaderCircle size={18} aria-hidden="true" />Sending inquiry…</> : <>{catering.cta}<ArrowUpRight size={17} aria-hidden="true" /></>}</button>
      <p className="form-footnote">An inquiry is not a confirmed order. No payment is taken.</p>
    </form>}
  </section>;
}
