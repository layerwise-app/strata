<a href="https://layerwise.app"><img src="https://layerwise.app/powered-by.png" alt="Powered by Layerwise" width="174" height="28" /></a>

# Strata

A landing page for Strata, a distributed SQL database by Ironleaf Systems,
drawn like an engineering blueprint. Every section is a numbered drawing sheet
with a title block. The site has:

- **Home** (`/`): a live drawing of six regions where you can take regions
  down, a latency explorer for 12 cities, an exploded engine schematic,
  annotated code, the Pinecart case, a spec table of guarantees, and the
  design-partner form.
- **Architecture** (`/architecture`): a long explainer with five diagrams.
- **Privacy** and **Terms**, and a 404 drawn as a blank sheet.

Ironleaf, Strata, Pinecart and every number on the site are fictional. Replace
them with your own.

It is built with TanStack Start, React, Tailwind CSS and Cloudflare Workers
(D1 for the form, Layerwise Email for notifications).

## Where things live

| What                                        | File                                     |
| ------------------------------------------- | ---------------------------------------- |
| Names, nav, buttons, social links, colors, fonts, owner email | `src/site.config.ts`   |
| All home-page copy, in page order           | `src/content/home.ts`                    |
| Regions, cities and latency numbers         | `src/content/topology.ts`                |
| Architecture page, one file per section     | `src/content/architecture/`              |
| Privacy, Terms and 404 copy                 | `src/content/legal.ts`                   |
| Images added with `pnpm add-images`         | `public/images/`, `src/content/images.json` |
| Product screens drawn in code               | `src/components/screens/`                |
| Search titles, share image, sitemap pages   | `src/lib/site.ts`                        |
| Form rules (validation, duplicates, rate limit, email cap) | `src/server/design-partner.ts` |
| Database tables                             | `src/db/schema.ts`                       |

## Rewrite the copy

- **Home**: edit `src/content/home.ts`. It is laid out in the same order as the
  page: hero, latency, engine, developers, case, guarantees, design partners.
  Each section has a `sheet` (number, name, revision, scale, date) that fills
  its title block.
- **Code samples**: `developers.sql` and `developers.client` hold the lines
  of each block, and `callouts` point at line numbers (counting from 1). If you
  add or remove lines, move the callouts' `line` values to match.
- **Latency explorer**: the 12 cities and their p50/p99 numbers are in
  `src/content/topology.ts`. The serving region is worked out from `rttMs`, so
  keep those in step with the numbers.
- **Page titles and descriptions**: `homeMeta` in `home.ts`, `architecturePage`
  in `architecture/page.ts`, and the `meta` entries in `legal.ts`.
- **Share images** (1200×630, one per page in `public/share/`) are made from the
  same copy. Run `pnpm share-images` after changing titles, colors or
  architecture sections.

## Add an item

Most lists are plain arrays. Add an entry and every place that uses it updates:
a city in `cities` (topology.ts), a guarantee row in `guarantees.rows`, an
engine layer, or a migration step.

To **add an Architecture section**:

1. Copy a file in `src/content/architecture/`, for example `05-partition.ts`
   to `06-backups.ts`. Files must be named `NN-slug.ts` and export `section`.
2. Set a new `slug`, `order: 6`, `sheet: 'B-06'`, a `title`, `revision`,
   today's `updated` date, a `summary` and the `body` blocks (`p`, `h`,
   `list`, `note`, `spec`; wrap code in backticks). `diagram` is optional;
   leave it out, or reuse one of the five drawn diagrams listed in `types.ts`.
3. Run `pnpm share-images`.

The new section shows up in the page's contents list, as its own sheet, in the
footer's sheet range, and in the sitemap's `lastmod` for `/architecture`. Link
to it with `/architecture#<slug>`.

## Replace a drawn screen

Product screens (the console in the case study, the migration CLI in the
developer section) are drawn in code. Each sits in a slot, so you can swap the
drawing for a real image or video in one place.

1. Add the image:

   ```bash
   pnpm add-images ~/Desktop/console.png --name=console
   ```

   This writes 800, 1600 and 2880 px wide WebP files (never wider than the
   original) to `public/images/`, measures them, and records them with a blurred
   placeholder in `src/content/images.json`. GIFs are copied as they are, to keep
   the animation. SVGs are rejected; draw vector art as a component instead.

2. Point the slot at it in `src/content/home.ts`:

   ```ts
   export const screens = {
     console: { kind: 'image', image: 'console', alt: 'Strata console showing six regions and their replication lag' },
     migrateCli: { kind: 'drawn' }
   };
   ```

   For a video, put the file in `public/videos/` and use
   `{ kind: 'video', src: '/videos/console.mp4', poster: 'console', alt, width, height }`.

To go back to the drawing, set the slot to `{ kind: 'drawn' }`.

## Colors and fonts

Both are in `src/site.config.ts`. They are injected as CSS variables, so the
whole site follows.

- **Colors**: `paper` is the drawing paper. `ink`, `blue` and `muted` are used
  for text, so keep each at a 4.5:1 contrast ratio or more against `paper`.
  `grid` and `gridMajor` are the faint drafting grid.
- **Fonts**: put `.woff2` files in `public/fonts/` and list them under
  `fonts.sans` (headings and body) or `fonts.mono` (annotations and code). A
  variable font needs one file with a weight range like `'300 700'`; static
  fonts need one file per weight. Mark the file used above the fold with
  `preload: true`.
- **Fallback metrics** stop text from jumping when the font arrives. Each font
  has a `fallback` drawn from a local font (Arial, Courier New) and stretched to
  match. For a new font, read its `unitsPerEm`, `hhea.ascender` and
  `hhea.descender` (opentype.js or any font inspector) and the average advance
  width of lowercase text in both fonts, then:

  ```
  sizeAdjust      = webAvgWidth / fallbackAvgWidth
  ascentOverride  = (ascender / unitsPerEm) / sizeAdjust
  descentOverride = (|descender| / unitsPerEm) / sizeAdjust
  ```

  Write them as percentages. If in doubt, delete `fallback`; the site still
  works, with a small shift when the font loads.
- The share-image script needs `.woff`, `.ttf` or `.otf` copies of the fonts
  (opentype.js cannot read `.woff2`). Put them in `scripts/fonts/`, update the
  three `font(...)` lines in `scripts/render-share-images.mjs`, and run
  `pnpm share-images`.

## The design-partner form

The form asks for a work email, company, regions and data size. On the server
it:

- checks every field again, whatever the browser sent;
- ignores bots that fill the hidden `website` field, showing them a normal
  success message;
- allows 5 tries per visitor per hour. Visitors are identified by a salted
  SHA-256 hash of their IP address; raw IPs are never stored. The salt is the
  `IP_HASH_SALT` Worker secret if you set one, or a random value created on
  first use and kept in the `app_secrets` table;
- saves the application, or tells the visitor they are already on the list if
  that email applied before (no second row is added).

**See submissions** in the Layerwise app: open **Database** and the
`design_partners` table. Choose **Local** for tests in the preview and
**Production** for the published site. `form_attempts` holds the hashed
visitor IDs used for the rate limit; old rows are cleared as new ones arrive.

**Get an email for each one**: set `ownerEmail` in `src/site.config.ts` to your
address. Strata sends at most 100 of these a day; past that it keeps saving
without email. Visitors are never emailed. In the local preview nothing is sent
for real: messages land in **Email → Local** in the Layerwise app. Published
sites send after the first publish.

## Commands

```bash
pnpm check-types     # TypeScript
pnpm lint            # oxlint
pnpm test            # Vitest: the form rules and the topology model
pnpm build           # production build
pnpm add-images <files…> [--name=key]   # prepare images (see above)
pnpm share-images    # re-render public/share/*.png
pnpm icons           # regenerate favicons from public/logo.svg
pnpm world-map       # rebuild public/world.svg from Natural Earth
pnpm db:generate --name <change>        # after editing src/db/schema.ts
pnpm db:migrate      # apply migrations to the local database
```

Layerwise runs the dev server for you and applies migrations to the production
database when you publish.

## Credits

- Coastlines: [Natural Earth](https://www.naturalearthdata.com/) 1:110m land,
  public domain. `pnpm world-map` downloads it and writes `public/world.svg`.
- [Archivo](https://github.com/Omnibus-Type/Archivo) by Omnibus-Type and
  [IBM Plex Mono](https://github.com/IBM/plex) by IBM, both under the SIL Open
  Font License 1.1 (see `public/fonts/LICENSE-*.txt`).
