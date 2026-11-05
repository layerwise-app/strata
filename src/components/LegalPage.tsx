import { Sheet, sheetPad } from '~/components/blueprint/Sheet';
import { legalContact, type LegalPage as LegalContent } from '~/content/legal';
import { contact, siteConfig } from '~/site.config';

export function LegalPage({ page }: { page: LegalContent }) {
  return (
    <Sheet
      id='top'
      meta={{ ...page.sheet, scale: '—' }}
      eyebrow={page.title}
      labelledBy='legal-title'
      className='pt-6 sm:pt-8'
    >
      <div className={`grid gap-10 pt-10 pb-12 lg:grid-cols-12 ${sheetPad}`}>
        <div className='lg:col-span-4'>
          <h1 id='legal-title' className='display text-[2.6rem] sm:text-[3.25rem]'>
            {page.title}
          </h1>
          <p className='lede mt-4'>{page.intro}</p>
          <p className='annot mt-6 text-ink-muted'>Last updated {page.sheet.date}</p>
        </div>
        <div className='lg:col-span-7 lg:col-start-6'>
          <ol className='border-t border-ink'>
            {page.sections.map((s, i) => (
              <li key={s.heading} className='grid gap-x-4 border-b border-ink py-6 sm:grid-cols-[3rem_1fr]'>
                <span className='annot pt-1.5 text-ink-blue'>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h2 className='heading text-[1.375rem]'>{s.heading}</h2>
                  {s.paragraphs.map((p) => (
                    <p key={p} className='body-copy mt-2 text-ink'>
                      <Paragraph text={p} />
                    </p>
                  ))}
                </div>
              </li>
            ))}
          </ol>
          <p className='body-copy mt-6'>
            {siteConfig.companyLegal}, {siteConfig.companyCity}, {siteConfig.companyCountry}
            {contact.email ? (
              <>
                {' · '}
                <EmailLink />
              </>
            ) : null}
          </p>
        </div>
      </div>
    </Sheet>
  );
}

/** Fills in `{contact}`: the email link when one is set, wording without it when not. */
function Paragraph({ text }: { text: string }) {
  const [before, after] = text.split('{contact}');
  if (after === undefined) return text;
  if (!contact.email) return `${before}${legalContact.withoutEmail}${after}`;
  const [lead, tail] = legalContact.withEmail.split('{email}');
  return (
    <>
      {before}
      {lead}
      <EmailLink />
      {tail}
      {after}
    </>
  );
}

function EmailLink() {
  return (
    <a className='link text-ink break-all' href={`mailto:${contact.email}`}>
      {contact.email}
    </a>
  );
}
