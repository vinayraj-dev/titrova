import type { ComponentProps } from 'react';
import { Link } from 'react-router-dom';
import type { ToolMeta } from '@/data/tools';

/** Links to a tool. Standalone tools (in public/) need a full page load, so they get a plain <a>. */
export function ToolLink({ tool, hash = '', ...props }: { tool: ToolMeta; hash?: string } & Omit<ComponentProps<'a'>, 'href'>) {
  if (tool.staticPage) return <a href={tool.path + hash} {...props} />;
  return <Link to={tool.path + hash} {...props} />;
}
