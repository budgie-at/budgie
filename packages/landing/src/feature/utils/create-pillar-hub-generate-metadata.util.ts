import { buildPageMetadata } from '../../generic/utils/build-page-metadata.util';
import { getI18nInstance } from '../../i18n/app-router-i18n';

import type { PageLangParam } from '../../i18n/init-lingui';
import type { PillarHubMetadataInterface } from '../interface/pillar-hub-metadata.interface';
import type { Metadata } from 'next';

export const createPillarHubGenerateMetadata =
    (meta: PillarHubMetadataInterface) =>
    async (props: PageLangParam): Promise<Metadata> => {
        const { lang } = await props.params;
        const i18n = getI18nInstance(lang);

        return buildPageMetadata({
            locale: lang,
            path: `/${meta.slug}`,
            title: i18n._(meta.metaTitle),
            description: i18n._(meta.metaDescription),
            keywords: meta.seoKeywords.map(keyword => i18n._(keyword)).join(', '),
            publishedAt: meta.publishedAt,
            updatedAt: meta.updatedAt
        });
    };
