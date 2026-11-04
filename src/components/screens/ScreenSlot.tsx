import type { ComponentType } from 'react';
import { screens } from '~/content/home';
import { getImage } from '~/content/images';
import { ConsoleScreen } from './ConsoleScreen';
import { MigrateCliScreen } from './MigrateCliScreen';
import { ResponsiveImage } from './ResponsiveImage';

export type ScreenName = keyof typeof screens;

/** Drawn versions of each product screen, used until one is replaced. */
const drawn: Record<ScreenName, ComponentType> = {
  console: ConsoleScreen,
  migrateCli: MigrateCliScreen
};

/**
 * One slot per product screen. Set `screens.<name>` in src/content/home.ts to
 * an image or video and every place that shows this screen uses it instead.
 */
export function ScreenSlot({ name, caption }: { name: ScreenName; caption: string }) {
  const source = screens[name];
  let body;
  if (source.kind === 'image') {
    const image = getImage(source.image);
    body = image ? (
      <ResponsiveImage image={image} alt={source.alt} className='block border border-ink' />
    ) : (
      <Missing what={`image “${source.image}”`} />
    );
  } else if (source.kind === 'video') {
    const poster = source.poster ? getImage(source.poster) : undefined;
    body = (
      <video
        className='block h-auto w-full border border-ink'
        src={source.src}
        poster={poster?.src}
        width={source.width}
        height={source.height}
        aria-label={source.alt}
        muted
        playsInline
        loop
        controls
        preload='metadata'
      />
    );
  } else {
    const Drawn = drawn[name];
    body = <Drawn />;
  }
  return (
    <figure data-screen={name}>
      {body}
      <figcaption className='annot mt-3 text-ink-muted'>{caption}</figcaption>
    </figure>
  );
}

function Missing({ what }: { what: string }) {
  return (
    <div className='hatch-ink grid aspect-[16/10] place-items-center border border-ink'>
      <p className='annot bg-paper px-2 py-1'>Missing {what}: run pnpm add-images</p>
    </div>
  );
}
