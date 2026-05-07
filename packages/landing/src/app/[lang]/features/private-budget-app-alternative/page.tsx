import { isDefined } from '@rnw-community/shared';

import { FeaturePageComparisonShell } from '../../../../feature/component/feature-page-comparison-shell/feature-page-comparison-shell';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
import { getFeatureBySlug } from '../../../../feature/util/get-feature-by-slug.util';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';

import type { PageLangParam } from '../../../../i18n/init-lingui';
import type { Metadata } from 'next';

const SLUG = 'private-budget-app-alternative';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);
    const entry = getFeatureBySlug(SLUG);
    if (!isDefined(entry)) {
        return {};
    }

    return buildFeaturePageMetadata({
        locale: lang,
        slug: SLUG,
        title: i18n._(entry.metaTitle),
        description: i18n._(entry.metaDescription),
        keywords: entry.seoKeywords.join(', '),
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt
    });
}

export default async function PrivateBudgetAppAlternativePage(props: PageLangParam) {
    const { lang } = await props.params;

    return <FeaturePageComparisonShell locale={lang} slug={SLUG} />;
}
