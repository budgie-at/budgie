/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBreadcrumbsJsonLd } from '../../../../feature/component/feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
import { FeaturePageComparisonTable } from '../../../../feature/component/feature-page-comparison-table/feature-page-comparison-table';
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

export default async function NetWorthTrackerFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Net Worth Tracker for Mobile</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Bank, cash, crypto, stocks, ETFs, and debt — all roll up into a single net-worth number on your home screen, with
                        multi-currency conversion baked in.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Watch the number add up</Trans>}>
                    <Trans>Four screens, from the total on your home screen to the account sitting behind it.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>One number, everything in it</Trans>}>
                    <Trans>Bank, cash, crypto and debt are already inside the figure at the top of Home.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie home screen with the total balance header above every account section`}
                    index={0}
                    locale={lang}
                    priority
                    scene="net-worth-tracker-1"
                    slug="net-worth-tracker"
                >
                    <FeatureStory.Callout y={0.145}>
                        <Trans>Total in your base currency</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.208}>
                        <Trans>Fiat and crypto, split out</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Every asset class in one list</Trans>}>
                    <Trans>Bank, cash and crypto share a single scroll, and each group carries its own subtotal.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie home screen scrolled through the bank, cash and crypto groups with a subtotal on each one`}
                    index={1}
                    locale={lang}
                    scene="crypto-investment-tracking-1"
                    slug="crypto-investment-tracking"
                >
                    <FeatureStory.Callout y={0.415}>
                        <Trans>A subtotal per group</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.735}>
                        <Trans>Crypto, grouped like a bank</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Native units, converted value</Trans>}>
                    <Trans>A wallet keeps its own units. The total on Home counts what those units are worth today.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Bitcoin wallet screen in Budgie showing the balance in BTC above two purchase transactions`}
                    index={2}
                    locale={lang}
                    scene="crypto-investment-tracking-2"
                    slug="crypto-investment-tracking"
                >
                    <FeatureStory.Callout y={0.198}>
                        <Trans>Balance stays in its own unit</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.398}>
                        <Trans>Every buy keeps its rate</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={3} title={<Trans>Debt counts, both directions</Trans>}>
                    <Trans>What you lent adds to your net worth. What you owe subtracts from it, down to the last repayment.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie debt account screen showing the amount left to receive above two repayment transfers`}
                    index={3}
                    locale={lang}
                    scene="debt-tracking-2"
                    slug="debt-tracking"
                >
                    <FeatureStory.Callout y={0.19}>
                        <Trans>Left to receive, live</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.615}>
                        <Trans>Each repayment is a transfer</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why an expense tracker should also be a balance sheet</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Most expense apps stop at &ldquo;this month&apos;s spending.&rdquo; Budgie gives you the full balance-sheet view —
                        assets, liabilities, and the line they form between them — without spreadsheets.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Toggle &ldquo;include in net worth&rdquo; per account. A daily background task pulls fresh exchange rates so a Euro
                        savings account, a USDC wallet, and a UAH-denominated salary all show in your home currency.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Per-account &ldquo;include in net worth&rdquo; toggle — partial-truth balance is your call</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Daily background FX-rate refresh converts every account to your base currency</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Liability and debt accounts subtract automatically; receivables add</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Crypto, stocks, ETFs, and commodities sit alongside fiat with the same UX</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Tap any aggregated number to drill into the per-leg native amounts</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Most expense apps vs. Budgie</Trans>
                </FeaturePageHeading>
                <FeaturePageComparisonTable rivalLabel={<Trans>Most expense apps</Trans>}>
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>Bank + cash + crypto + stocks + ETFs + debt</Trans>}
                        concern={<Trans>Asset coverage</Trans>}
                        rival={<Trans>Bank only</Trans>}
                    />
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>Per-account currency, daily auto-conversion</Trans>}
                        concern={<Trans>FX support</Trans>}
                        rival={<Trans>One currency, often hardcoded</Trans>}
                    />
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>First-class — subtract from net worth</Trans>}
                        concern={<Trans>Liability accounts</Trans>}
                        rival={<Trans>Treated as expenses</Trans>}
                    />
                    <FeaturePageComparisonTable.Row
                        budgie={<Trans>Net worth trendline alongside</Trans>}
                        concern={<Trans>Time series</Trans>}
                        rival={<Trans>Spending only</Trans>}
                    />
                </FeaturePageComparisonTable>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Where do exchange rates come from?</Trans>}
                    answer={
                        <Trans>
                            A daily background task pulls rates from a public-domain feed and stores a snapshot per day on your device. No
                            live rate broker is queried at render time.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I exclude an account from net worth?</Trans>}
                    answer={
                        <Trans>
                            Yes. Each account has an &ldquo;Include in net worth&rdquo; toggle so you can keep, say, a business escrow
                            account separate from your personal balance sheet.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How do crypto and stock holdings price?</Trans>}
                    answer={
                        <Trans>
                            Either by manual price update or by importing your brokerage&apos;s CSV export. Live ticker integration is
                            opt-in to keep the offline-first guarantee.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is the home screen number always accurate?</Trans>}
                    answer={
                        <Trans>
                            As accurate as your most-recent balance + FX rate. Manual accounts hold whatever balance you set; bank-synced
                            accounts reconcile every sync.
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
