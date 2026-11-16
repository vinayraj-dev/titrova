import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AdSlot } from '@/components/ads/AdSlot';
import { AnnouncerProvider } from '@/components/common/Announcer';
import { PaletteProvider } from '@/components/navigation/CommandPalette';
import { analyticsToken, isSingleFile } from '@/data/site';
import { Footer } from './Footer';
import { Header } from './Header';

export function Layout({ children }: { children: ReactNode }) {
  const { pathname, hash } = useLocation();

  // New page → top of page (or to the #anchor) and move keyboard focus to the content.
  useEffect(() => {
    if (hash) {
      // The target page may still be loading, so look for the anchor for up to two seconds.
      let tries = 0;
      let timer: ReturnType<typeof setTimeout>;
      const find = () => {
        const el = document.getElementById(hash.slice(1));
        if (el) el.scrollIntoView();
        else if (tries++ < 20) timer = setTimeout(find, 100);
      };
      find();
      return () => clearTimeout(timer);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  // Marks the moment the page becomes interactive (used by the end-to-end tests).
  useEffect(() => {
    document.documentElement.dataset.ready = 'true';
  }, []);

  // Optional cookieless analytics, only if a token was configured at build time.
  useEffect(() => {
    if (!analyticsToken || isSingleFile || document.querySelector('script[data-cf-beacon]')) return;
    const s = document.createElement('script');
    s.defer = true;
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    s.setAttribute('data-cf-beacon', JSON.stringify({ token: analyticsToken }));
    document.head.appendChild(s);
  }, []);

  return (
    <AnnouncerProvider>
      <PaletteProvider>
        <a
          href="#main"
          className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-xl bg-ink px-4 py-2.5 font-semibold text-paper transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <Header />
        <AdSlot placement="header" className="page mt-3 max-w-[60rem]" />
        <main id="main" key={pathname} className="route-view" tabIndex={-1} style={{ outline: 'none' }}>
          {children}
        </main>
        <AdSlot placement="footer" className="page mt-16 max-w-[60rem]" />
        <Footer />
      </PaletteProvider>
    </AnnouncerProvider>
  );
}
