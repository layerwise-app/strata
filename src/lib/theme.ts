import { siteConfig, type FontFace } from '~/site.config';

/** CSS variables and @font-face rules built from site.config.ts. */
export function themeCss(): string {
  const { colors, fonts } = siteConfig;
  const faces = [fontFaces(fonts.sans), fontFaces(fonts.mono)].join('\n');
  return `${faces}
:root{--paper:${colors.paper};--paper-deep:${colors.paperDeep};--ink:${colors.ink};--ink-muted:${colors.muted};--ink-blue:${colors.blue};--ink-blue-deep:${colors.blueDeep};--grid:${colors.grid};--grid-major:${colors.gridMajor};--font-sans-stack:${stack(fonts.sans)};--font-mono-stack:${stack(fonts.mono)};}`;
}

/** Font files to preload in <head>. */
export function fontPreloads() {
  return [siteConfig.fonts.sans, siteConfig.fonts.mono].flatMap((font) =>
    font.files
      .filter((file) => file.preload)
      .map((file) => ({
        rel: 'preload',
        href: file.src,
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous' as const
      }))
  );
}

function fontFaces(font: FontFace): string {
  const real = font.files
    .map(
      (file) =>
        `@font-face{font-family:'${font.family}';src:url(${file.src}) format('woff2');font-weight:${file.weight};font-style:normal;font-display:swap;}`
    )
    .join('');
  const fb = font.fallback
    ? `@font-face{font-family:'${font.family} Fallback';src:local('${font.fallback.local}');size-adjust:${font.fallback.sizeAdjust};ascent-override:${font.fallback.ascentOverride};descent-override:${font.fallback.descentOverride};line-gap-override:0%;}`
    : '';
  return real + fb;
}

function stack(font: FontFace): string {
  return [`'${font.family}'`, font.fallback ? `'${font.family} Fallback'` : null, font.stack]
    .filter(Boolean)
    .join(',');
}
