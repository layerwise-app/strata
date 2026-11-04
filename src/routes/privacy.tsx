import { createFileRoute } from '@tanstack/react-router';
import { LegalPage } from '~/components/LegalPage';
import { privacy } from '~/content/legal';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/privacy')({
  head: () =>
    seo({
      title: privacy.meta.title,
      description: privacy.meta.description,
      path: '/privacy',
      image: '/share/privacy.png',
      imageAlt: 'Strata privacy drawing sheet'
    }),
  component: () => <LegalPage page={privacy} />
});
