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

export default async function BinanceSyncFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Binance Sync — Read-Only Keys, Real Balances</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Paste a read-only API key and Budgie pulls your Binance balances and history straight to your phone — then merges
                        your P2P buys with the bank payment that funded them.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>A key that can only read</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Budgie asks for an API key and secret, and the setup screen tells you exactly how to create it: keep only
                        &quot;Enable Reading&quot; switched on, never trading, never withdrawals. Every request is signed on your device
                        with HMAC-SHA256 over the query string, and the app only ever calls read endpoints — there is no order or withdrawal
                        code in it to call.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Your key and secret stay on your device. Nothing is proxied through a Budgie server, because there is no Budgie
                        server: the app talks to Binance directly, the same way it talks to your bank.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Balances taken from Binance itself, covering Spot, Funding, and Flexible and Locked Simple Earn</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>One account per asset, so each coin has its own balance, history, and place in net worth</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Crypto and fiat deposits and withdrawals, P2P buy and sell orders, and Simple Earn rewards</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Spot trades and Convert land as transfers between two of your asset accounts, not as fake income</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>A P2P purchase and the bank payment behind it merge into one cross-currency transfer</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>Historical backfill walks backwards in windows and stops once your account goes quiet</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={6}>
                        <Trans>Each source type is written to your database as it finishes, so completed work is never re-fetched</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={7}>
                        <Trans>
                            Assets Budgie cannot price are kept visible with a &quot;valuation unavailable&quot; note, never dropped
                        </Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>P2P without double-counting</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Buying USDT with a bank card produces two records: money leaving your bank account and crypto arriving on Binance.
                        Counted separately, that is one phantom expense and one phantom income in your statistics every single time.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Budgie matches the two legs automatically. It prefers the fiat figures Binance itself quotes on the order, accepting
                        a bank amount within a small tolerance, and falls back to comparing the implied rate against the exchange rates on
                        your device — triangulating through your base currency, so a hryvnia payment for USDT resolves without a direct
                        currency pair. Both legs must sit within an hour of each other, and up to three bank payments can add up to a single
                        P2P purchase. When two candidates are equally plausible, nothing is merged: an ambiguous guess is worse than a
                        manual fix.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Setup is two steps: enter the key and secret, then pick which assets to keep as accounts. The first sync walks your
                        history backwards in windows — deposits and withdrawals in wide pages, rewards, Convert, fiat orders, and P2P in
                        narrower ones — and gives up once it has crossed a long stretch of empty windows. Later runs stay incremental, and
                        balances are re-anchored to what Binance reports, including assets you have sold down to zero.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Can Budgie trade or withdraw with my key?</Trans>}
                    answer={
                        <Trans>
                            No. The app only calls Binance read endpoints, and the setup instructions ask you to create a key with reading
                            permission only. Permissions are set on Binance&apos;s side, so a key without trading or withdrawal rights
                            simply cannot be used for either.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Which balances are included?</Trans>}
                    answer={
                        <Trans>
                            Spot and Funding wallets plus Flexible and Locked Simple Earn positions, folded into one balance per asset so
                            what you see matches what Binance shows you.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How far back does the history go?</Trans>}
                    answer={
                        <Trans>
                            Several years for deposits, withdrawals, trades, Convert, and Earn rewards. P2P order history is capped at six
                            months by Binance&apos;s own API, so anything older cannot be pulled by any app.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if the app is closed mid-sync?</Trans>}
                    answer={
                        <Trans>
                            Each source type is committed to your local database as soon as it completes, so the work already done is kept
                            and the next run picks up from there instead of starting over.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Do Binance holdings count towards net worth?</Trans>}
                    answer={
                        <Trans>
                            Yes — each asset is a normal account, so it rolls into net worth next to your bank accounts, deposits, and
                            debts.
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
