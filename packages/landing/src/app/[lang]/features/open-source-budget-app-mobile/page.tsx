/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBreadcrumbsJsonLd } from '../../../../feature/component/feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
import { FeaturePageCategoryComparison } from '../../../../feature/component/feature-page-category-comparison/feature-page-category-comparison';
import { FeaturePageCta } from '../../../../feature/component/feature-page-cta/feature-page-cta';
import { FeaturePageFaqItem } from '../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { FeaturePageWebPageJsonLd } from '../../../../feature/component/feature-page-web-page-json-ld/feature-page-web-page-json-ld';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
import { getRelatedFeatures } from '../../../../feature/util/get-related-features.util';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return buildFeaturePageMetadata({
        locale: lang,
        slug: FEATURE_METADATA.slug,
        title: i18n._(FEATURE_METADATA.metaTitle),
        description: i18n._(FEATURE_METADATA.metaDescription),
        keywords: FEATURE_METADATA.seoKeywords.join(', '),
        publishedAt: FEATURE_METADATA.publishedAt,
        updatedAt: FEATURE_METADATA.updatedAt
    });
}

export default async function OpenSourceBudgetAppMobilePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const related = getRelatedFeatures(FEATURE_METADATA);
    const description = i18n._(FEATURE_METADATA.metaDescription);
    const featureName = i18n._(FEATURE_METADATA.title);
    const title = i18n._(FEATURE_METADATA.metaTitle);
    const homePath = `/${lang}`;
    const featuresPath = `/${lang}/features`;
    const featurePath = `/${lang}/features/${FEATURE_METADATA.slug}`;
    const comparisonCategoryLabel = <Trans>Closed-source budget apps</Trans>;
    const comparisonRows = [
        {
            label: <Trans>Source code</Trans>,
            budgieValue: <Trans>Public on GitHub</Trans>,
            competitorValue: <Trans>Closed</Trans>
        },
        {
            label: <Trans>Privacy claims</Trans>,
            budgieValue: <Trans>Verifiable in source</Trans>,
            competitorValue: <Trans>Marketing copy only</Trans>
        },
        {
            label: <Trans>Forkable</Trans>,
            budgieValue: <Trans>Yes</Trans>,
            competitorValue: <Trans>No</Trans>
        },
        {
            label: <Trans>Community PRs accepted</Trans>,
            budgieValue: <Trans>Yes</Trans>,
            competitorValue: <Trans>No</Trans>
        },
        {
            label: <Trans>Vendor risk</Trans>,
            budgieValue: <Trans>Low — fork survives</Trans>,
            competitorValue: <Trans>High — shutdown = data loss risk</Trans>
        }
    ];

    return (
        <main className="flex-1">
            <FeaturePageBreadcrumbsJsonLd locale={lang} slug={FEATURE_METADATA.slug}>
                <FeaturePageBreadcrumbsJsonLd.Item name={t(i18n)`Home`} path={homePath} />
                <FeaturePageBreadcrumbsJsonLd.Item name={t(i18n)`Features`} path={featuresPath} />
                <FeaturePageBreadcrumbsJsonLd.Item name={featureName} path={featurePath} />
            </FeaturePageBreadcrumbsJsonLd>
            <FeaturePageWebPageJsonLd
                description={description}
                featureName={featureName}
                locale={lang}
                publishedAt={FEATURE_METADATA.publishedAt}
                slug={FEATURE_METADATA.slug}
                title={title}
                updatedAt={FEATURE_METADATA.updatedAt}
            />
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Source-Available Budget App for Mobile — Audit, Fork, Trust</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Closed-source finance apps ask you to trust marketing. Budgie&apos;s mobile app has public source, so the privacy
                        and security claims are auditable line by line.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why this matters</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Closed-source finance apps ask you to trust marketing. Budgie&apos;s mobile app has public source, so the privacy
                        and security claims are auditable line by line.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Budgie vs. the category</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>
                            github.com/budgie-at/budgie. The mobile app, contracts, AI services, and bank-sync integrations all live there.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>
                            A source-available license that lets you read, fork, and modify the code. The official app builds remain ours to
                            monetize, which keeps development sustainable.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Yes. The repository ships with build instructions for iOS and Android.</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>The code stays public. The community can keep building. Your data stays on your device regardless.</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Feature comparison</Trans>
                </FeaturePageHeading>
                <FeaturePageCategoryComparison categoryLabel={comparisonCategoryLabel} rows={comparisonRows} />
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Where can I read the source?</Trans>}
                    answer={
                        <Trans>
                            github.com/budgie-at/budgie. The mobile app, contracts, AI services, and bank-sync integrations all live there.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What license?</Trans>}
                    answer={
                        <Trans>
                            A source-available license that lets you read, fork, and modify the code. The official app builds remain ours to
                            monetize, which keeps development sustainable.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I self-build?</Trans>}
                    answer={<Trans>Yes. The repository ships with build instructions for iOS and Android.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>What if Budgie shuts down?</Trans>}
                    answer={
                        <Trans>The code stays public. The community can keep building. Your data stays on your device regardless.</Trans>
                    }
                />
            </FeaturePageFaqSection>

            <FeaturePageRelated features={related} locale={lang} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
