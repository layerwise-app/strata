import { Link } from '@tanstack/react-router';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  /** A path like `/architecture`, an anchor like `/#latency`, or a full URL. */
  href: string;
  children: ReactNode;
};

/** One link component for config-driven hrefs: internal paths, anchors, URLs. */
export function SiteLink({ href, children, ...rest }: Props) {
  if (/^(https?:|mailto:)/.test(href)) {
    const external = href.startsWith('http');
    return (
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }
  const [path, hash] = href.split('#');
  return (
    <Link to={path || '/'} hash={hash} {...rest}>
      {children}
    </Link>
  );
}
