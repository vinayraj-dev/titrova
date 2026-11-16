import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/hooks/pointerFx';

/**
 * Hero backdrop: a field of dots that breathes in slow waves and ripples away from the pointer,
 * like liquid in a dish. Drawn on one canvas; pauses when off-screen or when the tab is hidden,
 * and renders a single still frame for people who prefer reduced motion.
 */
export function DotField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext?.('2d');
    if (!canvas || !ctx) return;

    const reduced = prefersReducedMotion();
    const GAP = 26;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = true;
    const pointer = { x: -9999, y: -9999 };
    const start = performance.now();
    let ink = '20,18,43';
    let copper = '14,159,154';

    const readColors = () => {
      const cs = getComputedStyle(document.documentElement);
      ink = cs.getPropertyValue('--ink').trim().split(/\s+/).join(',') || ink;
      copper = cs.getPropertyValue('--copper').trim().split(/\s+/).join(',') || copper;
    };

    // Dots are grouped into a few opacity levels so each frame needs ~16 fill calls instead of one per dot.
    const LEVELS = 8;
    const draw = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);
      const paths: Path2D[][] = [[], []];
      for (let y = GAP / 2; y < h; y += GAP) {
        for (let x = GAP / 2; x < w; x += GAP) {
          const wave = Math.sin(x * 0.012 + t * 0.9) * Math.cos(y * 0.016 - t * 0.6);
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          const near = d < 180 ? 1 - d / 180 : 0;
          const ripple = near ? near * (0.6 + 0.4 * Math.sin(d * 0.09 - t * 6)) : 0;
          const push = near * near * 12;
          const px = d ? x + (dx / d) * push : x;
          const py = d ? y + (dy / d) * push : y;
          const alpha = Math.min(1, 0.09 + (wave + 1) * 0.05 + ripple * 0.6);
          const set = ripple > 0.03 ? 1 : 0;
          const level = Math.min(LEVELS - 1, Math.floor(alpha * LEVELS * 2));
          const path = (paths[set][level] ??= new Path2D());
          const r = Math.max(0.5, 1.05 + wave * 0.5 + ripple * 2.6);
          path.moveTo(px + r, py);
          path.arc(px, py, r, 0, 6.2832);
        }
      }
      paths.forEach((levels, set) =>
        levels.forEach((path, level) => {
          if (!path) return;
          ctx.fillStyle = `rgba(${set ? copper : ink},${((level + 0.5) / (LEVELS * 2)).toFixed(3)})`;
          ctx.fill(path);
        }),
      );
    };

    let last = 0;
    let started = false;
    const loop = (now: number) => {
      if (now - last >= 33) {
        last = now;
        draw(now);
      }
      if (visible && !reduced && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      cancelAnimationFrame(raf);
      if (started) raf = requestAnimationFrame(loop);
      else draw(performance.now());
    };
    // Paint one still frame now; start moving once the page has finished its own work.
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const begin = () => {
      started = true;
      kick();
    };
    const startTimer = setTimeout(() => (idle ? idle(begin, { timeout: 1500 }) : begin()), 1800);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      kick();
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };

    readColors();
    resize();
    const themeWatch = new MutationObserver(() => {
      readColors();
      kick();
    });
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
            if (visible) kick();
          })
        : null;
    io?.observe(canvas);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('visibilitychange', kick);

    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(raf);
      themeWatch.disconnect();
      io?.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', kick);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      style={{ WebkitMaskImage: 'linear-gradient(#000 55%, transparent)', maskImage: 'linear-gradient(#000 55%, transparent)' }}
    />
  );
}
