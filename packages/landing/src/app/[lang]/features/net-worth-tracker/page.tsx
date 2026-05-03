/* eslint-disable max-lines-per-function */
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageComparisonTable } from '../../../../feature/component/feature-page-comparison-table/feature-page-comparison-table';
import { FeaturePageCta } from '../../../../feature/component/feature-page-cta/feature-page-cta';
import { FeaturePageFaqItem } from '../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { buildFeaturePageJsonLd } from '../../../../feature/util/build-feature-page-json-ld.util';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
import { getFeatureBySlug } from '../../../../feature/util/get-feature-by-slug.util';
import { getRelatedFeatures } from '../../../../feature/util/get-related-features.util';
import { JsonLd } from '../../../../generic/component/json-ld/json-ld';
import { getI18nInstance } from '../../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import type { ComparisonRowInterface } from '../../../../feature/component/feature-page-comparison-table/feature-page-comparison-table';
import type { Metadata } from 'next';

const SLUG = 'net-worth-tracker';

const COMPARISON_ROWS: ComparisonRowInterface[] = [
    {
        concern: <Trans>Asset coverage</Trans>,
        rival: <Trans>Bank only</Trans>,
        budgie: <Trans>Bank + cash + crypto + stocks + ETFs + debt</Trans>
    },
    {
        concern: <Trans>FX support</Trans>,
        rival: <Trans>One currency, often hardcoded</Trans>,
        budgie: <Trans>Per-account currency, daily auto-conversion</Trans>
    },
    {
        concern: <Trans>Liability accounts</Trans>,
        rival: <Trans>Treated as expenses</Trans>,
        budgie: <Trans>First-class — subtract from net worth</Trans>
    },
    {
        concern: <Trans>Time series</Trans>,
        rival: <Trans>Spending only</Trans>,
        budgie: <Trans>Net worth trendline alongside</Trans>
    }
];

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);
    const entry = getFeatureBySlug(SLUG);
    if (!isDefined(entry)) {
        return {};
    }

    return buildFeaturePageMetadata({
        locale: lang,
        slug: SLUG,
        title: i18n._(entry.metaTitle),
        description: i18n._(entry.metaDescription),
        keywords: entry.seoKeywords.join(', '),
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt
    });
}

export default async function NetWorthTrackerFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);
    const entry = getFeatureBySlug(SLUG);
    if (!isDefined(entry)) {
        return null;
    }

    const related = getRelatedFeatures(SLUG);
    const [breadcrumbSchema, webPageSchema, faqSchema] = buildFeaturePageJsonLd({
        locale: lang,
        slug: SLUG,
        title: i18n._(entry.metaTitle),
        description: i18n._(entry.metaDescription),
        featureName: i18n._(entry.title),
        featuresLabel: i18n._(msg`Features`),
        homeLabel: i18n._(msg`Home`),
        faqs: entry.faqs.map(faq => ({ question: i18n._(faq.question), answer: i18n._(faq.answer) })),
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt
    });

    return (
        <main className="flex-1">
            <JsonLd data={breadcrumbSchema} />
            <JsonLd data={webPageSchema} />
            {isDefined(faqSchema) && <JsonLd data={faqSchema} />}
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={i18n._(entry.title)} locale={lang} />}
                heading={<Trans>Net Worth Tracker for Mobile</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Bank, cash, crypto, stocks, ETFs, and debt — all roll up into a single net-worth number on your home screen, with
                        multi-currency conversion baked in.
                    </Trans>
                }
            />

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
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Each account carries a type (Bank, Cash, Crypto, Stocks, Debt), a currency, and an &ldquo;include in net
                        worth&rdquo; toggle. The home screen sums every included account&apos;s balance, converts to your base currency, and
                        shows the trendline alongside.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Most expense apps vs. Budgie</Trans>
                </FeaturePageHeading>
                <FeaturePageComparisonTable rivalLabel={<Trans>Most expense apps</Trans>} rows={COMPARISON_ROWS} />
            </FeaturePageSection>

            <FeaturePageFaqSection>
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

            <FeaturePageRelated features={related} locale={lang} />
            <FeaturePageRelatedArticles locale={lang} slugs={entry.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
