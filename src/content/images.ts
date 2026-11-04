import manifest from './images.json';

/**
 * Images prepared by `pnpm add-images` (see scripts/add-images.mjs). The
 * script writes images.json; don't edit it by hand.
 */
export type ImageAsset = {
  /** Largest version, used as the fallback `src`. */
  src: string;
  width: number;
  height: number;
  /** WebP versions at 800, 1600 and 2880 px wide (fewer if the source is smaller). */
  srcset: { src: string; width: number }[];
  /** Tiny blurred preview as a data URL, shown while the image loads. */
  blur: string;
  type: 'image/webp' | 'image/gif';
};

export const images = manifest as Record<string, ImageAsset>;

export function getImage(key: string): ImageAsset | undefined {
  return images[key];
}
