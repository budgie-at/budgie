/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { CalendarDays, ChartPie, Tags } from 'reicon-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureCropBand } from '../../../../feature/component/feature-crop-band/feature-crop-band';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function SpendingAnalyticsFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie Categories analytics tab with the date and amount filter chips, the Spent, Income and Balance tiles, and per-category spending bars`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>See where your money goes</Trans>}
                tagline={
                    <Trans>Category and tag breakdowns for any period, with drill-down from any row to the transactions behind it.</Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="spending-analytics-1" slug="spending-analytics" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>From the month&apos;s total to one receipt</Trans>}>
                    <Trans>
                        Two screens do the work: the Categories tab, where the period&apos;s totals sit above every category ranked by what
                        it took, and the transaction list behind any one of those rows.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Set the period, read the totals</Trans>}>
                    <Trans>
                        Statistics opens on This Month. The date chip swaps in Today, This or Last Week, Last Month, This Year and All Time,
                        or any range you draw on the calendar. Amount, Category, Tag and Account chips narrow it further, and the Categories
                        and Tags tabs both read the same filter — Runway keeps its own six-month window instead.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="spending-analytics-1" slug="spending-analytics">
                    <FeatureStory.Callout x={0.43} y={0.167}>
                        <Trans>Seven presets, or your own range</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.3}>
                        <Trans>Spent and earned this period</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.62}>
                        <Trans>Its share of the period</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Every category, ranked by what it took</Trans>}>
                    <Trans>
                        Income by category and Spending by category list each one with its total and its share of the period, biggest first.
                        Categories with no activity drop out of the list, and anything you never filed collects in an Uncategorized row.
                    </Trans>
                </FeatureStory.Step>

                <FeatureStory.Step index={2} title={<Trans>Tap a row, get the transactions</Trans>}>
                    <Trans>
                        A category row opens the transactions behind it, carrying the same period across and grouping them by month — each
                        one with its account, its tags and its time. Tags drill down the same way, and the Untagged bucket shows what
                        slipped through.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie transaction list for a single spending category, showing the period date range above rows grouped by month`}
                    index={2}
                    locale={lang}
                    scene="spending-analytics-2"
                    slug="spending-analytics"
                >
                    <FeatureStory.Callout x={0.3} y={0.17}>
                        <Trans>The period comes with you</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.247}>
                        <Trans>Every transaction behind the total</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureSpecTiles heading={<Trans>Pick the period that matters</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>date presets, from Today to All Time</Trans>} value="7">
                    <Trans>One tap switches every total and category row.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>range you draw on the calendar</Trans>} value={<Trans>Any</Trans>}>
                    <Trans>Presets not enough? Pick exact start and end dates.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>category row opens its transactions</Trans>} value={<Trans>Every</Trans>}>
                    <Trans>Go from a total to the entries behind it.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureCropBand
                heading={<Trans>Your spending, category by category</Trans>}
                lede={<Trans>Each category gets a bar sized to its share of what you spent.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(i18n)`Budgie Spending by category list with a bar and a percentage of expenses under each category`}
                        locale={lang}
                        scene="spending-analytics-1"
                        slug="spending-analytics"
                        y={0.5}
                    >
                        <FeatureCropBand.Pin x={0.72} y={0.648} />
                        <FeatureCropBand.Pin x={0.72} y={0.735} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>Share of everything you spent</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Tap any row for its transactions</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={ChartPie} title={<Trans>See where money goes</Trans>}>
                    <Trans>Categories tab: per-category totals, with drill-down to every transaction in the row</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Tags} title={<Trans>Spot the bookkeeping gaps</Trans>}>
                    <Trans>Tags tab: per-tag income and expense, plus an &ldquo;Untagged&rdquo; bucket for the gaps</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={CalendarDays} title={<Trans>Any period you need</Trans>}>
                    <Trans>Seven date presets, from Today to All Time, plus any range you pick on the calendar</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Amount, category, tag and account chips narrow the Categories and Tags tabs from the same filter row</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Overview tiles: spent and earned across the period, beside your balance over every account</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Fees on transfers count as spending in your fee category</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why most expense charts are useless</Trans>}>
                    <p>
                        <Trans>
                            Most apps show a pie chart and call it analytics. Budgie&apos;s analytics screen has three tabs — Categories,
                            Tags and Runway — and the first two carry drill-down: tap a category or tag to see every transaction in it for
                            the current period.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Date filters cover Today, This and Last Week, This and Last Month, This Year and All Time, plus any custom
                            range. The &ldquo;Untagged&rdquo; and &ldquo;Uncategorized&rdquo; buckets surface the gaps in your bookkeeping
                            so you can tighten them up.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Can I drill down from the breakdown to the transactions?</Trans>}
                    answer={
                        <Trans>
                            Yes. Tap any category or tag row to see every transaction that contributed to it during the current period.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>What&apos;s an &ldquo;Untagged&rdquo; bucket?</Trans>}
                    answer={
                        <Trans>
                            A deliberate gap-finder. Transactions without tags accumulate in this bucket so you can spot bookkeeping gaps
                            and tighten them up.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Can I switch to another month?</Trans>}
                    answer={
                        <Trans>
                            Yes. Switch the date filter between presets like This Month, Last Month and This Year, or draw a custom range on
                            the calendar — the totals and every category row redraw for the period you chose. One period shows at a time,
                            there is no side-by-side month view.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Are charts rendered offline?</Trans>}
                    answer={<Trans>Yes. Analytics reads straight from your phone — every chart works without internet.</Trans>}
                />
                <FeatureFaq.Item
                    index={4}
                    question={<Trans>Do transfer fees show up as expenses?</Trans>}
                    answer={
                        <Trans>Yes. A transfer stays a transfer, while its fee counts as spending in the fee category you chose.</Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
