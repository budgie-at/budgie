/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ChartLine, Coins, WifiOff } from 'reicon-react';

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

export default async function CryptoInvestmentTrackingFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie home screen with the total balance split into a cash chip and a crypto chip above the bank, cash and crypto account groups`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Crypto next to your cash</Trans>}
                tagline={
                    <Trans>
                        Track Bitcoin, Ethereum, and two hundred crypto assets alongside your bank accounts in a single net-worth view.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot
                    alt={firstShotAlt}
                    locale={lang}
                    scene="crypto-investment-tracking-1"
                    slug="crypto-investment-tracking"
                />
            </FeaturePageHero>

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
                    alt={firstShotAlt}
                    index={0}
                    locale={lang}
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

            <FeatureSpecTiles heading={<Trans>Ready before you add a single coin</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>coins ready to track</Trans>} value="200">
                    <Trans>Bitcoin, Ethereum and the rest of the largest coins by market cap ship with the app.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>of daily prices built in</Trans>} value={<Trans>1 year</Trans>}>
                    <Trans>The biggest coins have charts the moment you open them.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>price currencies</Trans>} value="2">
                    <Trans>Every built-in price comes in both euro and dollar.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureCropBand
                heading={<Trans>Your cost next to today&apos;s price</Trans>}
                lede={<Trans>Every coin gets a market screen that values your position against the stored daily price.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(
                            i18n
                        )`Budgie Bitcoin market screen with a holdings card listing the quantity, average cost, cost basis and unrealized profit`}
                        locale={lang}
                        scene="crypto-investment-tracking-3"
                        slug="crypto-investment-tracking"
                        y={0.4}
                    >
                        <FeatureCropBand.Pin x={0.55} y={0.478} />
                        <FeatureCropBand.Pin x={0.55} y={0.548} />
                        <FeatureCropBand.Pin x={0.55} y={0.598} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>What you hold, valued in your currency</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Average cost and cost basis</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Unrealized gain over what you paid</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Coins} title={<Trans>Crypto inside your net worth</Trans>}>
                    <Trans>Holdings roll up into net worth alongside fiat accounts</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ChartLine} title={<Trans>A market screen per coin</Trans>}>
                    <Trans>A market screen per instrument with a price card, a sparkline, and period metrics</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={WifiOff} title={<Trans>Charts that work offline</Trans>}>
                    <Trans>Charts read from your own database, so they keep working with no connection</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Crypto holdings sit next to your cash: symbol, quantity, and a daily price</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Daily prices backfilled only for the crypto accounts you actually hold</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Multi-currency aware — euro-priced coins, dollar-priced coins, and UAH cash all reconcile</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Reachable straight from the crypto group on the home screen</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Days since the built-in history fill in up to today, with a visible progress indicator</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why most expense apps stop at fiat</Trans>}>
                    <p>
                        <Trans>
                            Most expense apps end at fiat. Budgie has crypto holdings as first-class instruments — each one has a quantity,
                            a symbol, and a daily price. Net worth rolls them all up. Runway is the exception: it counts only cash and bank
                            balances by default, and only folds crypto into that forecast once you switch on Include crypto in Settings →
                            Runway.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Item index={1} title={<Trans>Market history without a live ticker</Trans>}>
                    <p>
                        <Trans>
                            Each crypto instrument has its own market screen: the current price, a sparkline of where it has been, metrics
                            for the period, and your holding valued against it. The app ships with a year of daily prices for the nine
                            largest crypto assets, quoted in both euro and dollar, so the charts have something to show the moment you open
                            them.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Beyond that, Budgie fills in the days since the built-in history up to today — but only for crypto accounts you
                            actually hold, in the background, fetching just the days you are missing and then stopping. There is no live
                            ticker and no account: the chart you look at is read from your own database, so it renders offline once the days
                            are there.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={2} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Do the charts work offline?</Trans>}
                    answer={
                        <Trans>
                            Yes. Prices are stored in your local database, so the market screen renders from what you already have. A
                            connection is only needed to fetch the days since the built-in history.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>How far back does the history go?</Trans>}
                    answer={
                        <Trans>
                            The app ships a year of daily closes for the nine largest assets. After that, Budgie fills in the days since
                            then, up to today.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>How is this different from a portfolio tracker?</Trans>}
                    answer={
                        <Trans>
                            Budgie integrates investment holdings into the same net-worth view as your bank accounts and debt. Most
                            portfolio trackers don&apos;t model fiat side-by-side.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Can I record buy / sell history?</Trans>}
                    answer={
                        <Trans>
                            Yes — buys add to the holding and sells take from it. The market screen turns that history into an average cost,
                            a cost basis and an unrealized gain for the position. Realized gains are not shown.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={4}
                    question={<Trans>Can I connect Binance?</Trans>}
                    answer={
                        <Trans>
                            Yes. Connect Binance with a read-only key and your balances and history come into Budgie next to your other
                            accounts. Other exchanges and wallets are tracked by hand.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
