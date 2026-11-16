import type { MouseEvent } from 'react';
import { prefersReducedMotion } from './pointerFx';

const KEY = 'titrova-theme';

/**
 * Light is the default. The choice is stored as a single word in localStorage (no personal data),
 * and applied before first paint by the inline script in index.html.
 * Where the browser supports View Transitions, the new theme spreads out from the button.
 */
export function toggleTheme(e?: MouseEvent<HTMLElement>) {
  const root = document.documentElement;
  const next = !root.classList.contains('dark');
  const apply = () => {
    root.classList.toggle('dark', next);
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light');
    } catch {
      /* private mode: the theme simply lasts for this visit */
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next ? '#0D0C1D' : '#F4F5FA');
  };

  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (!doc.startViewTransition || prefersReducedMotion()) return apply();

  const r = e?.currentTarget.getBoundingClientRect();
  root.style.setProperty('--vt-x', `${r ? r.left + r.width / 2 : window.innerWidth / 2}px`);
  root.style.setProperty('--vt-y', `${r ? r.top + r.height / 2 : 0}px`);
  root.classList.add('theme-vt');
  doc.startViewTransition(apply).finished.finally(() => root.classList.remove('theme-vt'));
}
