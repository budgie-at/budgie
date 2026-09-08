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

export default async function CryptoInvestmentTrackingFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Crypto Holdings Alongside Your Cash</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Track Bitcoin, Ethereum, and two hundred crypto assets alongside your bank accounts in a single net-worth view.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>One coin, three screens</Trans>}>
                    <Trans>
                        Where the holding sits in your account list, the buys that built it, and the market screen that prices it.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>In the same list as your bank</Trans>}>
                    <Trans>
                        Crypto is not a separate tab. Holdings group by instrument under their own heading, after the bank and cash
                        accounts, on the screen you already open. The total at the top counts them like everything else, and the two chips
                        underneath split it into what you hold in cash and what you hold in coin.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie home screen with the total balance split into a cash chip and a crypto chip above the bank, cash and crypto account groups`}
                    index={0}
                    locale={lang}
                    priority
                    scene="crypto-investment-tracking-1"
                    slug="crypto-investment-tracking"
                >
                    <FeatureStory.Callout index={0} x={0.72} y={0.226}>
                        <Trans>Cash and coin, split apart</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.437}>
                        <Trans>Bank accounts first</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={2} y={0.753}>
                        <Trans>Crypto right below them</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Every buy keeps what it cost</Trans>}>
                    <Trans>
                        The wallet itself reads in the coin: a balance in BTC, and under it the purchases that add up to it. Each row
                        carries the coin amount it bought, the amount you actually paid in your own currency, and the rate that implies — so
                        the cost stays recorded at the moment of the trade instead of being recomputed from today&apos;s price.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Bitcoin wallet screen with the balance in BTC above two crypto purchase rows showing the amount paid and the rate`}
                    index={1}
                    locale={lang}
                    scene="crypto-investment-tracking-2"
                    slug="crypto-investment-tracking"
                >
                    <FeatureStory.Callout index={0} y={0.237}>
                        <Trans>Balance in the coin itself</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.404}>
                        <Trans>Coin bought, amount paid, rate</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>What it cost, and what it is worth</Trans>}>
                    <Trans>
                        Every instrument has its own market screen: the stored price with its last move, a sparkline of the history behind
                        it, and your position valued against it — quantity, converted value, average cost, cost basis and unrealized gain.
                        Market cap, volume and the date of the snapshot sit underneath. There is no ticker to subscribe to; the screen reads
                        from the daily prices already in your database.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Bitcoin market screen with the price, a sparkline, and a holdings card listing average cost, cost basis and unrealized profit`}
                    index={2}
                    locale={lang}
                    scene="crypto-investment-tracking-3"
                    slug="crypto-investment-tracking"
                >
                    <FeatureStory.Callout index={0} y={0.212}>
                        <Trans>Price, and its last move</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.475}>
                        <Trans>Your quantity, valued in your currency</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={2} y={0.586}>
                        <Trans>Unrealized gain over cost basis</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why most expense apps stop at fiat</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Most expense apps end at fiat. Budgie has crypto holdings as first-class instruments — each one has a quantity, an
                        instrument symbol, and a daily price. Net worth rolls them all up.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Two hundred crypto instruments ship with the app, ranked by market cap, and the major assets come with real daily
                        market history built in. Stocks and ETFs are not supported yet.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Crypto holdings are first-class instruments: symbol, quantity, and a daily price</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Daily prices backfilled only for the crypto accounts you actually hold</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Holdings roll up into net worth alongside fiat accounts</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Multi-currency aware — euro-priced coins, dollar-priced coins, and UAH cash all reconcile</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>A market screen per instrument with a price card, a sparkline, and period metrics</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>
                            A year of daily prices for BTC, ETH, BNB, SOL, XRP, TRX, USDT, USDC, and HYPE ships with the app, in euro and
                            dollar
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={6}>
                        <Trans>Charts read from your own database, so they keep working with no connection</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Market history without a live ticker</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Each crypto instrument has its own market screen: the current price, a sparkline of where it has been, metrics for
                        the period, and your holding valued against it. The app ships with a year of daily prices for the nine largest
                        crypto assets, quoted in both euro and dollar, so the charts have something to show the moment you open them.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Beyond that seed, history is filled in from CoinGecko&apos;s public market data — but only for crypto accounts you
                        actually hold, one day at a time, in a background queue that fetches just the days you are missing and stops. There
                        is no ticker connection, no streaming feed, and no account: the chart you look at is read from your own database, so
                        it renders offline once the days are there.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Which assets can I track?</Trans>}
                    answer={
                        <Trans>
                            Crypto today — two hundred assets ship with the app, each holding a row of (instrument, quantity, price).
                            Stocks, ETFs, and commodities are not supported yet.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Where do prices come from?</Trans>}
                    answer={
                        <Trans>
                            The nine largest crypto assets ship with a year of daily prices in euro and dollar. Anything beyond that is
                            pulled from CoinGecko&apos;s public market data, one missing day at a time, and only for the crypto accounts you
                            hold.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Do the charts work offline?</Trans>}
                    answer={
                        <Trans>
                            Yes. Prices are stored in your local database, so the market screen renders from what you already have. A
                            connection is only needed to extend the history further back.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How is this different from a portfolio tracker?</Trans>}
                    answer={
                        <Trans>
                            Budgie integrates investment holdings into the same net-worth view as your bank accounts and debt. Most
                            portfolio trackers don&apos;t model fiat side-by-side.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I record buy / sell history?</Trans>}
                    answer={
                        <Trans>
                            Yes — buys are inflows to the holding account; sells are outflows with the realized FX. The market screen turns
                            that history into an average cost, a cost basis and an unrealized gain for the position.
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
