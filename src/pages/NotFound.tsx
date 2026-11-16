import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { usePalette } from '@/components/navigation/CommandPalette';
import { ToolRow } from '@/components/tools/ToolCard';
import { TOOLS } from '@/data/tools';

export default function NotFound() {
  const openPalette = usePalette();
  return (
    <>
      <Seo title="Page not found" description="This page does not exist on Titrova." path="/404" noindex />
      <div className="page grid items-center gap-x-12 gap-y-8 pt-10 sm:pt-16 lg:grid-cols-2">
        <div>
          <p className="reagent-text font-display text-[7rem] font-extrabold leading-none tracking-tighter sm:text-[10rem]" aria-hidden="true">404</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-5xl">This page does not exist</h1>
          <p className="mt-3 max-w-[46ch] text-lg text-muted">The address may be mistyped, or the page may have moved. The tools are all still here.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/" className="btn btn-primary">Go to the home page</Link>
            <button type="button" className="btn btn-soft" onClick={openPalette}>
              <Search size={17} aria-hidden /> Search the site
            </button>
          </div>
        </div>
        <ul className="space-y-2.5">
          {TOOLS.map((t) => (
            <li key={t.slug}><ToolRow tool={t} /></li>
          ))}
        </ul>
      </div>
    </>
  );
}
