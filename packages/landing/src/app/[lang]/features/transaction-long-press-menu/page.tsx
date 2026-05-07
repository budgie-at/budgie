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

const SLUG = 'transaction-long-press-menu';

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

export default async function TransactionLongPressMenuFeaturePage(props: PageLangParam) {
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
                        Long-press any transaction card for a native context menu — edit, delete, convert to transfer, or split without ever
                        opening the full edit form.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Five taps is four taps too many</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Editing a transaction in most expense apps means tapping the row to open a detail screen, then tapping an edit
                        button, then navigating form tabs, then saving, then going back. Common operations like deleting a duplicate or
                        reclassifying an expense as a transfer should not cost five taps. Budgie surfaces all of them behind a single
                        long-press gesture anchored to the transaction card itself.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The context menu uses native platform APIs — the system menu component on iPadOS and a bottom sheet on iPhone and
                        Android — so the interaction is immediately familiar. There is no modal, no full-screen form, and no intermediate
                        navigation step for the four most common actions.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works under the hood</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Gesture detection activates after approximately 300 milliseconds of sustained contact on a transaction card. The
                        menu appears anchored to the card, listing only the actions that are valid for that specific transaction type.
                        Expense cards show Edit, Delete, Convert to Transfer, and Split. Transfer cards omit Convert to Transfer since it is
                        already one. Split transactions expose a Merge Back option instead. This context-aware filtering prevents presenting
                        actions that would be no-ops or errors for the current entry type.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Two taps from list to done — long-press plus action, no intermediate screens</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Context-aware menu — actions adapt to transaction type so you never see an invalid option</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Native platform UI — system context menu on iPad, bottom sheet on iPhone and Android</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Gesture-driven flow — one-handed, no toolbar hunting, no extra navigation layer</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection>
                <FeaturePageFaqItem
                    question={<Trans>How do I open the menu?</Trans>}
                    answer={
                        <Trans>
                            Press and hold any transaction card for about 300ms. The native context menu appears anchored to the card.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What actions are available?</Trans>}
                    answer={
                        <Trans>
                            Edit, Delete, Convert to Transfer, and Split. The exact set depends on the transaction type — transfers do not
                            show &ldquo;Convert to Transfer&rdquo;, for example.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I customize the menu?</Trans>}
                    answer={
                        <Trans>Not yet. The menu surfaces the most common actions; let us know on GitHub if you want a custom slot.</Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does this work on iPad?</Trans>}
                    answer={
                        <Trans>Yes — on iPadOS the menu uses the system context-menu UI; on iPhone and Android the menu is a sheet.</Trans>
                    }
                />
            </FeaturePageFaqSection>

            <FeaturePageRelated features={related} locale={lang} />
            <FeaturePageRelatedArticles locale={lang} slugs={entry.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
