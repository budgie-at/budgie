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
import { FeaturePageMedia } from '../../../../feature/component/feature-page-media/feature-page-media';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { FeaturePageWebPageJsonLd } from '../../../../feature/component/feature-page-web-page-json-ld/feature-page-web-page-json-ld';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
import { AppShot } from '../../../../generic/component/app-shot/app-shot';
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

export default async function UncategorizedTransactionsFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Find Uncategorized Transactions Before They Skew Your Budget</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Budgie surfaces missing categories directly inside your filtered transaction list, then opens a focused cleanup view
                        with the same account, date, tag, and type filters.
                    </Trans>
                }
            />

            <FeaturePageMedia>
                <AppShot
                    alt={t(i18n)`Budgie transaction list with the missing categories pill above the uncategorised rows`}
                    locale={lang}
                    scene="uncategorized-transactions-1"
                    slug="uncategorized-transactions"
                />
            </FeaturePageMedia>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why uncategorized transactions quietly break reports</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        One uncategorized grocery run can make your food budget look better than it is. A few missing categories across
                        income and expenses can distort category charts, month-end reviews, and spending trends.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Budgie turns that cleanup into a visible workflow. When the current filter contains uncategorized transactions, a
                        compact missing-category pill appears above the list with the exact count.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Filter-aware count for missing categories under the current account, date, tag, and transaction type</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>One-tap drill-down into only the uncategorized transactions that match your current filters</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Category cleanup from the same transaction cards you already use for editing</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Indexed local SQLite queries, so the insight stays fast on long transaction histories</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Works offline and on-device, with no analytics service reading your financial data</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Open Transactions or an account&apos;s transaction list. Apply any filters you need. If Budgie finds matching
                        transactions without categories, the missing-category pill appears above the list. Tap it to open a focused cleanup
                        page that preserves those filters.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        From there, edit the transactions, apply your custom categories, accept AI category suggestions, or rely on MCC
                        mapping for bank-synced rows. The goal is simple: every report should explain where your money actually went.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageMedia>
                <AppShot
                    alt={t(i18n)`Budgie missing categories screen listing only the transactions that still need a category`}
                    locale={lang}
                    scene="uncategorized-transactions-2"
                    slug="uncategorized-transactions"
                />
            </FeaturePageMedia>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>What are uncategorized transactions?</Trans>}
                    answer={
                        <Trans>
                            They are income or expense transactions without a category. Budgie calls them missing categories in the app
                            because the next action is to assign a category and clean up your reports.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does the count respect my current filters?</Trans>}
                    answer={
                        <Trans>
                            Yes. The pill counts only uncategorized transactions inside the active account, type, date, and tag filters, so
                            the number always matches the list you are reviewing.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Will this slow down my transaction list?</Trans>}
                    answer={
                        <Trans>
                            No. Budgie uses an indexed local SQLite query for the count and the drill-down list. Everything runs on-device,
                            without a cloud analytics service.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can AI categorize the missing transactions?</Trans>}
                    answer={
                        <Trans>
                            Yes. You can still use Budgie&apos;s on-device AI category suggestions, MCC mapping, or manual categories. The
                            missing-category page simply finds the gaps so you know what to fix.
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
