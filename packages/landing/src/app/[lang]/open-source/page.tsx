import { isDefined } from '@rnw-community/shared';

import { PillarHubPageShell } from '../../../feature/component/pillar-hub-page-shell/pillar-hub-page-shell';
import { buildPillarHubMetadata } from '../../../feature/util/build-pillar-hub-metadata.util';
import { getPillarHubBySlug } from '../../../feature/util/get-pillar-hub-by-slug.util';
import { getI18nInstance } from '../../../i18n/app-router-i18n';

import type { PageLangParam } from '../../../i18n/init-lingui';
import type { Metadata } from 'next';

const SLUG = 'open-source';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);
    const entry = getPillarHubBySlug(SLUG);
    if (!isDefined(entry)) {
        return {};
    }

    return buildPillarHubMetadata({
        locale: lang,
        slug: SLUG,
        title: i18n._(entry.metaTitle),
        description: i18n._(entry.metaDescription),
        keywords: entry.seoKeywords.join(', '),
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt
    });
}

export default async function OpenSourcePillarHubPage(props: PageLangParam) {
    const { lang } = await props.params;

    return <PillarHubPageShell locale={lang} slug={SLUG} />;
}
