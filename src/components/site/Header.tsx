import { Link } from '@tanstack/react-router';
import { useEffect, useId, useRef, useState } from 'react';
import { siteConfig } from '~/site.config';
import { LogoMark } from './Logo';
import { SiteLink } from './SiteLink';

export function Header() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className='sticky top-0 z-40 border-b border-ink bg-paper'>
      <a
        href='#main'
        className='btn btn-primary sr-only-focusable absolute top-2 left-2 z-50'
      >
        Skip to content
      </a>
      <div className='mx-auto flex h-14 max-w-[1360px] items-stretch px-4 sm:px-6 lg:px-8'>
        <Link
          to='/'
          className='-ml-2 flex min-h-11 items-center gap-2.5 pr-4 pl-2'
          aria-label={`${siteConfig.product} home`}
        >
          <LogoMark size={26} />
          <span className='text-[1.1875rem] leading-none font-[580] tracking-[-0.02em]'>
            {siteConfig.product}
          </span>
          <span className='annot-xs hidden pt-0.5 text-ink-muted xl:inline'>
            by {siteConfig.company}
          </span>
        </Link>

        <nav aria-label='Main' className='ml-auto hidden items-stretch lg:flex'>
          <ul className='flex items-stretch'>
            {siteConfig.nav.map((item) => (
              <li key={item.href} className='flex'>
                <SiteLink
                  href={item.href}
                  className='annot flex items-center px-3.5 text-ink transition-colors hover:text-ink-blue'
                >
                  {item.label}
                </SiteLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className='ml-auto flex items-center gap-2 lg:ml-5'>
          <SiteLink href={siteConfig.cta.href} className='btn btn-primary px-3.5 sm:px-4'>
            <span className='sm:hidden'>{siteConfig.cta.primaryShort}</span>
            <span className='hidden sm:inline'>{siteConfig.cta.primary}</span>
          </SiteLink>
          <button
            ref={buttonRef}
            type='button'
            className='btn btn-secondary w-11 px-0 lg:hidden'
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
          >
            <span className='sr-only'>{open ? 'Close menu' : 'Open menu'}</span>
            <MenuGlyph open={open} />
          </button>
        </div>
      </div>

      <nav
        id={panelId}
        aria-label='Menu'
        hidden={!open}
        className='border-t border-ink bg-paper lg:hidden'
      >
        <ul className='mx-auto max-w-[1360px] px-4 py-2 sm:px-6'>
          {siteConfig.nav.map((item, i) => (
            <li key={item.href} className='rule-b last:border-b-0'>
              <SiteLink
                href={item.href}
                className='flex min-h-12 items-center gap-4 text-[1.0625rem]'
                onClick={() => setOpen(false)}
              >
                <span className='annot-xs w-10 text-ink-muted'>
                  {String(i + 2).padStart(2, '0')}
                </span>
                {item.label}
              </SiteLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

function MenuGlyph({ open }: { open: boolean }) {
  return (
    <svg width='18' height='18' viewBox='0 0 18 18' aria-hidden='true'>
      {open ? (
        <path d='M3 3L15 15M15 3L3 15' stroke='currentColor' strokeWidth='1.25' />
      ) : (
        <path d='M2 5H16M2 9H16M2 13H16' stroke='currentColor' strokeWidth='1.25' />
      )}
    </svg>
  );
}
