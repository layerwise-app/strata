import { createFileRoute } from '@tanstack/react-router';
import { LegalPage } from '~/components/LegalPage';
import { terms } from '~/content/legal';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/terms')({
  head: () =>
    seo({
      title: terms.meta.title,
      description: terms.meta.description,
      path: '/terms',
      image: '/share/terms.png',
      imageAlt: 'Strata terms drawing sheet'
    }),
  component: () => <LegalPage page={terms} />
});
