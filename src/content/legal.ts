/** Privacy and Terms copy. Plain language, short sections. */

export type LegalPage = {
  sheet: { number: string; name: string; revision: string; date: string };
  title: string;
  intro: string;
  meta: { title: string; description: string };
  sections: { heading: string; paragraphs: string[] }[];
};

/**
 * How the legal pages tell people to reach us. Where a paragraph says
 * `{contact}`, it reads `withEmail` (the address linked where it says `{email}`)
 * when siteConfig.contactEmail is set, and `withoutEmail` while it is empty.
 */
export const legalContact = {
  withEmail: 'by writing to {email}',
  withoutEmail:
    'by replying to the email we send about your application (every applicant hears from us within two working days)'
};

export const privacy: LegalPage = {
  sheet: { number: 'C-01', name: 'Privacy', revision: 'B', date: '2026-11-06' },
  title: 'Privacy',
  intro:
    'This site collects as little as it can. Here is all of it, what we do with it, and how to have it removed.',
  meta: {
    title: 'Privacy — Strata by Ironleaf Systems',
    description:
      'What the Strata website collects, why, how long we keep it, and how to have it deleted.'
  },
  sections: [
    {
      heading: 'What we collect',
      paragraphs: [
        'When you apply to be a design partner, we save the work email, company, regions and data size you enter, and the time you sent them. Nothing else on this site asks for personal information.',
        'To stop automated sign-ups, we keep a salted hash of your IP address for one hour. We never store the address itself, and the hash cannot be turned back into it.'
      ]
    },
    {
      heading: 'What we do with it',
      paragraphs: [
        'We use your application to decide whether Strata fits your workload and to reply to you. We do not sell it, share it with advertisers or add you to a newsletter.'
      ]
    },
    {
      heading: 'Cookies and tracking',
      paragraphs: [
        'This site sets no cookies and runs no advertising or cross-site tracking. Fonts and drawings are served from this site. The “Powered by Layerwise” badge in the footer is an image loaded from layerwise.app.'
      ]
    },
    {
      heading: 'How long we keep it',
      paragraphs: [
        'Applications are kept until the design partner programme ends or you ask us to delete yours, whichever comes first.'
      ]
    },
    {
      heading: 'Your choices',
      paragraphs: [
        'Ask us for a copy of what we hold about you, to correct it or to delete it, {contact}. We answer within 30 days. Ironleaf Systems AG is based in Zurich, and you can also contact the Swiss Federal Data Protection and Information Commissioner.'
      ]
    }
  ]
};

export const terms: LegalPage = {
  sheet: { number: 'C-02', name: 'Terms', revision: 'A', date: '2026-11-02' },
  title: 'Terms',
  intro:
    'These terms cover this website. Using Strata itself is covered by a separate agreement that design partners sign.',
  meta: {
    title: 'Terms — Strata by Ironleaf Systems',
    description:
      'The terms for using the Strata website, run by Ironleaf Systems AG in Zurich.'
  },
  sections: [
    {
      heading: 'Who we are',
      paragraphs: [
        'This site is run by Ironleaf Systems AG, a company registered in Zurich, Switzerland.'
      ]
    },
    {
      heading: 'Using this site',
      paragraphs: [
        'You may read, link to and quote this site. Do not try to break it, overload it or use the application form to send anything other than a genuine application.'
      ]
    },
    {
      heading: 'Numbers and drawings',
      paragraphs: [
        'Latency figures, availability targets and diagrams describe how Strata is designed to behave and what we have measured. They are not a contract. The commitments that bind us are in the agreement design partners sign.'
      ]
    },
    {
      heading: 'Design partner applications',
      paragraphs: [
        'Applying does not commit you or us to anything. We may decline an application without giving a reason.'
      ]
    },
    {
      heading: 'Liability and law',
      paragraphs: [
        'The site is provided as it is. To the extent the law allows, we are not liable for losses from using it. These terms are governed by Swiss law, and the courts of Zurich have jurisdiction.'
      ]
    }
  ]
};

export const notFound = {
  sheet: { number: 'X-404', name: 'Not found', revision: '—', date: '—' },
  stamp: 'Sheet not found',
  title: 'This sheet is not in the set.',
  body: 'The address may be mistyped, or the sheet was withdrawn in a later revision.',
  home: 'Back to the system overview',
  architecture: 'Read the architecture',
  meta: { title: 'Sheet not found — Strata', description: 'This page does not exist.' }
};
