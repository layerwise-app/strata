import { createFileRoute, Link } from '@tanstack/react-router';
import { diagrams } from '~/components/architecture/diagrams';
import { RichText } from '~/components/architecture/RichText';
import { Sheet, sheetPad } from '~/components/blueprint/Sheet';
import { Arrow } from '~/components/home/Hero';
import { SiteLink } from '~/components/site/SiteLink';
import {
  architecturePage as page,
  architectureRevision,
  architectureSections,
  architectureUpdated,
  type ArchitectureSection,
  type Block
} from '~/content/architecture';
import { siteUrl } from '~/lib/site';
import { siteConfig } from '~/site.config';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/architecture')({
  head: () =>
    seo({
      title: page.meta.title,
      description: page.meta.description,
      path: '/architecture',
      image: '/share/architecture.png',
      imageAlt: 'Strata architecture drawing sheet with the failover timeline',
      type: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: page.headline,
        description: page.meta.description,
        url: siteUrl('/architecture'),
        image: siteUrl('/share/architecture.png'),
        dateModified: architectureUpdated,
        author: { '@type': 'Organization', name: siteConfig.companyLegal },
        publisher: { '@type': 'Organization', name: siteConfig.companyLegal },
        about: { '@type': 'SoftwareApplication', name: siteConfig.product }
      }
    }),
  component: ArchitecturePage
});

function ArchitecturePage() {
  const meta = {
    number: page.sheet.number,
    name: page.sheet.name,
    revision: architectureRevision,
    scale: page.sheet.scale,
    date: architectureUpdated
  };
  return (
    <div className='flex flex-col gap-10 sm:gap-16'>
      <Sheet id='contents' meta={meta} eyebrow={page.eyebrow} labelledBy='arch-title' className='pt-6 sm:pt-8'>
        <div className={`grid gap-8 pt-10 pb-10 lg:grid-cols-12 ${sheetPad}`}>
          <div className='lg:col-span-7'>
            <h1 id='arch-title' className='display text-[2.4rem] sm:text-[3.25rem] lg:text-[3.75rem]'>
              {page.headline}
            </h1>
            <p className='lede mt-6 max-w-[40rem]'>{page.intro}</p>
          </div>
          <nav aria-labelledby='toc-title' className='lg:col-span-5'>
            <h2 id='toc-title' className='annot text-ink-muted'>
              {page.contents}
            </h2>
            <ol className='mt-3 border-t border-ink'>
              {architectureSections.map((s) => (
                <li key={s.slug} className='border-b border-ink'>
                  <a href={`#${s.slug}`} className='group grid grid-cols-[3.5rem_1fr] gap-x-3 py-3.5'>
                    <span className='annot pt-1 text-ink-blue'>{s.sheet}</span>
                    <span>
                      <span className='block text-[1.125rem] leading-snug font-[500] group-hover:underline'>{s.title}</span>
                      <span className='mt-1 block text-[0.9375rem] leading-snug text-ink-muted'>{s.summary}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </Sheet>

      {architectureSections.map((s) => (
        <SectionSheet key={s.slug} section={s} />
      ))}

      <section aria-labelledby='arch-cta' className='mx-auto w-full max-w-[1360px] px-3 sm:px-6 lg:px-8'>
        <div className='sheet hatch flex flex-col items-start gap-6 p-6 sm:p-10 md:flex-row md:items-center md:justify-between'>
          <div className='max-w-xl bg-paper p-1'>
            <h2 id='arch-cta' className='heading text-[1.75rem] sm:text-[2.25rem]'>
              {page.cta.headline}
            </h2>
            <p className='body-copy mt-2'>{page.cta.body}</p>
          </div>
          <SiteLink href={siteConfig.cta.href} className='btn btn-primary'>
            {siteConfig.cta.primary}
            <Arrow />
          </SiteLink>
        </div>
      </section>
    </div>
  );
}

function SectionSheet({ section }: { section: ArchitectureSection }) {
  const Diagram = section.diagram ? diagrams[section.diagram] : null;
  const meta = {
    number: section.sheet,
    name: section.title,
    revision: section.revision,
    scale: 'NTS',
    date: section.updated
  };
  const titleId = `${section.slug}-title`;
  return (
    <Sheet id={section.slug} meta={meta} eyebrow={`Architecture · ${section.sheet}`} labelledBy={titleId}>
      <div className={`pt-10 pb-6 ${sheetPad}`}>
        <h2 id={titleId} className='heading text-[2rem] sm:text-[2.75rem]'>
          {section.title}
        </h2>
        <p className='lede mt-4 max-w-[46rem]'>{section.summary}</p>
      </div>
      {Diagram ? (
        <figure className={`pb-8 ${sheetPad}`}>
          <div className='border border-ink bg-paper p-3 sm:p-5'>
            <Diagram />
          </div>
          <figcaption className='annot mt-3 flex gap-3 text-ink-muted'>
            <span className='text-ink'>Fig. {section.sheet}</span>
            <span>{section.figure}</span>
          </figcaption>
        </figure>
      ) : null}
      <div className={`grid gap-8 pb-10 lg:grid-cols-12 ${sheetPad}`}>
        <div className='space-y-5 lg:col-span-8'>
          {section.body.map((block, i) => (
            <BlockView key={i} block={block} />
          ))}
        </div>
        <div className='lg:col-span-3 lg:col-start-10'>
          <Link to='/architecture' hash='contents' className='link annot inline-flex min-h-11 items-center text-ink-muted'>
            ↑ {page.backToTop}
          </Link>
        </div>
      </div>
    </Sheet>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'p':
      return (
        <p className='text-[1.0625rem] leading-[1.7] text-ink'>
          <RichText text={block.text} />
        </p>
      );
    case 'h':
      return <h3 className='heading pt-4 text-[1.375rem]'>{block.text}</h3>;
    case 'list':
      return (
        <ul className='space-y-2 border-l border-ink pl-5'>
          {block.items.map((item) => (
            <li key={item} className='relative text-[1.0625rem] leading-[1.6]'>
              <span aria-hidden='true' className='absolute top-[0.8em] -left-5 h-px w-3 bg-ink' />
              <RichText text={item} />
            </li>
          ))}
        </ul>
      );
    case 'note':
      return (
        <aside className='border border-ink'>
          <p className='annot border-b border-ink bg-paper-deep px-4 py-2'>{block.label}</p>
          <p className='px-4 py-3 text-[1rem] leading-[1.6]'>
            <RichText text={block.text} />
          </p>
        </aside>
      );
    case 'spec':
      return (
        <table className='w-full border-collapse border border-ink text-left'>
          <tbody>
            {block.rows.map(([label, value]) => (
              <tr key={label} className='border-b border-ink last:border-b-0'>
                <th scope='row' className='annot w-[45%] px-4 py-2.5 font-medium text-ink-muted'>
                  {label}
                </th>
                <td className='mono tnum border-l border-ink px-4 py-2.5 text-[0.875rem]'>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}
