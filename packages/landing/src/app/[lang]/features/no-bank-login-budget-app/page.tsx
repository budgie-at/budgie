/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBreadcrumbsJsonLd } from '../../../../feature/component/feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
import { FeaturePageCategoryComparison } from '../../../../feature/component/feature-page-category-comparison/feature-page-category-comparison';
import { FeaturePageCta } from '../../../../feature/component/feature-page-cta/feature-page-cta';
import { FeaturePageFaqItem } from '../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { FeaturePageWebPageJsonLd } from '../../../../feature/component/feature-page-web-page-json-ld/feature-page-web-page-json-ld';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
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

export default async function NoBankLoginBudgetAppPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const description = i18n._(FEATURE_METADATA.metaDescription);
    const featureName = i18n._(FEATURE_METADATA.title);
    const title = i18n._(FEATURE_METADATA.metaTitle);
    const homePath = `/${lang}`;
    const featuresPath = `/${lang}/features`;
    const featurePath = `/${lang}/features/${FEATURE_METADATA.slug}`;

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
                heading={<Trans>Budget App Without Bank Login — Direct API or Statement Import</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Aggregators sit between you and your bank, mirroring every transaction to their servers. Budgie talks to your bank
                        directly via tokens or imports statements you download yourself.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why this matters</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Aggregators sit between you and your bank, mirroring every transaction to their servers. Budgie talks to your bank
                        directly via tokens or imports statements you download yourself.
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
                            Two paths: (1) direct API tokens for supported banks like Monobank, where the token lives in your device&apos;s
                            secure keystore; (2) PDF/CSV/Excel statement imports for anything else.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>
                            Aggregators sit between you and your bank, mirroring transactions to their servers. Budgie deliberately does not
                            use them.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>
                            Both can be secure when implemented correctly. The difference is the threat surface: direct tokens are
                            bank-to-you; aggregator OAuth adds a third party with your credentials and your transaction stream.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>
                            Monobank today; we add direct integrations as banks publish stable APIs. For everything else, statement import
                            (PDF, CSV, Excel) covers the gap.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Feature comparison</Trans>
                </FeaturePageHeading>
                <FeaturePageCategoryComparison categoryLabel={<Trans>Aggregator-based PFM apps</Trans>}>
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Never shared</Trans>}
                        competitorValue={<Trans>Held by aggregator</Trans>}
                        label={<Trans>Bank credentials</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Direct API tokens or PDF/CSV</Trans>}
                        competitorValue={<Trans>OAuth via aggregator</Trans>}
                        label={<Trans>Sync method</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>None</Trans>}
                        competitorValue={<Trans>Third-party aggregator service</Trans>}
                        label={<Trans>Aggregator middleman</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Bank-level only</Trans>}
                        competitorValue={<Trans>Bank + aggregator + app</Trans>}
                        label={<Trans>Bank breach impact</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Yes (statement import)</Trans>}
                        competitorValue={<Trans>Often no</Trans>}
                        label={<Trans>Works with offline-only banks</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Manual or scheduled</Trans>}
                        competitorValue={<Trans>Aggregator&apos;s clock</Trans>}
                        label={<Trans>Sync interval</Trans>}
                    />
                </FeaturePageCategoryComparison>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>How does Budgie sync without an aggregator?</Trans>}
                    answer={
                        <Trans>
                            Two paths: (1) direct API tokens for supported banks like Monobank, where the token lives in your device&apos;s
                            secure keystore; (2) PDF/CSV/Excel statement imports for anything else.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What about third-party aggregators?</Trans>}
                    answer={
                        <Trans>
                            Aggregators sit between you and your bank, mirroring transactions to their servers. Budgie deliberately does not
                            use them.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is direct API more secure than OAuth?</Trans>}
                    answer={
                        <Trans>
                            Both can be secure when implemented correctly. The difference is the threat surface: direct tokens are
                            bank-to-you; aggregator OAuth adds a third party with your credentials and your transaction stream.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Which banks have direct API support?</Trans>}
                    answer={
                        <Trans>
                            Monobank today; we add direct integrations as banks publish stable APIs. For everything else, statement import
                            (PDF, CSV, Excel) covers the gap.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>

            <FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
