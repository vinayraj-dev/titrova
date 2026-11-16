const env = import.meta.env;

/** Everything that identifies the site lives here (or in environment variables). */
export const site = {
  name: 'Titrova',
  tagline: 'Free Tools for Salesforce Developers.',
  url: (env.VITE_SITE_URL || 'https://titrova.pages.dev').replace(/\/$/, ''),
  contactEmail: (env.VITE_CONTACT_EMAIL as string | undefined) || '',
  repoUrl: (env.VITE_REPO_URL as string | undefined) || 'https://github.com/vinayraj-dev/titrova',
  author: (env.VITE_AUTHOR_NAME as string | undefined) ?? 'Kappa Vinay',
  disclaimer:
    'Titrova is an independent developer utility platform and is not affiliated with or endorsed by Salesforce, Inc.',
  legalUpdated: '15 November 2026',
  legalUpdatedIso: '2026-11-15',
};

/**
 * Advertising is OFF unless VITE_ADS_ENABLED=true and a publisher id is set.
 * No ad script is loaded and no placeholder is rendered while it is off.
 */
export const ads = {
  enabled: env.VITE_ADS_ENABLED === 'true' && !!env.VITE_ADSENSE_CLIENT,
  client: (env.VITE_ADSENSE_CLIENT as string | undefined) || '',
  slots: {
    header: (env.VITE_AD_SLOT_HEADER as string | undefined) || '',
    sidebar: (env.VITE_AD_SLOT_SIDEBAR as string | undefined) || '',
    content: (env.VITE_AD_SLOT_CONTENT as string | undefined) || '',
    footer: (env.VITE_AD_SLOT_FOOTER as string | undefined) || '',
  },
};
export type AdPlacement = keyof typeof ads.slots;

/** Optional cookieless analytics. Empty = no analytics script at all. */
export const analyticsToken = (env.VITE_CF_ANALYTICS_TOKEN as string | undefined) || '';

/** True in the single-file preview build, where there is no real URL routing. */
export const isSingleFile = env.MODE === 'singlefile';
