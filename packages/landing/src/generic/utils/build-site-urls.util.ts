import sitemap from '../../app/sitemap';

export const buildSiteUrls = (): readonly string[] => sitemap().map(entry => entry.url);
