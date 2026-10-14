import { t } from '@lingui/core/macro';

import { BreadcrumbsJsonLd } from '../../../generic/component/breadcrumbs-json-ld/breadcrumbs-json-ld';
import { WebPageJsonLd } from '../../../generic/component/web-page-json-ld/web-page-json-ld';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { PILLAR_CLASS_NAME } from '../../constant/pillar-class-name.constant';
import { FeaturePageCta } from '../feature-page-cta/feature-page-cta';
import { FeatureRelated } from '../feature-related/feature-related';

import type { FeatureRegistryEntryInterface } from '../../interface/feature-registry-entry.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly lang: string;
    readonly meta: FeatureRegistryEntryInterface;
}

export const FeaturePageShell = ({ children, lang, meta }: Props) => {
    const i18n = getI18nInstance(lang);
    const featureName = i18n._(meta.name);

    return (
        <main className={`feature-page flex-1 ${PILLAR_CLASS_NAME[meta.pillar]}`}>
            <BreadcrumbsJsonLd locale={lang} path={`/features/${meta.slug}`}>
                <BreadcrumbsJsonLd.Item name={t(i18n)`Home`} path={`/${lang}`} />
                <BreadcrumbsJsonLd.Item name={t(i18n)`Features`} path={`/${lang}/features`} />
                <BreadcrumbsJsonLd.Item name={featureName} path={`/${lang}/features/${meta.slug}`} />
            </BreadcrumbsJsonLd>
            <WebPageJsonLd
                description={i18n._(meta.metaDescription)}
                featureName={featureName}
                locale={lang}
                path={`/features/${meta.slug}`}
                publishedAt={meta.publishedAt}
                title={i18n._(meta.metaTitle)}
                updatedAt={meta.updatedAt}
            />
            {children}
            <FeatureRelated locale={lang} slugs={meta.relatedFeatureSlugs} />
            <FeaturePageCta locale={lang} />
        </main>
    );
};
