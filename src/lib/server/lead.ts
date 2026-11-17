import { cateringTotal } from '../pricing.ts';
import { HttpError } from './http.ts';
import type { Lead } from '../../schemas/lead.ts';
import type { Site } from '../../schemas/site.ts';

const MAX_PII = 254;

export interface LeadPayload {
  name: string; phone: string; email: string; eventDate: string;
  headcount: number; boxId: string; boxName: string; total: number;
  site: { business: string; phone: string };
  submittedAt: string;
}

export function buildLeadPayload(lead: Lead, site: Site): LeadPayload {
  if (site.demo) {
    throw new HttpError(400, 'Catering inquiries are disabled while the site is in demo mode.');
  }
  if (lead.website && lead.website.length > 0) {
    throw new HttpError(400, 'Invalid request submission.');
  }
  const { boxes, minHeadcount, maxHeadcount } = site.catering;
  const box = boxes.find(item => item.id === lead.boxId);
  if (!box) throw new HttpError(400, 'The selected catering box is no longer available.');
  if (lead.headcount < minHeadcount || lead.headcount > maxHeadcount) {
    throw new HttpError(400, `Catering is available for ${minHeadcount} to ${maxHeadcount} guests.`);
  }

  return {
    name: lead.name.slice(0, MAX_PII),
    phone: lead.phone.slice(0, MAX_PII),
    email: lead.email.slice(0, MAX_PII),
    eventDate: lead.eventDate,
    headcount: lead.headcount,
    boxId: box.id,
    boxName: box.name,
    total: cateringTotal(box, lead.headcount),
    site: { business: site.business.name, phone: site.business.phoneDisplay },
    submittedAt: new Date().toISOString(),
  };
}

export async function forwardLead(payload: LeadPayload): Promise<void> {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) throw new HttpError(503, 'Catering inquiry delivery is not configured on this server.');
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new HttpError(500, 'Lead webhook is improperly configured.'); }
  if (parsed.protocol !== 'https:') throw new HttpError(500, 'Lead webhook must use HTTPS.');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch(parsed, {
      method: 'POST',
      redirect: 'error',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Site-Admin/1.0',
        'x-lead-box': payload.boxId,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) throw new HttpError(502, 'The catering system could not accept your inquiry at this time.');
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, 'Could not deliver your catering inquiry. Please call us directly.');
  } finally {
    clearTimeout(timer);
  }
}
