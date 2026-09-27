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
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
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

export default async function SubscriptionFreeBudgetAppPage(props: PageLangParam) {
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
                heading={<Trans>Subscription-Free Budget App — Completely Free</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Recurring monthly fees turn budgeting into another bill. Budgie is completely free — every feature, no unlock, no
                        tier.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>What is not on this screen</Trans>}>
                    <Trans>One settings screen, and the thing worth noticing is the row that never appears on it.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Point index={0}>
                    <Trans>Privacy, Security, General and every group under them open in full, with no upgrade row in between.</Trans>
                </FeatureStory.Point>

                <FeatureStory.Shot
                    alt={t(i18n)`Budgie settings screen showing the full option set with no paywall and no subscription prompt`}
                    index={0}
                    locale={lang}
                    priority
                    scene="subscription-free-budget-app-1"
                    slug="subscription-free-budget-app"
                >
                    <FeatureStory.Callout index={0} y={0.16}>
                        <Trans>No upgrade banner here</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.7}>
                        <Trans>No lock icons, no tiers</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Point index={1}>
                    <Trans>There is no subscription paywall in the tracker; every feature is free.</Trans>
                </FeatureStory.Point>
                <FeatureStory.Point index={2}>
                    <Trans>Bank sync and on-device AI are free too. The tracker itself never expires.</Trans>
                </FeatureStory.Point>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why this matters</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Recurring monthly fees turn budgeting into another bill. Budgie is completely free — every feature, no unlock, no
                        tier.
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
                            Manual expense entry, bank PDF/CSV imports, multi-currency, debt tracking, analytics, AI features, and direct
                            bank-sync integrations are all free.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Nothing — there&apos;s nothing to stop. Nothing was ever paid for.</Trans>
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
                <FeaturePageCategoryComparison categoryLabel={<Trans>Subscription budget apps</Trans>}>
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Free</Trans>}
                        competitorValue={<Trans>Monthly recurring</Trans>}
                        label={<Trans>Pricing</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Everything — always</Trans>}
                        competitorValue={<Trans>Read-only or nothing if you stop paying</Trans>}
                        label={<Trans>What you keep</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>$0</Trans>}
                        competitorValue={<Trans>$300+ recurring</Trans>}
                        label={<Trans>Cost over 5 years</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Direct API or PDF/CSV</Trans>}
                        competitorValue={<Trans>Aggregator (often paid tier)</Trans>}
                        label={<Trans>Bank sync</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Full</Trans>}
                        competitorValue={<Trans>Limited or none</Trans>}
                        label={<Trans>Offline use</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Yes</Trans>}
                        competitorValue={<Trans>No</Trans>}
                        label={<Trans>Public source</Trans>}
                    />
                </FeaturePageCategoryComparison>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Is anything in Budgie paid?</Trans>}
                    answer={
                        <Trans>
                            No. Manual expense entry, bank PDF/CSV imports, multi-currency, debt tracking, analytics, AI features, and
                            direct bank-sync integrations are all free.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does Budgie have ads or a paid tier?</Trans>}
                    answer={<Trans>No. There is no paid tier and no ads — every feature ships free in the app you install.</Trans>}
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

            <FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
