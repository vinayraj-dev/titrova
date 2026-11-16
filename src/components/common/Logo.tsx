/** The flask mark. Drawn inline so it follows the theme and needs no network request. */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id="logo-liquid" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="rgb(var(--iodine))" />
          <stop offset="1" stopColor="rgb(var(--copper))" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="17" fill="rgb(var(--ink))" />
      <path
        d="M26 12h12M28 12v14L15 47a4 4 0 0 0 3.4 6h27.2a4 4 0 0 0 3.4-6L36 26V12"
        fill="none"
        stroke="rgb(var(--paper))"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M21.5 41h21l4 7.5a1 1 0 0 1-.9 1.5H18.4a1 1 0 0 1-.9-1.5z" fill="url(#logo-liquid)" />
    </svg>
  );
}
