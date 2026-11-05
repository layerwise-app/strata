import { createFileRoute } from '@tanstack/react-router';
import { CaseStudy } from '~/components/home/CaseStudy';
import { DesignPartners } from '~/components/home/DesignPartners';
import { DevExperience } from '~/components/home/DevExperience';
import { EngineSchematic } from '~/components/home/EngineSchematic';
import { Guarantees } from '~/components/home/Guarantees';
import { Hero } from '~/components/home/Hero';
import { LatencyExplorer } from '~/components/home/LatencyExplorer';
import { homeMeta } from '~/content/home';
import { site, siteUrl } from '~/lib/site';
import { contact, siteConfig } from '~/site.config';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/')({
  head: () =>
    seo({
      title: homeMeta.title,
      description: homeMeta.description,
      path: '/',
      image: '/share/home.png',
      imageAlt: site.imageAlt,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: siteConfig.companyLegal,
          alternateName: siteConfig.company,
          url: siteUrl('/'),
          logo: siteUrl('/logo.png'),
          ...(contact.email ? { email: contact.email } : {}),
          ...(contact.social.length ? { sameAs: contact.social.map((s) => s.href) } : {}),
          numberOfEmployees: { '@type': 'QuantitativeValue', value: siteConfig.companySize },
          address: {
            '@type': 'PostalAddress',
            addressLocality: siteConfig.companyCity,
            addressCountry: 'CH'
          }
        },
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: siteConfig.product,
          applicationCategory: 'DeveloperApplication',
          applicationSubCategory: 'Distributed SQL database',
          operatingSystem: 'Linux',
          description: homeMeta.description,
          url: siteUrl('/'),
          image: siteUrl('/share/home.png'),
          publisher: { '@type': 'Organization', name: siteConfig.companyLegal },
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Design partner programme: a free production cluster through 2027.',
            url: siteUrl('/#design-partners')
          }
        }
      ]
    }),
  component: Home
});

function Home() {
  return (
    <div className='flex flex-col gap-10 sm:gap-16'>
      <Hero />
      <LatencyExplorer />
      <EngineSchematic />
      <DevExperience />
      <CaseStudy />
      <Guarantees />
      <DesignPartners />
    </div>
  );
}
