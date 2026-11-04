/// <reference types="vite/client" />
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import type * as React from 'react';
import { BlueprintDefs } from '~/components/blueprint/Defs';
import { DefaultCatchBoundary } from '~/components/DefaultCatchBoundary';
import { NotFound } from '~/components/NotFound';
import { Footer } from '~/components/site/Footer';
import { Header } from '~/components/site/Header';
import { notFound } from '~/content/legal';
import { site } from '~/lib/site';
import { fontPreloads, themeCss } from '~/lib/theme';
import { siteConfig } from '~/site.config';
import { seo } from '~/utils/seo';
import '~/styles/app.css';

export const Route = createRootRoute({
  // Site-wide defaults; each page's `seo()` overrides tags with the same name.
  head: ({ match }) => {
    const defaults = match._notFound
      ? seo({
          title: notFound.meta.title,
          description: notFound.meta.description,
          image: '/share/not-found.png',
          imageAlt: 'A blank Strata drawing sheet stamped “Sheet not found”',
          noindex: true
        })
      : seo({ title: site.name, description: site.description });
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: siteConfig.colors.paper },
        ...(site.googleSiteVerification
          ? [
              {
                name: 'google-site-verification',
                content: site.googleSiteVerification
              }
            ]
          : []),
        ...defaults.meta
      ],
      links: [
        ...fontPreloads(),
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ]
    };
  },
  errorComponent: (props) => (
    <RootDocument>
      <DefaultCatchBoundary {...props} />
    </RootDocument>
  ),
  notFoundComponent: () => <NotFound />,
  component: RootComponent
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
        <HeadContent />
      </head>
      <body>
        <BlueprintDefs />
        <Header />
        <main id='main' tabIndex={-1} className='outline-none'>
          {children}
        </main>
        <Footer />
        <Scripts />
      </body>
    </html>
  );
}
