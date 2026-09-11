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
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { FeaturePageWebPageJsonLd } from '../../../../feature/component/feature-page-web-page-json-ld/feature-page-web-page-json-ld';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
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

export default async function RecurringPaymentsCalendarFeaturePage(props: PageLangParam) {
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
                heading={featureName}
                locale={lang}
                tagline={
                    <Trans>
                        Budgie spots subscription patterns and renewals, plots them on a month calendar, and forecasts what&apos;s coming.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>The slow leak in every budget</Trans>}>
                    <Trans>
                        Budgie scans your history for amount and cadence patterns and plots every recurring charge on a month calendar.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Detected, not declared</Trans>}>
                    <Trans>
                        Budgie finds the pattern itself — same merchant, similar amount, regular interval — and marks the days those charges
                        fall on.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Recurring screen showing a September 2026 calendar with detected payment days marked and an upcoming charges list`}
                    index={0}
                    locale={lang}
                    priority
                    scene="recurring-payments-calendar-1"
                    slug="recurring-payments-calendar"
                >
                    <FeatureStory.Callout y={0.393}>
                        <Trans>Detected, not added</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>A month grid of what bills</Trans>}>
                    <Trans>Every marked day is a real recurring charge. The upcoming list totals what is still to come this month.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Recurring screen showing a September 2026 calendar with detected payment days marked and an upcoming charges list`}
                    index={1}
                    locale={lang}
                    scene="recurring-payments-calendar-1"
                    slug="recurring-payments-calendar"
                >
                    <FeatureStory.Callout y={0.677}>
                        <Trans>Upcoming charges</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Sixty days ahead</Trans>}>
                    <Trans>Tap any marked day to see exactly what bills — here Day 15 lists the gym, Netflix and Spotify.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie Recurring screen with Day 15 selected and a list of Gym Membership, Netflix and Spotify charges`}
                    index={2}
                    locale={lang}
                    scene="recurring-payments-calendar-2"
                    slug="recurring-payments-calendar"
                >
                    <FeatureStory.Callout y={0.611}>
                        <Trans>Charges for that day</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

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

            <FeaturePageFaqSection locale={lang}>
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

            <FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
