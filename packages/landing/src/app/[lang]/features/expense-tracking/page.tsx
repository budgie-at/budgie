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

const SLUG = 'expense-tracking';

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

export default async function ExpenseTrackingFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Expense Tracking, Reimagined</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Log expenses, income, and transfers in seconds with a bottom-sheet quick-entry form designed for one-handed use.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why entry friction kills expense trackers</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        An expense tracker lives or dies by entry friction. Budgie&apos;s quick-entry sheet picks the right account, the
                        most-likely category, and the current date by default — typically two taps to a saved transaction.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Every entry is amount + account + category + tags + comment + date. Long-press any transaction in the list for a
                        context menu. Edit, delete, split, convert to a transfer, or link income back to a refunded expense without leaving
                        the screen.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Two-tap entry: smart defaults for account, category, and date pick the right values out of the box</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Three first-class transaction types: expense, income, transfer — never confused, never miscounted</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Long-press any row for context actions: edit, delete, split, convert to transfer, convert to refund</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>MCC pre-fill on bank-synced transactions; AI category suggestion on manual entries</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Comments grow vertically up to two lines so receipts and references fit without truncation</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Three transaction types: expense (debits an account), income (credits an account), transfer (moves between two of
                        your accounts). Categories are user-defined, optionally MCC-backed when imported via bank sync.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection>
                <FeaturePageFaqItem
                    question={<Trans>How fast is the quick-entry form?</Trans>}
                    answer={
                        <Trans>
                            Open the sheet, type the amount, tap save — that&apos;s the typical flow once defaults are tuned to your habits.
                            The form picks your default account, the most-likely category, and today&apos;s date automatically.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I edit a transaction after saving?</Trans>}
                    answer={
                        <Trans>
                            Always. Long-press the row in the list for a context menu with Edit, Delete, Split, Convert to Transfer, and
                            Convert to Refund actions when they apply.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does Budgie distinguish transfers from expenses?</Trans>}
                    answer={
                        <Trans>
                            Yes. Transfer is a first-class transaction type with explicit source and destination accounts; it never inflates
                            your spending stats.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What about recurring purchases?</Trans>}
                    answer={
                        <Trans>
                            Budgie auto-detects recurring patterns and surfaces them on a dedicated calendar tab. See the Recurring Payments
                            Calendar feature for details.
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
