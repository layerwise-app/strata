/**
 * Site-wide settings for the Strata template. Change names, navigation, calls
 * to action, colors and fonts here; every page reads from this file.
 */

export type NavItem = { label: string; href: string };
export type SocialLink = { label: string; href: string };

export type FontFace = {
  /** CSS family name used in the stylesheet. */
  family: string;
  /** Files in `public/fonts/`, one per weight (or one variable file). */
  files: { src: string; weight: string; preload?: boolean }[];
  /**
   * A local font shaped to match this one while the file loads, so text never
   * jumps when the real font arrives. Measure new fonts with the numbers in
   * README → Fonts, or delete `fallback` to use the generic one.
   */
  fallback?: {
    local: string;
    sizeAdjust: string;
    ascentOverride: string;
    descentOverride: string;
  };
  /** Generic families after the fallback. */
  stack: string;
};

export const siteConfig = {
  company: 'Ironleaf Systems',
  companyLegal: 'Ironleaf Systems AG',
  companyCity: 'Zurich',
  companyCountry: 'Switzerland',
  companySize: 40,
  product: 'Strata',
  tagline: 'Distributed SQL that keeps a copy of your data close to every user.',
  /** Public contact address shown on Privacy and Terms (not a form target). */
  contactEmail: 'hello@ironleaf.example',

  /**
   * New design-partner sign-ups are emailed here (at most 100 a day). Leave it
   * empty to only save them to the database. Visitors are never emailed.
   */
  ownerEmail: '',

  nav: [
    { label: 'Latency', href: '/#latency' },
    { label: 'Engine', href: '/#engine' },
    { label: 'Developers', href: '/#developers' },
    { label: 'Guarantees', href: '/#guarantees' },
    { label: 'Architecture', href: '/architecture' }
  ] satisfies NavItem[],

  cta: {
    /** Every button that asks a visitor to act leads to the sign-up form. */
    primary: 'Become a design partner',
    /** Shorter label for the header on phones. */
    primaryShort: 'Design partner',
    href: '/#design-partners',
    secondary: 'Read the architecture',
    secondaryHref: '/architecture'
  },

  /** Shown in the footer when `href` is set. */
  social: [
    { label: 'GitHub', href: '' },
    { label: 'LinkedIn', href: '' },
    { label: 'Mastodon', href: '' }
  ] satisfies SocialLink[],

  /**
   * Ink and paper. Keep `ink`, `blue` and `muted` at 4.5:1 or more against
   * `paper` so body text stays readable.
   */
  colors: {
    paper: '#f4f2ec',
    paperDeep: '#ebe8df',
    ink: '#15171b',
    muted: '#4b505c',
    blue: '#1f45b5',
    blueDeep: '#17358c',
    /** Grid lines on the drafting paper; keep them faint. */
    grid: 'rgba(31, 69, 181, 0.065)',
    gridMajor: 'rgba(31, 69, 181, 0.11)'
  },

  fonts: {
    sans: {
      family: 'Archivo',
      files: [
        { src: '/fonts/archivo-latin-wght.woff2', weight: '100 900', preload: true }
      ],
      fallback: {
        local: 'Arial',
        sizeAdjust: '98.1%',
        ascentOverride: '89.5%',
        descentOverride: '21.4%'
      },
      stack: 'ui-sans-serif, system-ui, sans-serif'
    },
    mono: {
      family: 'IBM Plex Mono',
      files: [
        { src: '/fonts/ibm-plex-mono-latin-400.woff2', weight: '400', preload: true },
        { src: '/fonts/ibm-plex-mono-latin-500.woff2', weight: '500', preload: true }
      ],
      fallback: {
        local: 'Courier New',
        sizeAdjust: '100%',
        ascentOverride: '102.5%',
        descentOverride: '27.5%'
      },
      stack: 'ui-monospace, Menlo, monospace'
    }
  } satisfies Record<'sans' | 'mono', FontFace>
};

export type SiteConfig = typeof siteConfig;
