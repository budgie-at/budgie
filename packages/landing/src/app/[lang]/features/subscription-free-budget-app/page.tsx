/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Code, Gift, ServerOff } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageCategoryComparison } from '../../../../feature/component/feature-page-category-comparison/feature-page-category-comparison';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function SubscriptionFreeBudgetAppPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(i18n)`Budgie settings screen showing the full option set with no paywall and no subscription prompt`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Budgeting without another subscription</Trans>}
                tagline={
                    <Trans>
                        Recurring monthly fees turn budgeting into another bill. Budgie is completely free: every feature, no unlock, no
                        tier.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot
                    alt={firstShotAlt}
                    locale={lang}
                    scene="subscription-free-budget-app-1"
                    slug="subscription-free-budget-app"
                />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>What is not on this screen</Trans>}>
                    <Trans>One settings screen, and the thing worth noticing is the row that never appears on it.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Point index={0}>
                    <Trans>Privacy, Security, General and every group under them open in full, with no upgrade row in between.</Trans>
                </FeatureStory.Point>

                <FeatureStory.Shot
                    alt={firstShotAlt}
                    index={0}
                    locale={lang}
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

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Gift} title={<Trans>Every feature is free</Trans>}>
                    <Trans>
                        Manual expense entry, bank PDF/CSV imports, multi-currency, debt tracking, analytics, AI features, and direct
                        bank-sync integrations are all free.
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Code} title={<Trans>Source you can read</Trans>}>
                    <Trans>
                        The app source is public. Even if Budgie disappeared, the community could keep building it. That&apos;s not true of
                        subscription apps with closed servers.
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ServerOff} title={<Trans>No servers, no recurring fee</Trans>}>
                    <Trans>
                        Most run cloud infrastructure to mirror your transactions. We don&apos;t run servers — your data lives on your phone
                        — so we don&apos;t need recurring revenue to keep the lights on.
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Nothing — there&apos;s nothing to stop. Nothing was ever paid for.</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why this matters</Trans>}>
                    <p>
                        <Trans>
                            Recurring monthly fees turn budgeting into another bill. Budgie is completely free — every feature, no unlock,
                            no tier.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>Feature comparison</Trans>}>
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
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={2} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Is anything in Budgie paid?</Trans>}
                    answer={
                        <Trans>
                            No. Manual expense entry, bank PDF/CSV imports, multi-currency, debt tracking, analytics, AI features, and
                            direct bank-sync integrations are all free.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Does Budgie have ads or a paid tier?</Trans>}
                    answer={<Trans>No. There is no paid tier and no ads — every feature ships free in the app you install.</Trans>}
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Is &ldquo;subscription-free&rdquo; really durable?</Trans>}
                    answer={
                        <Trans>
                            The app source is public. Even if Budgie disappeared, the community could keep building it. That&apos;s not true
                            of subscription apps with closed servers.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Why do other apps charge monthly?</Trans>}
                    answer={
                        <Trans>
                            Most run cloud infrastructure to mirror your transactions. We don&apos;t run servers — your data lives on your
                            phone — so we don&apos;t need recurring revenue to keep the lights on.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
