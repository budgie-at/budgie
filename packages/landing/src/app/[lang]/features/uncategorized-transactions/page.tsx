/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ListFilter, MousePointerClick, RefreshCw, SlidersHorizontal, Smartphone } from 'lucide-react';
import Link from 'next/link';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureProof } from '../../../../feature/component/feature-proof/feature-proof';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function UncategorizedTransactionsFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(i18n)`Budgie transaction list with a missing categories pill between the filter chips and the rows`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Find uncategorized transactions fast</Trans>}
                tagline={
                    <Trans>
                        Budgie surfaces missing categories directly inside your filtered transaction list, then opens a focused cleanup view
                        with the same account, date, tag, and type filters.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot
                    alt={firstShotAlt}
                    locale={lang}
                    scene="uncategorized-transactions-1"
                    slug="uncategorized-transactions"
                />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Three screens to a clean report</Trans>}>
                    <Trans>The count above your list, the focused list behind it, and the row you open to fix.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>The pill counts what you missed</Trans>}>
                    <Trans>
                        It sits above the list and counts only the transactions without a category inside your active account, date, type,
                        tag and amount filters.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={firstShotAlt}
                    index={0}
                    locale={lang}
                    scene="uncategorized-transactions-1"
                    slug="uncategorized-transactions"
                >
                    <FeatureStory.Callout y={0.204}>
                        <Trans>Missing categories in this filter</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Open the list behind the inbox</Trans>}>
                    <Trans>
                        The pill opens the{' '}
                        <Link
                            className="font-semibold underline underline-offset-4"
                            href={`/${lang}/features/bulk-categorize-transactions`}
                        >
                            Categorize inbox
                        </Link>{' '}
                        for bulk work. The list button in its header shows only these rows, with your filters carried across.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie Missing categories screen listing income and expense rows that still have no category`}
                    index={1}
                    locale={lang}
                    scene="uncategorized-transactions-2"
                    slug="uncategorized-transactions"
                >
                    <FeatureStory.Callout y={0.128}>
                        <Trans>Only the rows without a category</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Fix one, the count drops</Trans>}>
                    <Trans>
                        Open a row, set its category, and both this list and the pill behind it update on their own — no reload, no manual
                        refresh.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`The same Budgie Missing categories list with its first uncategorised row ready to open`}
                    index={2}
                    locale={lang}
                    scene="uncategorized-transactions-2"
                    slug="uncategorized-transactions"
                >
                    <FeatureStory.Callout y={0.285}>
                        <Trans>Tap a row to categorize it</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureSpecTiles heading={<Trans>Cleanup that stays in context</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>filters carry over to the cleanup list</Trans>} value={<Trans>Same</Trans>}>
                    <Trans>Account, date, type and tag filters follow you from the list into the cleanup view.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>refreshes needed after a fix</Trans>} value="0">
                    <Trans>Set a category and the list and the count update on their own.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>tap from the count to the inbox</Trans>} value={<Trans>One</Trans>}>
                    <Trans>The pill opens the Categorize inbox for bulk work.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(i18n)`Budgie transaction list with the filter chips and a 14 missing categories pill above the rows`}
                        locale={lang}
                        scene="uncategorized-transactions-1"
                        slug="uncategorized-transactions"
                        y={0.1}
                    />
                }
                heading={<Trans>Change a filter, watch the count</Trans>}
                lede={<Trans>The number always matches the list you are looking at.</Trans>}
            >
                <FeatureProof.Fact icon={SlidersHorizontal}>
                    <Trans>The pill counts only rows inside your active filters</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={RefreshCw}>
                    <Trans>Categorize a row and the count drops right away</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Action href={`/${lang}/features/bulk-categorize-transactions`}>
                    <Trans>See the Categorize inbox</Trans>
                </FeatureProof.Action>
            </FeatureProof>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={ListFilter} title={<Trans>Counts that follow your filters</Trans>}>
                    <Trans>Filter-aware count for missing categories under the current account, date, tag, and transaction type</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={MousePointerClick} title={<Trans>One tap to the gaps</Trans>}>
                    <Trans>One-tap drill-down into only the uncategorized transactions that match your current filters</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Smartphone} title={<Trans>Offline and on-device</Trans>}>
                    <Trans>Works offline and on-device, with no analytics service reading your financial data</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Category cleanup from the same transaction cards you already use for editing</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Stays fast on long transaction histories, entirely on-device</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why uncategorized transactions quietly break reports</Trans>}>
                    <p>
                        <Trans>
                            One uncategorized grocery run can make your food budget look better than it is. A few missing categories across
                            income and expenses can distort category charts, month-end reviews, and spending trends.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Budgie turns that cleanup into a visible workflow. When the current filter contains uncategorized transactions,
                            a compact missing-category pill appears above the list with the exact count.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Tapping the pill opens the Categorize inbox, which groups those transactions by merchant so you can{' '}
                            <Link
                                className="font-semibold underline underline-offset-4"
                                href={`/${lang}/features/bulk-categorize-transactions`}
                            >
                                categorize them in bulk
                            </Link>{' '}
                            with suggestions learned from your own past choices.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>What are uncategorized transactions?</Trans>}
                    answer={
                        <Trans>
                            They are income or expense transactions without a category. Budgie calls them missing categories in the app
                            because the next action is to assign a category and clean up your reports.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Does the count respect my current filters?</Trans>}
                    answer={
                        <Trans>
                            Yes. The pill counts only uncategorized transactions inside the active account, type, date, and tag filters, so
                            the number always matches the list you are reviewing.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Will this slow down my transaction list?</Trans>}
                    answer={
                        <Trans>No. The count and the drill-down list both run entirely on-device, without a cloud analytics service.</Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Is there a faster way to fix many of them?</Trans>}
                    answer={
                        <Trans>
                            Yes. The pill opens the Categorize inbox, which works without AI: it suggests a category for each merchant group
                            from your own history and can accept every confident suggestion at once. ATM withdrawals get their own Cash
                            withdrawals section, where you can move them to cash instead of categorizing them.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
