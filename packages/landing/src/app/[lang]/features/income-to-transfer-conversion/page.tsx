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

const SLUG = 'income-to-transfer-conversion';

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

export default async function IncomeToTransferConversionFeaturePage(props: PageLangParam) {
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
                        Refunds, reimbursements, and internal top-ups often land as income when they are really just money moving between
                        accounts. Convert them to transfers in one tap and keep your income totals accurate.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why refunds pollute income analytics</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        When a merchant refunds a purchase, the money reappears on your card as a positive transaction. Most expense
                        trackers record it as income — which is technically accurate in a cash-flow sense but misleading for actual income
                        analysis. A month where you returned a laptop and got paid your salary looks like you earned twice as much as usual.
                        The same problem affects reimbursements from an employer, a friend paying back a shared dinner, or a cash withdrawal
                        that you then deposited into a savings account.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The correct classification is a transfer: money moving from one source to another without representing net new
                        income. Budgie lets you convert any income transaction to a transfer directly from the transaction detail screen.
                        The income total drops immediately, the transfer pair links to the appropriate destination account if one matches,
                        and your analytics reflect actual earned income again.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>One tap, fully reversible</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Open the income transaction, choose Convert to Transfer, and pick the destination account. Budgie creates the
                        transfer pair and immediately recalculates affected statistics. If Budgie&apos;s transfer-pair detection already
                        knows about a matching entry — an expense on the same day for the same amount on the source account — it
                        consolidates both legs automatically rather than creating a duplicate.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The conversion is reversible: open the resulting transfer and convert it back to income at any time. No data is
                        permanently altered; the operation is a reclassification that updates the type field and rebuilds the transfer
                        link, not a deletion and re-creation.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Clean income totals — refunds and reimbursements move out of income into transfers in one tap</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Fully reversible — convert back to income any time without losing data</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Live analytics update — the income column recalculates the moment the conversion is confirmed</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Pair-detection aware — auto-consolidates with a matching expense leg when one is found</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection>
                <FeaturePageFaqItem
                    question={<Trans>Why would I want to convert income to a transfer?</Trans>}
                    answer={
                        <Trans>
                            Some &ldquo;income&rdquo; entries are actually internal moves — a refund landing back on your card, a friend
                            repaying you in cash that you then deposit. Recording them as transfers keeps your income totals reflecting
                            actual income.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I undo the conversion?</Trans>}
                    answer={<Trans>Yes — open the transfer and convert it back to income.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>Does this rebuild my analytics?</Trans>}
                    answer={
                        <Trans>
                            Statistics recompute live; the converted entry leaves the income column and joins the transfers list
                            immediately.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if the matching transfer side already exists?</Trans>}
                    answer={
                        <Trans>
                            The conversion uses the existing pair-detection logic to merge with the matching expense or transfer leg if one
                            is found within the same window.
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
