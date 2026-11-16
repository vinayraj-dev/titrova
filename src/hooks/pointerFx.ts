import type { PointerEvent } from 'react';

/** Feed pointer position into CSS variables: --mx/--my for the spotlight, --rx/--ry for the tilt. */
export function pointerFx(e: PointerEvent<HTMLElement>, tilt = 0) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  el.style.setProperty('--mx', `${x}px`);
  el.style.setProperty('--my', `${y}px`);
  if (tilt && e.pointerType === 'mouse') {
    el.style.setProperty('--ry', `${((x / r.width - 0.5) * tilt).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${((0.5 - y / r.height) * tilt).toFixed(2)}deg`);
  }
}

export function pointerFxReset(e: PointerEvent<HTMLElement>) {
  e.currentTarget.style.removeProperty('--rx');
  e.currentTarget.style.removeProperty('--ry');
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
