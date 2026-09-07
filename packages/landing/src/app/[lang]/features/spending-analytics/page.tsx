/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBreadcrumbsJsonLd } from '../../../../feature/component/feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
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

export default async function SpendingAnalyticsFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Spending Analytics That Actually Help</Trans>}
                locale={lang}
                tagline={
                    <Trans>Category and tag breakdowns for any period, with drill-down from any row to the transactions behind it.</Trans>
                }
            />

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
                        or any range you draw on the calendar. Amount, Category, Tag and Account chips narrow it further, and both tabs read
                        the same filter.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Categories analytics tab with the date and amount filter chips, the Spent, Income and Balance tiles, and per-category spending bars`}
                    index={0}
                    locale={lang}
                    priority
                    scene="spending-analytics-1"
                    slug="spending-analytics"
                >
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

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why most expense charts are useless</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Most apps show a pie chart and call it analytics. Budgie&apos;s analytics screen splits into Categories and Tags
                        tabs, each with drill-down: tap a category to see every transaction in it for the current period.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Date filters cover Today, This and Last Week, This and Last Month, This Year and All Time, plus any custom range.
                        The &ldquo;Untagged&rdquo; and &ldquo;Uncategorized&rdquo; buckets surface the gaps in your bookkeeping so you can
                        tighten them up.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Categories tab: per-category totals, with drill-down to every transaction in the row</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Tags tab: per-tag income and expense, plus an &ldquo;Untagged&rdquo; bucket for the gaps</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Amount, category, tag and account chips narrow both tabs from the same filter row</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Seven date presets, from Today to All Time, plus any range you pick on the calendar</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Overview tiles: spent and earned across the period, beside your balance over every account</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>Bank-fee entries are included in category analytics even when attached to transfers</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Can I drill down from the breakdown to the transactions?</Trans>}
                    answer={
                        <Trans>
                            Yes. Tap any category or tag row to see every transaction that contributed to it during the current period.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What&apos;s an &ldquo;Untagged&rdquo; bucket?</Trans>}
                    answer={
                        <Trans>
                            A deliberate gap-finder. Transactions without tags accumulate in this bucket so you can spot bookkeeping gaps
                            and tighten them up.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I compare months?</Trans>}
                    answer={
                        <Trans>
                            Yes. Switch the date filter between presets like This Month, Last Month and This Year, or draw a custom range on
                            the calendar — the totals and every category row redraw for the period you chose.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Are charts rendered offline?</Trans>}
                    answer={
                        <Trans>Yes. Analytics reads directly from your local SQLite database — every chart works without internet.</Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Do transfer fees show up as expenses?</Trans>}
                    answer={
                        <Trans>
                            Yes. A transfer can remain a transfer while its fee is counted in the selected fee category for analytics.
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
