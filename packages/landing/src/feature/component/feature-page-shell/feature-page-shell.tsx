import { t } from '@lingui/core/macro';

import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { FeaturePageBreadcrumbsJsonLd } from '../feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
import { FeaturePageCta } from '../feature-page-cta/feature-page-cta';
import { FeaturePageRelatedArticles } from '../feature-page-related-articles/feature-page-related-articles';
import { FeaturePageRelated } from '../feature-page-related/feature-page-related';
import { FeaturePageWebPageJsonLd } from '../feature-page-web-page-json-ld/feature-page-web-page-json-ld';

import type { FeatureRegistryEntryInterface } from '../../interface/feature-registry-entry.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly lang: string;
    readonly meta: FeatureRegistryEntryInterface;
}

export const FeaturePageShell = ({ children, lang, meta }: Props) => {
    const i18n = getI18nInstance(lang);
    const featureName = i18n._(meta.title);

    return (
        <main className="flex-1">
            <FeaturePageBreadcrumbsJsonLd locale={lang} slug={meta.slug}>
                <FeaturePageBreadcrumbsJsonLd.Item name={t(i18n)`Home`} path={`/${lang}`} />
                <FeaturePageBreadcrumbsJsonLd.Item name={t(i18n)`Features`} path={`/${lang}/features`} />
                <FeaturePageBreadcrumbsJsonLd.Item name={featureName} path={`/${lang}/features/${meta.slug}`} />
            </FeaturePageBreadcrumbsJsonLd>
            <FeaturePageWebPageJsonLd
                description={i18n._(meta.metaDescription)}
                featureName={featureName}
                locale={lang}
                publishedAt={meta.publishedAt}
                slug={meta.slug}
                title={i18n._(meta.metaTitle)}
                updatedAt={meta.updatedAt}
            />
            {children}
            <FeaturePageRelated locale={lang} slugs={meta.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={meta.relatedArticleSlugs} />
            <FeaturePageCta locale={lang} />
        </main>
    );
};
