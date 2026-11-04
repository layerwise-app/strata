import { beforeEach, describe, expect, it, vi } from 'vitest';
import { validate, type Application } from '~/lib/design-partner';
import {
  hashVisitor,
  OWNER_EMAILS_PER_DAY,
  ownerEmailContent,
  RATE_LIMIT,
  submitApplication,
  type Deps,
  type Mailer,
  type Store
} from '~/server/design-partner';

type Row = Application & { id: string; createdAt: Date; ownerNotifiedAt: Date | null };

function memoryStore() {
  const rows: Row[] = [];
  let attempts: { visitorHash: string; at: Date }[] = [];
  const store: Store = {
    async countAttempts(hash, since) {
      return attempts.filter((a) => a.visitorHash === hash && a.at >= since).length;
    },
    async recordAttempt(visitorHash, at) {
      attempts.push({ visitorHash, at });
    },
    async purgeAttempts(before) {
      attempts = attempts.filter((a) => a.at >= before);
    },
    async insertApplication(app, at) {
      if (rows.some((r) => r.email === app.email)) return null;
      const row = { ...app, id: `id-${rows.length + 1}`, createdAt: at, ownerNotifiedAt: null };
      rows.push(row);
      return { id: row.id };
    },
    async countOwnerEmailsSince(since) {
      return rows.filter((r) => r.ownerNotifiedAt && r.ownerNotifiedAt >= since).length;
    },
    async markOwnerNotified(id, at) {
      const row = rows.find((r) => r.id === id);
      if (row) row.ownerNotifiedAt = at;
    }
  };
  return { store, rows, attempts: () => attempts };
}

const valid = {
  email: 'Ada@Example.com ',
  company: 'Analytical Engines',
  regions: ['fra', 'ore'],
  dataSize: '1tb-10tb',
  website: ''
};

let mem: ReturnType<typeof memoryStore>;
let sendEmail: ReturnType<typeof vi.fn<Mailer>>;
let now: Date;

function deps(overrides: Partial<Deps> = {}): Deps {
  return { store: mem.store, visitorHash: 'visitor-a', now, ownerEmail: '', sendEmail, ...overrides };
}

beforeEach(() => {
  mem = memoryStore();
  sendEmail = vi.fn<Mailer>(async () => ({ sent: true }));
  now = new Date('2026-11-05T10:00:00Z');
});

describe('validate', () => {
  it('normalizes a valid application', () => {
    const result = validate(valid);
    expect(result).toEqual({
      ok: true,
      value: {
        email: 'ada@example.com',
        company: 'Analytical Engines',
        regions: ['ore', 'fra'],
        dataSize: '1tb-10tb'
      }
    });
  });

  it('names every field that is wrong', () => {
    const result = validate({ email: 'not-an-email', company: '  ', regions: [], dataSize: '5 PB' });
    expect(result).toEqual({ ok: false, fields: ['email', 'company', 'regions', 'dataSize'] });
  });

  it('rejects regions outside the six', () => {
    expect(validate({ ...valid, regions: ['fra', 'mars'] })).toMatchObject({ ok: false, fields: ['regions'] });
    expect(validate({ ...valid, regions: 'fra' })).toMatchObject({ ok: false, fields: ['regions'] });
  });

  it('rejects values of the wrong type', () => {
    expect(validate({ email: 42, company: {}, regions: [1], dataSize: null })).toMatchObject({ ok: false });
  });
});

describe('submitApplication', () => {
  it('saves a valid application', async () => {
    await expect(submitApplication(valid, deps())).resolves.toEqual({ status: 'ok' });
    expect(mem.rows).toHaveLength(1);
    expect(mem.rows[0]).toMatchObject({ email: 'ada@example.com', regions: ['ore', 'fra'] });
  });

  it('treats the same email twice as already on the list and adds no row', async () => {
    await submitApplication(valid, deps());
    const again = await submitApplication({ ...valid, email: '  ADA@example.COM' }, deps());
    expect(again).toEqual({ status: 'duplicate', email: 'ada@example.com' });
    expect(mem.rows).toHaveLength(1);
  });

  it('answers a filled honeypot like a success but saves nothing', async () => {
    const result = await submitApplication({ ...valid, website: 'https://spam.example' }, deps());
    expect(result).toEqual({ status: 'ok' });
    expect(mem.rows).toHaveLength(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('returns field errors without saving', async () => {
    const result = await submitApplication({ ...valid, dataSize: 'huge' }, deps());
    expect(result).toEqual({ status: 'invalid', fields: ['dataSize'] });
    expect(mem.rows).toHaveLength(0);
  });

  it(`allows ${RATE_LIMIT.max} submissions per visitor per hour`, async () => {
    for (let i = 0; i < RATE_LIMIT.max; i++) {
      const r = await submitApplication({ ...valid, email: `user${i}@example.com` }, deps());
      expect(r.status).toBe('ok');
    }
    const sixth = await submitApplication({ ...valid, email: 'late@example.com' }, deps());
    expect(sixth).toEqual({ status: 'rate_limited' });
    expect(mem.rows).toHaveLength(RATE_LIMIT.max);

    // Another visitor is not affected.
    const other = await submitApplication({ ...valid, email: 'other@example.com' }, deps({ visitorHash: 'visitor-b' }));
    expect(other.status).toBe('ok');

    // An hour later the first visitor may try again.
    const later = new Date(now.getTime() + RATE_LIMIT.windowMs + 1000);
    const retry = await submitApplication({ ...valid, email: 'late@example.com' }, deps({ now: later }));
    expect(retry.status).toBe('ok');
  });

  it('counts invalid, duplicate and honeypot attempts toward the limit', async () => {
    await submitApplication(valid, deps());
    await submitApplication(valid, deps());
    await submitApplication({ ...valid, website: 'x' }, deps());
    await submitApplication({ ...valid, email: 'bad' }, deps());
    await submitApplication({ ...valid, email: 'b@example.com' }, deps());
    expect(await submitApplication({ ...valid, email: 'c@example.com' }, deps())).toEqual({
      status: 'rate_limited'
    });
  });

  it('forgets attempts older than an hour', async () => {
    await submitApplication(valid, deps());
    const later = new Date(now.getTime() + RATE_LIMIT.windowMs + 1);
    await submitApplication({ ...valid, email: 'z@example.com' }, deps({ now: later }));
    expect(mem.attempts()).toHaveLength(1);
  });

  it('does not email anyone when ownerEmail is empty', async () => {
    await submitApplication(valid, deps());
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('emails only the owner, never the visitor', async () => {
    await submitApplication({ ...valid, company: '<b>Evil</b> & Co' }, deps({ ownerEmail: 'owner@ironleaf.example' }));
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const message = sendEmail.mock.calls[0][0];
    expect(message.to).toBe('owner@ironleaf.example');
    expect(message.html).toContain('&#60;b&#62;Evil&#60;/b&#62; &#38; Co');
    expect(message.html).not.toContain('<b>Evil</b>');
    expect(mem.rows[0].ownerNotifiedAt).toEqual(now);
  });

  it(`stops emailing after ${OWNER_EMAILS_PER_DAY} a day but keeps saving`, async () => {
    for (let i = 0; i < OWNER_EMAILS_PER_DAY + 1; i++) {
      const r = await submitApplication(
        { ...valid, email: `p${i}@example.com` },
        deps({ ownerEmail: 'owner@ironleaf.example', visitorHash: `v${i}` })
      );
      expect(r.status).toBe('ok');
    }
    expect(mem.rows).toHaveLength(OWNER_EMAILS_PER_DAY + 1);
    expect(sendEmail).toHaveBeenCalledTimes(OWNER_EMAILS_PER_DAY);

    // The next UTC day the count starts again.
    const tomorrow = new Date('2026-11-06T00:05:00Z');
    await submitApplication({ ...valid, email: 'next@example.com' }, deps({ ownerEmail: 'owner@ironleaf.example', now: tomorrow }));
    expect(sendEmail).toHaveBeenCalledTimes(OWNER_EMAILS_PER_DAY + 1);
  });

  it('still saves the application when the email fails', async () => {
    sendEmail.mockRejectedValueOnce(new Error('network'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await submitApplication(valid, deps({ ownerEmail: 'owner@ironleaf.example' }));
    expect(result).toEqual({ status: 'ok' });
    expect(mem.rows).toHaveLength(1);
    expect(mem.rows[0].ownerNotifiedAt).toBeNull();
    warn.mockRestore();
  });
});

describe('visitor hashing', () => {
  it('stores a salted hash, never the IP address', async () => {
    const ip = '203.0.113.7';
    const hash = await hashVisitor(ip, 'salt-one');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(ip);
    expect(await hashVisitor(ip, 'salt-two')).not.toBe(hash);
    await submitApplication(valid, deps({ visitorHash: hash }));
    expect(JSON.stringify(mem.attempts())).not.toContain(ip);
  });
});

describe('owner email content', () => {
  it('keeps the subject on one line', () => {
    const { subject } = ownerEmailContent({
      email: 'a@b.co',
      company: 'Line\r\nBcc: x@y.z',
      regions: ['fra'],
      dataSize: 'over-10tb'
    });
    expect(subject).not.toMatch(/[\r\n]/);
  });
});
