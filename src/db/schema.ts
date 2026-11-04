import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Define tables here, then run `pnpm run db:generate --name <what_changed>`
// to create a migration. Migrations are applied to the production D1
// database on publish.

/** Design-partner applications from the sign-up form. */
export const designPartners = sqliteTable(
  'design_partners',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    /** Lower-cased; one application per address. */
    email: text('email').notNull().unique(),
    company: text('company').notNull(),
    regions: text('regions', { mode: 'json' }).$type<string[]>().notNull(),
    dataSize: text('data_size').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    /** When the owner was emailed about it; null when not emailed. */
    ownerNotifiedAt: integer('owner_notified_at', { mode: 'timestamp' })
  },
  (table) => [index('design_partners_notified_idx').on(table.ownerNotifiedAt)]
);

/**
 * Recent form attempts for rate limiting: a salted hash of the visitor's IP
 * address, never the address. Rows older than an hour are deleted.
 */
export const formAttempts = sqliteTable(
  'form_attempts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    visitorHash: text('visitor_hash').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
  },
  (table) => [
    index('form_attempts_visitor_idx').on(table.visitorHash, table.createdAt),
    index('form_attempts_created_idx').on(table.createdAt)
  ]
);

/** Server-only values the app creates for itself, such as the IP hash salt. */
export const appSecrets = sqliteTable('app_secrets', {
  key: text('key').primaryKey(),
  value: text('value').notNull()
});
