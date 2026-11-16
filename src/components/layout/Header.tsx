import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, Moon, Search, Sun, X } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { usePalette } from '@/components/navigation/CommandPalette';
import { CATEGORIES, TOOLS, toolsInCategory } from '@/data/tools';
import { site } from '@/data/site';
import { toggleTheme } from '@/hooks/useTheme';
import { cn } from '@/utils/io';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/tools', label: 'Tools' },
  { to: '/guides', label: 'Guides' },
  { to: '/about', label: 'About' },
];

export function Header() {
  const { pathname } = useLocation();
  const openPalette = usePalette();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [cats, setCats] = useState(false);
  const [pill, setPill] = useState<{ x: number; w: number; h: number; y: number } | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const catsRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 12);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progressRef.current?.style.setProperty('--p', max > 0 ? String(Math.min(1, window.scrollY / max)) : '0');
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  useEffect(() => {
    setMenu(false);
    setCats(false);
  }, [pathname]);

  useEffect(() => {
    if (!menu) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  useEffect(() => {
    if (!cats) return;
    const onDown = (e: PointerEvent) => !catsRef.current?.contains(e.target as Node) && setCats(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCats(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [cats]);

  const hover = (el: HTMLElement) => {
    const nav = navRef.current;
    if (!nav) return;
    const a = el.getBoundingClientRect();
    const b = nav.getBoundingClientRect();
    setPill({ x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height });
  };

  const navItem = 'relative z-10 flex h-10 items-center rounded-[10px] px-3 text-[0.95rem] font-semibold text-muted transition-colors hover:text-ink aria-[current=page]:text-ink';

  return (
    <>
      <div ref={progressRef} className="scroll-progress" aria-hidden="true" />
      <header
        className="site-header sticky z-50"
        data-scrolled={scrolled || menu}
        style={{ top: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="page flex h-16 items-center gap-2 sm:h-[4.5rem]">
          <Link to="/" className="mr-auto flex items-center gap-2.5 rounded-xl py-1 pr-2 lg:mr-6" aria-label={`${site.name} home`}>
            <Logo />
            <span className="font-display text-[1.15rem] font-bold leading-none tracking-tight">{site.name}</span>
          </Link>

          <nav ref={navRef} aria-label="Main" className="relative hidden items-center lg:mr-auto lg:flex" onPointerLeave={() => setPill(null)}>
            <span
              className="nav-pill"
              aria-hidden="true"
              style={pill ? { transform: `translate(${pill.x}px, ${pill.y}px)`, width: pill.w, height: pill.h, opacity: 1 } : { opacity: 0 }}
            />
            {LINKS.slice(0, 2).map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={navItem} onPointerEnter={(e) => hover(e.currentTarget)}>
                {l.label}
              </NavLink>
            ))}
            <div ref={catsRef} className="relative">
              <button
                type="button"
                className={cn(navItem, 'gap-1')}
                aria-expanded={cats}
                aria-controls="categories-menu"
                onClick={() => setCats((c) => !c)}
                onPointerEnter={(e) => hover(e.currentTarget)}
              >
                Categories
                <ChevronDown size={16} aria-hidden className={cn('transition-transform duration-300', cats && 'rotate-180')} />
              </button>
              {cats && (
                <div id="categories-menu" className="pop-in absolute left-1/2 top-full z-50 mt-2 w-[36rem] -translate-x-1/2 rounded-3xl border border-line bg-surface p-2 shadow-panel">
                  <ul className="grid grid-cols-2 gap-1">
                    {CATEGORIES.map((c) => (
                      <li key={c.id}>
                        <Link to={`/${c.slug}`} className="flex h-full items-start gap-3 rounded-2xl p-3 transition-colors hover:bg-sunken">
                          <span className="emoji-bubble sm" aria-hidden="true">{c.emoji}</span>
                          <span>
                            <span className="block font-semibold leading-tight">{c.name}</span>
                            <span className="mt-0.5 block text-sm leading-snug text-muted">
                              {toolsInCategory(c.id).length} {toolsInCategory(c.id).length === 1 ? 'tool' : 'tools'}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                    <li className="col-span-2">
                      <Link to="/tools" className="flex items-center justify-between rounded-2xl bg-ink px-4 py-3 font-semibold text-paper">
                        <span><span aria-hidden="true">🧪</span> Open the tool dashboard</span>
                        <span className="text-sm opacity-80">{TOOLS.length} tools</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            {LINKS.slice(2).map((l) => (
              <NavLink key={l.to} to={l.to} className={navItem} onPointerEnter={(e) => hover(e.currentTarget)}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={openPalette}
            className="flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-muted transition-colors hover:border-ink/40 hover:text-ink md:w-56"
            aria-keyshortcuts="Control+K Meta+K"
          >
            <Search size={17} aria-hidden />
            <span className="sr-only md:not-sr-only">Search tools</span>
            <kbd aria-hidden="true" className="ml-auto hidden rounded-md border border-line bg-sunken px-1.5 py-0.5 font-sans text-xs font-semibold md:inline">Ctrl K</kbd>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface text-ink transition-all duration-300 hover:rotate-12 hover:border-ink/40"
            aria-label="Switch between light and dark theme"
          >
            <Moon size={18} aria-hidden className="theme-moon" />
            <Sun size={18} aria-hidden className="theme-sun" />
          </button>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-xl bg-ink text-paper lg:hidden"
            aria-expanded={menu}
            aria-controls="mobile-menu"
            aria-label={menu ? 'Close menu' : 'Open menu'}
            onClick={() => setMenu((m) => !m)}
          >
            {menu ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>

        {menu && (
          <nav
            id="mobile-menu"
            aria-label="Mobile"
            className="absolute inset-x-0 top-full overflow-y-auto border-t border-line bg-paper lg:hidden"
            style={{ height: 'calc(100dvh - 4rem - env(safe-area-inset-top, 0px))' }}
          >
            <div className="page grid gap-6 py-6 sm:grid-cols-2">
              <ul className="space-y-1">
                {[...LINKS, { to: '/contact', label: 'Contact' }].map((l, i) => (
                  <li key={l.to} className="menu-item" style={{ '--i': i } as React.CSSProperties}>
                    <NavLink to={l.to} end={l.to === '/'} className="block rounded-2xl px-4 py-2.5 font-display text-3xl font-semibold tracking-tight aria-[current=page]:bg-ink aria-[current=page]:text-paper">
                      {l.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
              <div className="space-y-5">
                <div className="menu-item" style={{ '--i': 5 } as React.CSSProperties}>
                  <p className="px-1 text-sm font-semibold text-muted">Categories</p>
                  <ul className="mt-2 grid grid-cols-2 gap-2">
                    {CATEGORIES.map((c) => (
                      <li key={c.id}>
                        <Link to={`/${c.slug}`} className="card flex h-full items-center gap-2 px-3 py-2.5 text-[0.93rem] font-semibold leading-tight">
                          <span aria-hidden="true" className="text-lg">{c.emoji}</span> {c.short}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="menu-item" style={{ '--i': 7 } as React.CSSProperties}>
                  <p className="px-1 text-sm font-semibold text-muted">Popular tools</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {TOOLS.slice(0, 8).map((t) => (
                      <li key={t.slug}>
                        <Link to={t.path} className="chip"><span aria-hidden="true">{t.emoji}</span> {t.short}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
