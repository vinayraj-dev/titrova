import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  name: string;
  path: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm text-muted">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={14} aria-hidden className="opacity-60" />}
              {last ? (
                <span aria-current="page" className="font-semibold text-ink">{c.name}</span>
              ) : (
                <Link to={c.path} className="rounded-md py-1 underline-offset-4 hover:text-ink hover:underline">{c.name}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
