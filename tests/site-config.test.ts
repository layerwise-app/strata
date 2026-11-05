import { describe, expect, it } from 'vitest';
import { legalContact, privacy, terms } from '~/content/legal';
import { contact, siteConfig } from '~/site.config';

// Domains reserved for examples (RFC 2606 / 6761). Nobody reads mail sent there.
const placeholder = /(@|\/\/|\.)(example\.(com|net|org)|[^/@\s]+\.(example|test|invalid|localhost))(\/|$)|@example$/i;

describe('contact details', () => {
  it('leaves the contact email empty or sets it to a real address', () => {
    const email = siteConfig.contactEmail.trim();
    if (email) {
      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(email).not.toMatch(placeholder);
    }
    expect(contact.email).toBe(email);
  });

  it('leaves the owner email empty or sets it to a real address', () => {
    expect(siteConfig.ownerEmail.trim()).not.toMatch(placeholder);
  });

  it('only lists social links that point at a real https page', () => {
    for (const s of contact.social) {
      expect(s.href).toMatch(/^https:\/\//);
      expect(s.href).not.toMatch(placeholder);
    }
    const unset = siteConfig.social.filter((s) => !s.href.trim());
    expect(contact.social).toHaveLength(siteConfig.social.length - unset.length);
  });

  it('catches the reserved example domains', () => {
    for (const bad of ['hello@ironleaf.example', 'a@example.com', 'https://example.org/x', 'https://x.test/']) {
      expect(bad).toMatch(placeholder);
    }
    expect('hello@ironleaf.ch').not.toMatch(placeholder);
  });
});

describe('legal copy', () => {
  it('names no address directly, so it reads well with or without one', () => {
    const text = [privacy, terms].flatMap((p) => [p.intro, ...p.sections.flatMap((s) => s.paragraphs)]).join(' ');
    expect(text).not.toMatch(/@|address below/);
    expect(legalContact.withEmail).toContain('{email}');
    expect(legalContact.withoutEmail).not.toContain('{email}');
  });
});
