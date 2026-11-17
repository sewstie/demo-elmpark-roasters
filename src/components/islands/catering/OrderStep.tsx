import { Minus, Plus } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { Catering } from '../../../schemas/catering';
import type { Lead } from '../../../schemas/lead';
import { money } from '../../../lib/pricing';
import { range } from '../../../lib/hours';
import Field from './Field';
import DatePicker from './DatePicker';

interface Props { form: UseFormReturn<Lead>; catering: Catering; minDate: string }
export default function OrderStep({ form, catering, minDate }: Props) {
  const { register, setValue, watch, formState: { errors } } = form;
  const { fields, minHeadcount: min, maxHeadcount: max } = catering;
  const [headcount, boxId, fulfillment, eventDate] = watch(['headcount', 'boxId', 'fulfillment', 'eventDate']);
  const current = Number.isFinite(headcount) ? headcount : min;
  const change = (delta: number) => setValue('headcount', Math.min(max, Math.max(min, current + delta)), { shouldValidate: true });
  // Defaults mirror the form state: the prerendered HTML shows them, and coming Back keeps the visitor's choices.
  return <>
    <div className="field">
      <label htmlFor="catering-headcount">{fields.headcount}</label>
      <div className="stepper">
        <button type="button" onClick={() => change(-1)} aria-disabled={current <= min} aria-label={fields.decrease}><Minus size={18} aria-hidden="true" /></button>
        <input id="catering-headcount" type="number" inputMode="numeric" min={min} max={max} defaultValue={current} {...register('headcount', { valueAsNumber: true })} aria-invalid={!!errors.headcount} aria-describedby="headcount-hint headcount-error" />
        <button type="button" onClick={() => change(1)} aria-disabled={current >= max} aria-label={fields.increase}><Plus size={18} aria-hidden="true" /></button>
      </div>
      <span id="headcount-hint" className="field-hint">{min}–{max} {fields.headcountHint}</span>
      <span id="headcount-error" className="field-error">{errors.headcount?.message}</span>
    </div>
    <fieldset className="box-options"><legend>{fields.box}</legend>{catering.boxes.map(item => <label className="box-option" key={item.id}>
      <input type="radio" value={item.id} defaultChecked={item.id === boxId} {...register('boxId')} /><span><strong>{item.name}</strong><small>{item.description}</small></span><strong>{money(item.pricePerPerson)}<small>{fields.perPerson}</small></strong>
    </label>)}</fieldset>
    <div className="form-grid">
      <div className="field">
        <label htmlFor="catering-date">{fields.date}</label>
        <DatePicker id="catering-date" value={eventDate} min={minDate} buttonRef={register('eventDate').ref} onChange={value => setValue('eventDate', value, { shouldValidate: true, shouldDirty: true })}
          labels={{ placeholder: fields.datePlaceholder, previous: fields.previousMonth, next: fields.nextMonth }} invalid={!!errors.eventDate} describedBy="eventDate-hint eventDate-error" />
        <span id="eventDate-hint" className="field-hint">{fields.dateHint}</span>
        <span id="eventDate-error" className="field-error">{errors.eventDate?.message}</span>
      </div>
      <Field name="timeWindowId" label={fields.time} errors={errors}>{control => <select {...register('timeWindowId')} {...control}>
        <option value="">{fields.timePlaceholder}</option>
        {catering.timeWindows.map(item => <option key={item.id} value={item.id}>{range(item)}</option>)}
      </select>}</Field>
    </div>
    <fieldset className="segmented"><legend>{fields.fulfillment}</legend>
      {(['pickup', 'delivery'] as const).map(value => <label key={value}><input type="radio" value={value} defaultChecked={value === fulfillment} {...register('fulfillment')} /><span>{fields[value]}</span></label>)}
    </fieldset>
    {fulfillment === 'delivery' && <Field name="address" label={fields.address} hint={fields.deliveryNote} errors={errors}>{control => <input autoComplete="street-address" {...register('address')} {...control} />}</Field>}
    <Field name="notes" label={fields.notes} optional={fields.optional} errors={errors}>{control => <textarea rows={3} placeholder={fields.notesPlaceholder} {...register('notes')} {...control} />}</Field>
  </>;
}
