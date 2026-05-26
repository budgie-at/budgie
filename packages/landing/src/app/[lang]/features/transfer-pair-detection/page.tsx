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

const SLUG = 'transfer-pair-detection';

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

export default async function TransferPairDetectionFeaturePage(props: PageLangParam) {
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
                        Budgie consolidates obvious transfers and merchant refunds automatically, then leaves ambiguous matches for review.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why imported transactions need consolidation</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Two synced banks see the same transfer twice — once as a debit, once as a credit. Without consolidation, your
                        spending doubles. Budgie matches the pair using amount, time window, and the counter-IBAN stored on each leg.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Refunds have the opposite problem: a merchant credit can look like income even though it reverses an earlier
                        expense. Budgie consolidates clear refund matches automatically and keeps uncertain cases available for manual
                        review.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Counter-IBAN stored per leg — primary signal for cross-account matching</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Amount + time-window matching catches transfers and refunds without perfect bank metadata</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Cross-currency: $1000 → €925 within 3 days matches when the FX rate is plausible</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Manual review for ambiguous refund matches instead of silent guesses</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Original entries stay linked under the consolidated transaction for full audit trail</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        On every consolidation run, Budgie scans new entries against existing ones for matching counter-IBAN, amount, sign,
                        title, and time window. Transfer matches become one transfer. Refund matches link income back to the expense they
                        reverse.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection>
                <FeaturePageFaqItem
                    question={<Trans>What if the algorithm misidentifies a match?</Trans>}
                    answer={
                        <Trans>
                            Manual override is one tap. Open the consolidated transaction, choose Revert, and Budgie restores the original
                            entries with their original categories.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does this work across two different banks?</Trans>}
                    answer={
                        <Trans>
                            Yes — that&apos;s the whole point. Counter-IBAN is the primary matching signal: both banks store the
                            counterparty IBAN on their respective legs, so Budgie can link them directly. Monobank, PrivatBank, and Erste
                            all expose counter-IBAN. For cross-currency pairs, an exchange-rate tolerance band confirms the match when the
                            amounts differ due to FX conversion.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What about cross-currency transfers?</Trans>}
                    answer={
                        <Trans>
                            Pairs match if the implied FX rate falls within a plausible tolerance band — the check runs within a 3-day time
                            window. The original amounts in both currencies are preserved on each leg.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Will old (already-imported) transactions get re-matched?</Trans>}
                    answer={
                        <Trans>
                            Yes. Each consolidation run rescans recent entries against existing ones, so transfers and refunds can match
                            retroactively when enough matching info arrives.
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
