/* oxlint-disable lingui/no-unlocalized-strings */
import { BASE_URL } from '../../generic/constant/seo.constant';
import { FEATURE_REGISTRY } from '../constant/feature-registry.constant';

import type { I18n } from '@lingui/core';

export const buildFeaturesItemListJsonLd = (i18n: I18n, locale: string): Record<string, unknown> => ({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Budgie Features',
    url: `${BASE_URL}/${locale}/features`,
    itemListElement: FEATURE_REGISTRY.map((entry, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: i18n._(entry.title),
        url: `${BASE_URL}/${locale}/features/${entry.slug}`
    }))
});
