import { createElement, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type Kind = 'up' | 'rise' | 'left' | 'right' | 'clip' | 'pop';

interface Props {
  as?: 'div' | 'section' | 'li' | 'span' | 'article' | 'h2' | 'p';
  kind?: Kind;
  /** Delay in milliseconds, for staggering siblings. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  id?: string;
}

/**
 * Reveals its content the first time it scrolls into view.
 * The hidden state only applies when JavaScript is running (html.js), so prerendered HTML stays readable.
 */
export function Reveal({ as = 'div', kind = 'up', delay = 0, className, style, children, id }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.04 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return createElement(
    as,
    {
      ref,
      id,
      className,
      'data-reveal': kind,
      'data-in': shown ? '' : undefined,
      style: { ...style, '--d': `${delay}ms` } as CSSProperties,
    },
    // The wipe is applied to an inner wrapper: clipping the observed element itself
    // would give it no visible area, and it would never be reported as "in view".
    kind === 'clip' ? createElement('span', { className: 'clip-inner' }, children) : children,
  );
}
