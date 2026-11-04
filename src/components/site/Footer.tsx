import { Link } from '@tanstack/react-router';
import { architectureSections, architectureUpdated } from '~/content/architecture';
import { caseStudy, designPartners, developers, engine, guarantees, hero, latency } from '~/content/home';
import { privacy, terms } from '~/content/legal';
import { siteConfig } from '~/site.config';
import { LogoMark } from './Logo';
import { SiteLink } from './SiteLink';

const productLinks = [
  { label: 'Live system', href: '/#system' },
  { label: 'Latency', href: '/#latency' },
  { label: 'Engine', href: '/#engine' },
  { label: 'Developers', href: '/#developers' },
  { label: 'Pinecart case', href: '/#case' },
  { label: 'Guarantees', href: '/#guarantees' }
];

// The copyright year is the year of the newest sheet revision. Reading the
// clock here would not work: Workers start with it at 1970 while modules load.
const year = [
  architectureUpdated,
  ...[hero, latency, engine, developers, caseStudy, guarantees, designPartners, privacy, terms].map(
    (s) => s.sheet.date
  )
]
  .filter((d) => /^\d{4}-/.test(d))
  .sort()
  .at(-1)
  ?.slice(0, 4);

export function Footer() {
  const social = siteConfig.social.filter((s) => s.href);
  return (
    <footer className='mt-16 border-t border-ink bg-paper'>
      <div className='mx-auto grid max-w-[1360px] gap-x-8 gap-y-10 px-4 py-12 sm:px-6 md:grid-cols-12 lg:px-8'>
        <div className='md:col-span-5'>
          <Link to='/' className='inline-flex min-h-11 items-center gap-2.5'>
            <LogoMark size={26} />
            <span className='text-[1.1875rem] leading-none font-[580] tracking-[-0.02em]'>
              {siteConfig.product}
            </span>
          </Link>
          <p className='body-copy mt-3 max-w-sm'>{siteConfig.tagline}</p>
          <p className='annot mt-5 text-ink-muted'>
            {siteConfig.companyLegal} · {siteConfig.companyCity},{' '}
            {siteConfig.companyCountry}
          </p>
          <div className='mt-6'>
            <SiteLink href={siteConfig.cta.href} className='btn btn-primary'>
              {siteConfig.cta.primary}
            </SiteLink>
          </div>
        </div>

        <nav aria-label='Footer' className='grid grid-cols-2 gap-8 md:col-span-4'>
          <div>
            <h2 className='annot text-ink-muted'>Product</h2>
            <ul className='mt-3'>
              {productLinks.map((l) => (
                <li key={l.href}>
                  <SiteLink href={l.href} className='link inline-flex min-h-11 items-center md:min-h-9'>
                    {l.label}
                  </SiteLink>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className='annot text-ink-muted'>Company</h2>
            <ul className='mt-3'>
              <li>
                <Link to='/architecture' className='link inline-flex min-h-11 items-center md:min-h-9'>
                  Architecture
                </Link>
              </li>
              <li>
                <Link to='/privacy' className='link inline-flex min-h-11 items-center md:min-h-9'>
                  Privacy
                </Link>
              </li>
              <li>
                <Link to='/terms' className='link inline-flex min-h-11 items-center md:min-h-9'>
                  Terms
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className='link inline-flex min-h-11 items-center md:min-h-9 break-all'
                >
                  {siteConfig.contactEmail}
                </a>
              </li>
              {social.map((s) => (
                <li key={s.label}>
                  <SiteLink href={s.href} className='link inline-flex min-h-11 items-center md:min-h-9'>
                    {s.label}
                  </SiteLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className='flex flex-col items-start gap-4 md:col-span-3 md:items-end'>
          <a
            href='https://layerwise.app'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex min-h-11 items-center'
          >
            <img
              src='https://layerwise.app/powered-by.png'
              alt='Powered by Layerwise'
              width={174}
              height={28}
              loading='lazy'
              decoding='async'
            />
          </a>
        </div>
      </div>

      <div className='border-t border-rule'>
        <div className='annot-xs mx-auto flex max-w-[1360px] flex-wrap justify-between gap-x-6 gap-y-2 px-4 py-4 text-ink-muted sm:px-6 lg:px-8'>
          <span>
            © {year} {siteConfig.companyLegal}
          </span>
          <span>
            Drawing set {siteConfig.product.toUpperCase()}-WEB · Sheets A-01 to A-07,{' '}
            {architectureSections[0]?.sheet} to {architectureSections.at(-1)?.sheet}
          </span>
        </div>
      </div>
    </footer>
  );
}
