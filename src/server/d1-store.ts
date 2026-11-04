import { and, count, eq, gte, isNotNull, lt } from 'drizzle-orm';
import { db } from '~/db';
import { appSecrets, designPartners, formAttempts } from '~/db/schema';
import type { Store } from './design-partner';

/** The design-partner store on the project's D1 database. */
export const d1Store: Store = {
  async countAttempts(visitorHash, since) {
    const [row] = await db
      .select({ n: count() })
      .from(formAttempts)
      .where(and(eq(formAttempts.visitorHash, visitorHash), gte(formAttempts.createdAt, since)));
    return row?.n ?? 0;
  },
  async recordAttempt(visitorHash, at) {
    await db.insert(formAttempts).values({ visitorHash, createdAt: at });
  },
  async purgeAttempts(before) {
    await db.delete(formAttempts).where(lt(formAttempts.createdAt, before));
  },
  async insertApplication(app, at) {
    const rows = await db
      .insert(designPartners)
      .values({ ...app, createdAt: at })
      .onConflictDoNothing({ target: designPartners.email })
      .returning({ id: designPartners.id });
    return rows[0] ?? null;
  },
  async countOwnerEmailsSince(since) {
    const [row] = await db
      .select({ n: count() })
      .from(designPartners)
      .where(and(isNotNull(designPartners.ownerNotifiedAt), gte(designPartners.ownerNotifiedAt, since)));
    return row?.n ?? 0;
  },
  async markOwnerNotified(id, at) {
    await db.update(designPartners).set({ ownerNotifiedAt: at }).where(eq(designPartners.id, id));
  }
};

/**
 * The salt for hashing IP addresses: the IP_HASH_SALT secret when it is set,
 * otherwise a random value this app creates once and keeps in app_secrets.
 */
export async function ipSalt(fromEnv: unknown): Promise<string> {
  if (typeof fromEnv === 'string' && fromEnv.length >= 16) return fromEnv;
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const fresh = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  await db.insert(appSecrets).values({ key: 'ip_salt', value: fresh }).onConflictDoNothing();
  const [row] = await db
    .select({ value: appSecrets.value })
    .from(appSecrets)
    .where(eq(appSecrets.key, 'ip_salt'));
  return row?.value ?? fresh;
}
