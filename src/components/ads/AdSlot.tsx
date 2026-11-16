import { useEffect, useRef } from 'react';
import { ads, type AdPlacement } from '@/data/site';
import { cn } from '@/utils/io';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

let scriptRequested = false;
function loadAdSense() {
  if (scriptRequested || typeof document === 'undefined') return;
  scriptRequested = true;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ads.client)}`;
  document.head.appendChild(s);
}

const MIN_HEIGHT: Record<AdPlacement, number> = { header: 90, sidebar: 250, content: 250, footer: 90 };

/**
 * One reusable ad placement.
 *
 * Renders NOTHING — no script, no placeholder, no fake ad — unless advertising has been switched on
 * with environment variables (see README → "Turning on advertising") and this placement has a slot id.
 * When on, space is reserved up front so the page does not shift while the ad loads, and every unit
 * is clearly labelled and kept away from tool inputs and outputs.
 */
export function AdSlot({ placement, className }: { placement: AdPlacement; className?: string }) {
  const slot = ads.slots[placement];
  const active = ads.enabled && !!slot;
  const pushed = useRef(false);

  useEffect(() => {
    if (!active || pushed.current) return;
    pushed.current = true;
    loadAdSense();
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* an ad failing to load must never break a tool */
    }
  }, [active]);

  if (!active) return null;
  return (
    <aside aria-label="Advertisement" className={cn('mx-auto w-full', className)}>
      <p className="mb-1 text-center text-xs text-muted">Advertisement</p>
      <ins
        className="adsbygoogle block overflow-hidden rounded-xl"
        style={{ display: 'block', minHeight: MIN_HEIGHT[placement] }}
        data-ad-client={ads.client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
