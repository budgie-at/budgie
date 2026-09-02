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
                heading={<Trans>Crypto, Stocks, ETFs — All In One Place</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Track Bitcoin, Ethereum, AAPL, an S&amp;P 500 ETF, and gold alongside your bank accounts in a single net-worth view.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why most expense apps stop at fiat</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Most expense apps end at fiat. Budgie has investment instruments as first-class — each holding has a quantity, an
                        instrument symbol, and a live or manual price. Net worth rolls them all up.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Instruments cover crypto, stocks, ETFs, and commodities. Manual price updates are fine for low-frequency tracking,
                        and the major crypto assets come with real daily market history built in.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>First-class instrument types: crypto, stocks, ETFs, commodities</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Manual or imported price updates — your call on cadence and source</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Holdings roll up into net worth alongside fiat accounts</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Multi-currency aware — euro-denominated ETF + dollar stocks + UAH cash all reconcile</Trans>
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

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Account type Crypto or Stocks. Each holding is an instrument + quantity. Prices come from the built-in daily history
                        for major crypto assets, or from your own manual edits. Net-worth converts via the latest price snapshot.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Which assets can I track?</Trans>}
                    answer={
                        <Trans>
                            Crypto (Bitcoin, Ethereum, others), stocks (any ticker), ETFs, and commodities. Each holding is a row of
                            (instrument, quantity, price).
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Where do prices come from?</Trans>}
                    answer={
                        <Trans>
                            The nine largest crypto assets ship with a year of daily prices in euro and dollar. Longer history is pulled
                            from CoinGecko&apos;s public market data for the crypto accounts you hold, and everything else you set by hand.
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
                            Yes — buys are inflows to the holding account; sells are outflows with the realized FX. P&amp;L drilling on the
                            way for a future release.
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
