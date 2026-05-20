/* eslint-disable max-lines-per-function */
import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
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

import type { Metadata } from 'next';

const SLUG = 'uncategorized-transactions';

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
        image: `/${lang}/features/${SLUG}/opengraph-image`,
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt
    });
}

export default async function UncategorizedTransactionsFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Find Uncategorized Transactions Before They Skew Your Budget</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Budgie surfaces missing categories directly inside your filtered transaction list, then opens a focused cleanup view
                        with the same account, date, tag, and type filters.
                    </Trans>
                }
            />

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

            <FeaturePageFaqSection>
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

            <FeaturePageRelated features={related} locale={lang} />
            <FeaturePageRelatedArticles locale={lang} slugs={entry.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
