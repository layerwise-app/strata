/**
 * The design-partner form's fields and validation, shared by the browser
 * (instant feedback) and the server (the rules that count).
 */
import type { RegionId } from '~/content/topology';

export const REGION_IDS = ['ore', 'vir', 'sao', 'fra', 'sin', 'syd'] as const satisfies readonly RegionId[];

export const DATA_SIZES = [
  { id: 'under-100gb', label: 'Under 100 GB' },
  { id: '100gb-1tb', label: '100 GB–1 TB' },
  { id: '1tb-10tb', label: '1–10 TB' },
  { id: 'over-10tb', label: 'Over 10 TB' }
] as const;

export type DataSize = (typeof DATA_SIZES)[number]['id'];
export type Field = 'email' | 'company' | 'regions' | 'dataSize';

/** What the browser sends. Everything is untrusted until `validate` says so. */
export type RawApplication = {
  email?: unknown;
  company?: unknown;
  regions?: unknown;
  dataSize?: unknown;
  /** Honeypot: hidden from people, filled in by bots. */
  website?: unknown;
};

export type Application = {
  email: string;
  company: string;
  regions: RegionId[];
  dataSize: DataSize;
};

export type SubmitResult =
  | { status: 'ok' }
  | { status: 'duplicate'; email: string }
  | { status: 'invalid'; fields: Field[] }
  | { status: 'rate_limited' };

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validate(raw: RawApplication):
  | { ok: true; value: Application }
  | { ok: false; fields: Field[] } {
  const fields: Field[] = [];

  const email = typeof raw.email === 'string' ? normalizeEmail(raw.email) : '';
  if (!email || email.length > 254 || !EMAIL.test(email)) fields.push('email');

  const company =
    typeof raw.company === 'string'
      ? // oxlint-disable-next-line no-control-regex -- strip control characters on purpose
        raw.company.replace(/[\u0000-\u001f\u007f]/g, '').trim()
      : '';
  if (!company || company.length > 120) fields.push('company');

  const regions = Array.isArray(raw.regions)
    ? [...new Set(raw.regions)].filter((r): r is RegionId =>
        (REGION_IDS as readonly unknown[]).includes(r)
      )
    : [];
  if (
    !regions.length ||
    !Array.isArray(raw.regions) ||
    raw.regions.length > REGION_IDS.length * 2 ||
    regions.length !== new Set(raw.regions).size
  )
    fields.push('regions');

  const dataSize = DATA_SIZES.find((d) => d.id === raw.dataSize)?.id;
  if (!dataSize) fields.push('dataSize');

  if (fields.length) return { ok: false, fields };
  return {
    ok: true,
    value: {
      email,
      company,
      regions: REGION_IDS.filter((r) => regions.includes(r)),
      dataSize: dataSize as DataSize
    }
  };
}

export function isHoneypotFilled(raw: RawApplication) {
  return typeof raw.website === 'string' && raw.website.trim() !== '';
}
