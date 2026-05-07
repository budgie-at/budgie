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

const SLUG = 'tag-analytics';

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

export default async function TagAnalyticsFeaturePage(props: PageLangParam) {
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
                        A dedicated Tags tab lives alongside the Categories tab in Analytics — per-tag income, expense, and net totals, plus
                        a drillable Untagged bucket that surfaces every transaction missing a label.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why the Tags tab answers questions categories can&apos;t</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Categories tell you what kind of expense. Tags tell you for what purpose — &quot;Italy trip total&quot;,
                        &quot;shared rent&quot;, &quot;reimbursable meals&quot;. Switch to the Tags tab in Analytics and every tag becomes
                        its own row with income, expense, and net broken out separately.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The Untagged bucket collects every transaction that carries zero tags. It is a deliberate gap-finder — tap it to see
                        the full list, label what you missed, and watch the bucket shrink.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Dedicated Tags tab alongside the Categories tab — one tap to switch views</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Per-tag income, expense, and net totals — each tag row broken out separately</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Untagged bucket surfaces every transaction missing a label — drill in and fix gaps</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Drill from any tag row into its underlying transactions with the same date filters</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Respects the global date-range preset — Last Week, Last Month, Custom, or All Time</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Open Statistics and tap the Tags tab. Each tag becomes a sortable row showing income, expense, and net for the
                        active date range. The Untagged row aggregates every transaction without a tag. Tap any row to drill into the full
                        transaction list filtered to that tag.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection>
                <FeaturePageFaqItem
                    question={<Trans>How is this different from category analytics?</Trans>}
                    answer={
                        <Trans>
                            Categories answer &quot;what kind of expense&quot;; tags answer &quot;for what purpose&quot;. Both views live in
                            Analytics — switch between them with one tap. Categories give a structured budget view; tags give project-level
                            and context-level views.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What&apos;s in the Untagged bucket?</Trans>}
                    answer={
                        <Trans>
                            Every transaction that carries zero tags. Tapping the Untagged row opens the full transaction list so you can
                            label them retroactively — the bucket is a deliberate gap-finder, not a catch-all category.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I see income totals per tag?</Trans>}
                    answer={
                        <Trans>
                            Yes. Each tag row shows separate income, expense, and net totals — useful when a tag spans both (refunds tagged
                            #vacation appear in the income column for that tag).
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I drill into a tag&apos;s transactions?</Trans>}
                    answer={
                        <Trans>
                            Tap any tag row to see every contributing transaction for the current period, with the same sort options and
                            date filters available everywhere else in Analytics.
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
