import type { UseFormReturn } from 'react-hook-form';
import type { Catering } from '../../../schemas/catering';
import type { Lead } from '../../../schemas/lead';
import Field from './Field';

interface Props { form: UseFormReturn<Lead>; fields: Catering['fields'] }
export default function DetailsStep({ form, fields }: Props) {
  const { register, formState: { errors } } = form;
  return <>
    <Field name="name" label={fields.name} errors={errors}>{control => <input autoComplete="name" {...register('name')} {...control} />}</Field>
    <Field name="company" label={fields.company} optional={fields.optional} errors={errors}>{control => <input autoComplete="organization" {...register('company')} {...control} />}</Field>
    <Field name="contact" label={fields.contact} hint={fields.contactHint} errors={errors}>{control => <input inputMode="email" autoComplete="email" autoCapitalize="none" {...register('contact')} {...control} />}</Field>
  </>;
}
