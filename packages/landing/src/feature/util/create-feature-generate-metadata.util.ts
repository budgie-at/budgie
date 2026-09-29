import { getI18nInstance } from '../../i18n/app-router-i18n';

import { buildFeaturePageMetadata } from './build-feature-page-metadata.util';

import type { PageLangParam } from '../../i18n/init-lingui';
import type { FeatureRegistryEntryInterface } from '../interface/feature-registry-entry.interface';
import type { Metadata } from 'next';

export const createFeatureGenerateMetadata =
    (meta: FeatureRegistryEntryInterface) =>
    async (props: PageLangParam): Promise<Metadata> => {
        const { lang } = await props.params;
        const i18n = getI18nInstance(lang);

        return buildFeaturePageMetadata({
            locale: lang,
            slug: meta.slug,
            title: i18n._(meta.metaTitle),
            description: i18n._(meta.metaDescription),
            keywords: meta.seoKeywords.join(', '),
            publishedAt: meta.publishedAt,
            updatedAt: meta.updatedAt
        });
    };
