import type { ImageAsset } from '~/content/images';

/** An image from `pnpm add-images`: WebP srcset, fixed size, blur placeholder. */
export function ResponsiveImage({
  image,
  alt,
  sizes = '(min-width: 1024px) 60vw, 100vw',
  className,
  priority = false
}: {
  image: ImageAsset;
  alt: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={image.src}
      srcSet={image.type === 'image/gif' ? undefined : image.srcset.map((s) => `${s.src} ${s.width}w`).join(', ')}
      sizes={image.type === 'image/gif' ? undefined : sizes}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding='async'
      className={className}
      style={{
        backgroundImage: `url(${image.blur})`,
        backgroundSize: 'cover',
        height: 'auto',
        width: '100%'
      }}
    />
  );
}
