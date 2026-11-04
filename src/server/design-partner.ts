/**
 * The rules for a design-partner application, independent of the database
 * and email services so they can be tested on their own.
 */
import {
  DATA_SIZES,
  isHoneypotFilled,
  validate,
  type Application,
  type RawApplication,
  type SubmitResult
} from '~/lib/design-partner';
import { regionById } from '~/content/topology';

export const RATE_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };
export const OWNER_EMAILS_PER_DAY = 100;

export type Store = {
  /** Attempts by this visitor at or after `since`. */
  countAttempts(visitorHash: string, since: Date): Promise<number>;
  recordAttempt(visitorHash: string, at: Date): Promise<void>;
  /** Forget attempts older than `before`; hashes are kept only an hour. */
  purgeAttempts(before: Date): Promise<void>;
  /** Saves the application, or returns null when the email is already on the list. */
  insertApplication(app: Application, at: Date): Promise<{ id: string } | null>;
  countOwnerEmailsSince(since: Date): Promise<number>;
  markOwnerNotified(id: string, at: Date): Promise<void>;
};

export type Mailer = (message: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => Promise<{ sent: boolean }>;

export type Deps = {
  store: Store;
  /** Salted hash of the visitor's IP address. Never the address itself. */
  visitorHash: string;
  now: Date;
  /** From site.config.ts; empty means don't email. */
  ownerEmail: string;
  sendEmail: Mailer;
};

export async function submitApplication(raw: RawApplication, deps: Deps): Promise<SubmitResult> {
  const { store, visitorHash, now } = deps;
  const windowStart = new Date(now.getTime() - RATE_LIMIT.windowMs);

  await store.purgeAttempts(windowStart);
  const attempts = await store.countAttempts(visitorHash, windowStart);
  if (attempts >= RATE_LIMIT.max) return { status: 'rate_limited' };
  await store.recordAttempt(visitorHash, now);

  // Bots that fill the hidden field get the same answer as people, and nothing is saved.
  if (isHoneypotFilled(raw)) return { status: 'ok' };

  const result = validate(raw);
  if (!result.ok) return { status: 'invalid', fields: result.fields };

  const saved = await store.insertApplication(result.value, now);
  if (!saved) return { status: 'duplicate', email: result.value.email };

  await notifyOwner(result.value, saved.id, deps);
  return { status: 'ok' };
}

async function notifyOwner(app: Application, id: string, deps: Deps) {
  const to = deps.ownerEmail.trim();
  if (!to) return;
  const dayStart = new Date(
    Date.UTC(deps.now.getUTCFullYear(), deps.now.getUTCMonth(), deps.now.getUTCDate())
  );
  // Past the daily cap, keep saving applications without email.
  if ((await deps.store.countOwnerEmailsSince(dayStart)) >= OWNER_EMAILS_PER_DAY) return;
  try {
    const { sent } = await deps.sendEmail({ to, ...ownerEmailContent(app) });
    if (sent) await deps.store.markOwnerNotified(id, deps.now);
  } catch (error) {
    // An email problem must never fail the application itself.
    console.warn('[design-partner] owner email failed', error);
  }
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export function ownerEmailContent(app: Application) {
  const size = DATA_SIZES.find((d) => d.id === app.dataSize)?.label ?? app.dataSize;
  const regions = app.regions.map((r) => `${regionById(r).name} (${r.toUpperCase()})`).join(', ');
  const rows: [string, string][] = [
    ['Work email', app.email],
    ['Company', app.company],
    ['Regions', regions],
    ['Data size', size]
  ];
  // Header lines can't carry user input across a line break.
  const subject = `New design partner: ${app.company}`.replace(/[\r\n]+/g, ' ').slice(0, 200);
  const text = `A new design-partner application arrived.\n\n${rows
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')}\n\nIt is saved in the design_partners table.`;
  const html = `<p>A new design-partner application arrived.</p><table cellpadding="4">${rows
    .map(([k, v]) => `<tr><td><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(v)}</td></tr>`)
    .join('')}</table><p>It is saved in the <code>design_partners</code> table.</p>`;
  return { subject, text, html };
}

/** SHA-256 of salt and IP, hex encoded. */
export async function hashVisitor(ip: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
