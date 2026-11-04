/**
 * Where a product screen comes from. Every screen starts as a drawing in code;
 * point it at an image (added with `pnpm add-images`) or a video instead.
 */
export type ScreenSource =
  | { kind: 'drawn' }
  | {
      kind: 'image';
      /** Key in src/content/images.json, the file name without extension. */
      image: string;
      alt: string;
    }
  | {
      kind: 'video';
      /** File in public/, like /videos/console.mp4 */
      src: string;
      /** Optional still from src/content/images.json, shown before it plays. */
      poster?: string;
      /** What the video shows, for people who can't see it. */
      alt: string;
      width: number;
      height: number;
    };
