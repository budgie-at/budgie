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

const SLUG = 'recurring-payments-calendar';

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

export default async function RecurringPaymentsCalendarFeaturePage(props: PageLangParam) {
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
                        Budgie spots subscription patterns and renewals, plots them on a month calendar, and forecasts what&apos;s coming.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why subscriptions need their own view</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Subscriptions are the slow leak in every budget. Budgie scans your transaction history for amount + cadence patterns
                        (Netflix, gym, mortgage, ISA) and surfaces them on a dedicated calendar tab.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Tap a calendar day to see the transactions due. The forecasted upcoming list extends out into the next 60 days.
                        Cross-currency recurring shows in your home currency; original amount on tap.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Auto-detection scans transaction history for amount + cadence patterns — no manual setup</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Month-grid calendar plots upcoming renewals; tap a day to see what&apos;s billing</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>60-day forecast list of upcoming recurring payments</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Cross-currency recurring shows in your home currency; original amount on tap</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Manual edits to detected patterns are sticky — the next scan respects them</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Detection runs as a background task on your transaction table. The pattern interface stores merchant fingerprint,
                        average amount, cadence, and last-seen date. Manual edits to a pattern are sticky.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection>
                <FeaturePageFaqItem
                    question={<Trans>How does Budgie know what&apos;s recurring?</Trans>}
                    answer={
                        <Trans>
                            A background scan looks at your transaction history for amount + cadence patterns: same vendor, similar amount,
                            regular interval. Confidence scores filter out one-off matches.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What about cross-currency subscriptions?</Trans>}
                    answer={
                        <Trans>
                            Recurring entries show in your home currency on the calendar; tap any entry to see the original amount and
                            currency.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I edit a detected pattern?</Trans>}
                    answer={
                        <Trans>
                            Yes. Tap a pattern to adjust amount, cadence, or merchant. Manual edits are sticky — the next scan respects
                            them.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How far does the forecast go?</Trans>}
                    answer={
                        <Trans>
                            60 days into the future based on each pattern&apos;s cadence. Useful for spotting which week is going to be
                            heavy.
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
