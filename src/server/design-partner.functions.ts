import { createServerFn } from '@tanstack/react-start';
import type { RawApplication } from '~/lib/design-partner';

/** Saves a design-partner application. Called by the sign-up form. */
export const applyAsDesignPartner = createServerFn({ method: 'POST' })
  .validator((data: RawApplication) => {
    if (!data || typeof data !== 'object') throw new Error('Expected an application');
    const { email, company, regions, dataSize, website } = data;
    return { email, company, regions, dataSize, website } as RawApplication;
  })
  .handler(async ({ data }) => {
    const [{ env }, { getRequestIP, getRequestHeader }, { siteConfig }, rules, store] =
      await Promise.all([
        import('cloudflare:workers'),
        import('@tanstack/react-start/server'),
        import('~/site.config'),
        import('./design-partner'),
        import('./d1-store')
      ]);
    const ip =
      getRequestHeader('cf-connecting-ip') ||
      getRequestIP({ xForwardedFor: true }) ||
      'unknown';
    const salt = await store.ipSalt((env as unknown as Record<string, unknown>).IP_HASH_SALT);
    return rules.submitApplication(data, {
      store: store.d1Store,
      visitorHash: await rules.hashVisitor(ip, salt),
      now: new Date(),
      ownerEmail: siteConfig.ownerEmail,
      sendEmail: async (message) => {
        const { error } = await env.EMAIL.send(message);
        if (error) console.warn(`[design-partner] email: ${error.code} ${error.message}`);
        return { sent: !error };
      }
    });
  });
