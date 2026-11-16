import { useRef, type ReactNode } from 'react';
import { prefersReducedMotion } from '@/hooks/pointerFx';

/** Pulls its child a few pixels toward the pointer. Mouse only; does nothing for touch or reduced motion. */
export function Magnetic({ children, strength = 0.28, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span
      ref={ref}
      className={className}
      style={{ display: 'inline-flex', transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || prefersReducedMotion() || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * strength;
        const dy = (e.clientY - (r.top + r.height / 2)) * strength;
        ref.current.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = '';
      }}
    >
      {children}
    </span>
  );
}
