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

const SLUG = 'ai-transaction-suggestions';

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

export default async function AiTransactionSuggestionsFeaturePage(props: PageLangParam) {
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
                        Open the expense form and Budgie offers pill-shaped suggestions from your own history — category, tags, comment,
                        amount, and account all pre-filled before you type a single character.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why the same merchant should never need a second thought</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        The average user logs the same merchant more than thirty times a year. Typing the category, picking a tag, entering
                        the usual amount, and choosing the right account for the same coffee shop is wasted effort — the information is
                        already in your history. Budgie surfaces it as tappable pill-shaped chips the moment you open the form, so
                        confirming a familiar expense takes one tap instead of seven.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Unlike cloud-based suggestion engines that profile spending patterns on a vendor server, every match happens
                        on-device. Your transaction history never leaves your phone, and the suggestions improve as you add more entries —
                        no account, no sync, no exposure.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Two engines, zero cloud round-trips</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Suggestions are powered by two complementary on-device systems. The first is a SQL pattern engine that scans your
                        weekly and monthly transaction history to surface the most likely category, amount, and account for a given merchant
                        name. The second is a 768-dimensional embedding lookup that encodes the current title and finds the nearest
                        historical entries in vector space — catching name variations and abbreviations that a keyword match would miss.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        When both engines agree, the suggestion chips appear immediately. When they diverge, the SQL pattern wins for
                        structured fields like amount and category while the embedding adds tag and comment hints. Every accepted or
                        corrected suggestion feeds the embedding index so the next similar entry is even closer.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>One-tap form fill — category, tags, amount, and account pre-populated from your own history</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Fully private — both engines run on-device, no network call, no profiling</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Self-improving — accepted or corrected suggestions tighten the embedding index for next time</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Works offline and on every form variant — expense, income, and transfer</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection>
                <FeaturePageFaqItem
                    question={<Trans>Where do the suggestions come from?</Trans>}
                    answer={
                        <Trans>
                            Two sources: (1) weekly/monthly SQL patterns over your own transactions, and (2) a 768-dim embedding lookup
                            matching the current title against your nearest historical entries. No cloud calls.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Will it suggest things I never bought?</Trans>}
                    answer={
                        <Trans>No. The suggestion engine only proposes values from transactions you have already logged or imported.</Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I disable suggestions?</Trans>}
                    answer={<Trans>Yes — toggle them off in Settings → AI. Manual entry stays exactly the way it was before.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>Does this work for income and transfers too?</Trans>}
                    answer={<Trans>Yes. The suggestion engine runs on every form variant — expense, income, and transfer.</Trans>}
                />
            </FeaturePageFaqSection>

            <FeaturePageRelated features={related} locale={lang} />
            <FeaturePageRelatedArticles locale={lang} slugs={entry.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
