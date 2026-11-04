import { createFileRoute } from '@tanstack/react-router';
import { architectureUpdated } from '~/content/architecture';
import { designPartners, guarantees, hero } from '~/content/home';
import { privacy, terms } from '~/content/legal';
import { sitemapPaths, siteUrl } from '~/lib/site';

// Last change per page, from the content that page shows.
const lastModified: Record<string, string> = {
  '/': [hero.sheet.date, guarantees.sheet.date, designPartners.sheet.date].sort().at(-1) ?? '',
  '/architecture': architectureUpdated,
  '/privacy': privacy.sheet.date,
  '/terms': terms.sheet.date
};

// Lists `sitemapPaths`. Pages built from data, like one per product, can be
// added here by querying the database for their paths.
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => {
        const urls = sitemapPaths
          .map((path) => {
            const lastmod = lastModified[path];
            return `  <url><loc>${escapeXml(siteUrl(path))}</loc>${
              lastmod ? `<lastmod>${lastmod}</lastmod>` : ''
            }</url>`;
          })
          .join('\n');
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
          { headers: { 'content-type': 'application/xml; charset=utf-8' } }
        );
      }
    }
  }
});

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
