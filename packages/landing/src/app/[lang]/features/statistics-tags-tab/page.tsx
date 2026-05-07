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

const SLUG = 'statistics-tags-tab';

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

export default async function StatisticsTagsTabFeaturePage(props: PageLangParam) {
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
                heading={i18n._(entry.title)}
                locale={lang}
                tagline={
                    <Trans>
                        Switch to the Tags tab in Statistics for sortable per-tag totals — income, expense, and net — plus a drillable
                        Untagged bucket that shows exactly which transactions have no label.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why category analytics alone leaves money unlabeled</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Category-based analytics answer what kind of expense a transaction is — groceries, transport, dining. Tags answer
                        a different and equally important question: what was it for? A dinner tagged as a #work-lunch, a #vacation flight
                        charged to the same &ldquo;Travel&rdquo; category as a commute, a shared dinner that needs a #split label — these
                        distinctions only surface when you have a dedicated tag reporting layer.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The Tags tab in Budgie Statistics puts per-tag totals on the same screen as category breakdowns, reachable with a
                        single tap on the tab switcher. Each row shows income, expense, and net for the currently selected date range.
                        Tapping any row drills into the full filtered transaction list for that tag, with sorting and date filters
                        available. The Untagged bucket surfaces every transaction that would otherwise be invisible to tag-based analysis.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>The Untagged bucket as a labeling gap-finder</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        The Untagged bucket is not an error state — it is a deliberate audit tool. Every transaction with zero tags
                        accumulates there, and its total tells you how much of your spending currently has no tag context. Tapping it opens
                        a standard transaction list filtered to &ldquo;no tags&rdquo;, where you can open each row and add the missing
                        label immediately. Budgie does not force you to tag everything, but it makes the gap visible so the choice is
                        informed.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The Untagged total recomputes live as you tag transactions, so the number shrinks in real time during a labeling
                        pass. Combined with AI tag suggestions, a short review session can close most gaps without the usual manual-tag
                        tedium.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Per-tag income, expense, and net totals — one tap from the Statistics screen tab bar</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Drillable Untagged bucket that lists every transaction missing a label for easy retroactive tagging</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Full date filter compatibility — respects Last Week, Last Month, and Custom ranges globally</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Tap any tag row to open the filtered transaction list with all sorts and filters available</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection>
                <FeaturePageFaqItem
                    question={<Trans>How is this different from the Tag Analytics page?</Trans>}
                    answer={
                        <Trans>
                            Tag Analytics is the umbrella concept; this page documents the specific Tags-tab UI in the Statistics screen,
                            where you can switch between Categories and Tags views with one tap.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What&apos;s the Untagged bucket?</Trans>}
                    answer={
                        <Trans>
                            A virtual tag that aggregates every transaction with zero tags. Tapping it lists each contributing transaction
                            so you can label them retroactively.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I drill down from a tag?</Trans>}
                    answer={
                        <Trans>
                            Yes — tapping any tag row opens the full transaction list filtered to that tag, with the same sorts and date
                            filters available everywhere else.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does this work with the date filter presets?</Trans>}
                    answer={
                        <Trans>
                            Yes — the Tags tab respects whatever range is active globally (Last Week, Last Month, Custom).
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
