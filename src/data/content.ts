import type { Lang } from '@/utils/highlight';

/** A tiny content model so documentation stays as data and renders consistently. Backticks mark inline code. */
export type Block =
  | { h: string }
  | { h3: string }
  | { p: string }
  | { ul: string[] }
  | { ol: string[] }
  | { code: string; lang: Lang; label?: string }
  | { note: string }
  | { table: string[][]; head: string[]; caption?: string };

export interface Faq {
  q: string;
  a: string;
}

export interface ToolContent {
  /** Short ordered steps: this is a real sequence. */
  steps: string[];
  features: string[];
  limitations: string[];
  article: Block[];
  faqs: Faq[];
}
