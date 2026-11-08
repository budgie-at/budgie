import { isDefined } from '@rnw-community/shared';

import sitemap from '../../app/sitemap';

export const buildSiteUrls = (since: Date | null = null): readonly string[] =>
    sitemap()
        .filter(entry => !isDefined(since) || !isDefined(entry.lastModified) || new Date(entry.lastModified) >= since)
        .map(entry => entry.url);
