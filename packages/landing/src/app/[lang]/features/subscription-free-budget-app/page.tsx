/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

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
import { getFeatureBySlug } from '../../../../feature/util/get-feature-by-slug.util';
import { getRelatedFeatures } from '../../../../feature/util/get-related-features.util';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import type { Metadata } from 'next';

const SLUG = 'subscription-free-budget-app';

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

export default async function SubscriptionFreeBudgetAppPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);
    const entry = getFeatureBySlug(SLUG);
    if (!isDefined(entry)) {
        return null;
    }

    const related = getRelatedFeatures(SLUG);
    const description = i18n._(entry.metaDescription);
    const featureName = i18n._(entry.title);
    const title = i18n._(entry.metaTitle);
    const homePath = `/${lang}`;
    const featuresPath = `/${lang}/features`;
    const featurePath = `/${lang}/features/${SLUG}`;
    const comparisonCategoryLabel = <Trans>Subscription budget apps</Trans>;
    const comparisonRows = [
        {
            label: <Trans>Pricing</Trans>,
            budgieValue: <Trans>Free core, optional one-time unlock</Trans>,
            competitorValue: <Trans>Monthly recurring</Trans>
        },
        {
            label: <Trans>What you keep when you stop paying</Trans>,
            budgieValue: <Trans>Everything — full access</Trans>,
            competitorValue: <Trans>Read-only or nothing</Trans>
        },
        {
            label: <Trans>Annual cost over 5 years</Trans>,
            budgieValue: <Trans>&lt; $30 one-time</Trans>,
            competitorValue: <Trans>$300+ recurring</Trans>
        },
        {
            label: <Trans>Bank sync</Trans>,
            budgieValue: <Trans>Direct API or PDF/CSV</Trans>,
            competitorValue: <Trans>Aggregator (often paid tier)</Trans>
        },
        {
            label: <Trans>Offline use</Trans>,
            budgieValue: <Trans>Full</Trans>,
            competitorValue: <Trans>Limited or none</Trans>
        },
        {
            label: <Trans>Public source</Trans>,
            budgieValue: <Trans>Yes</Trans>,
            competitorValue: <Trans>No</Trans>
        }
    ];

    return (
        <main className="flex-1">
            <FeaturePageBreadcrumbsJsonLd locale={lang} slug={SLUG}>
                <FeaturePageBreadcrumbsJsonLd.Item name={t(i18n)`Home`} path={homePath} />
                <FeaturePageBreadcrumbsJsonLd.Item name={t(i18n)`Features`} path={featuresPath} />
                <FeaturePageBreadcrumbsJsonLd.Item name={featureName} path={featurePath} />
            </FeaturePageBreadcrumbsJsonLd>
            <FeaturePageWebPageJsonLd
                description={description}
                featureName={featureName}
                locale={lang}
                publishedAt={entry.publishedAt}
                slug={SLUG}
                title={title}
                updatedAt={entry.updatedAt}
            />
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Subscription-Free Budget App — Pay Once or Free</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Recurring monthly fees turn budgeting into another bill. Budgie&apos;s core is free; advanced features unlock with a
                        one-time purchase you actually own.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why this matters</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Recurring monthly fees turn budgeting into another bill. Budgie&apos;s core is free; advanced features unlock with a
                        one-time purchase you actually own.
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
                            Manual expense entry, bank PDF/CSV imports, multi-currency, debt tracking, and analytics are free. The optional
                            unlock covers AI features and direct bank-sync integrations.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Nothing — there&apos;s nothing to stop. The unlock is one-time, not a subscription.</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>
                            The app source is public. Even if Budgie disappeared, the community could keep building it. That&apos;s not true
                            of subscription apps with closed servers.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>
                            Most run cloud infrastructure to mirror your transactions. We don&apos;t run servers — your data lives on your
                            phone — so we don&apos;t need recurring revenue to keep the lights on.
                        </Trans>
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
                    question={<Trans>What&apos;s free vs. paid in Budgie?</Trans>}
                    answer={
                        <Trans>
                            Manual expense entry, bank PDF/CSV imports, multi-currency, debt tracking, and analytics are free. The optional
                            unlock covers AI features and direct bank-sync integrations.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What happens if I stop paying?</Trans>}
                    answer={<Trans>Nothing — there&apos;s nothing to stop. The unlock is one-time, not a subscription.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>Is &ldquo;subscription-free&rdquo; really durable?</Trans>}
                    answer={
                        <Trans>
                            The app source is public. Even if Budgie disappeared, the community could keep building it. That&apos;s not true
                            of subscription apps with closed servers.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Why do other apps charge monthly?</Trans>}
                    answer={
                        <Trans>
                            Most run cloud infrastructure to mirror your transactions. We don&apos;t run servers — your data lives on your
                            phone — so we don&apos;t need recurring revenue to keep the lights on.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>

            <FeaturePageRelated features={related} locale={lang} />
            <FeaturePageRelatedArticles locale={lang} slugs={entry.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
