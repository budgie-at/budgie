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

export default async function DateFilterPresetsFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Date Filter Presets — Past Periods, One Tap</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Today, This Week, Last Week, This Month, Last Month, This Year, All Time — every screen with a list, two taps to the
                        right window.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Two taps to the window you want</Trans>}>
                    <Trans>
                        Two screens: the sheet where a month calendar and the preset chips sit together, and the list a moment after one of
                        those chips is tapped.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Seven presets, one tap</Trans>}>
                    <Trans>
                        The Date chip opens a month calendar with the presets in a row underneath it: Today, This Week, Last Week, This
                        Month, Last Month, This Year, All Time. When none of them is the window you want, pick a start and an end date on
                        the calendar instead and tap Show selected range.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie date filter sheet with an August calendar above the row of preset range chips`}
                    index={0}
                    locale={lang}
                    priority
                    scene="date-filter-presets-1"
                    slug="date-filter-presets"
                >
                    <FeatureStory.Callout y={0.498}>
                        <Trans>Pick any range by hand</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.845}>
                        <Trans>Presets, one tap each</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>The list re-queries instantly</Trans>}>
                    <Trans>
                        Last Month lands as a chip in the filter row and the count above the list drops from 761 transactions to 73, every
                        row now dated inside August. Clear All puts the whole list back, and the date chip stacks with the type, amount,
                        category, tag and account chips beside it.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie transaction list filtered to Last Month, showing the active chip and 73 matching transactions`}
                    index={1}
                    locale={lang}
                    scene="date-filter-presets-2"
                    slug="date-filter-presets"
                >
                    <FeatureStory.Callout y={0.198}>
                        <Trans>Matching count, re-queried</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.395}>
                        <Trans>Every row now from August</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why a date picker should never be the bottleneck</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Manual date pickers are slow. Budgie wraps them with the seven presets you actually use, plus a custom-range
                        fallback. Every transaction list, every analytics tab, every recurring view shares the same picker.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        This Week and Last Week always mean the most recently completed Monday-to-Sunday span. The week boundary itself does
                        not follow your device locale today.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Seven presets cover the windows you actually use, from Today to All Time</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Custom range fallback for anything else</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Same picker across analytics, transactions, and recurring screens</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>This Week and Last Week always run Monday to Sunday, no matter your locale</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>
                            &ldquo;Last Month&rdquo; always means the most-recent COMPLETED month — never the half-finished current one
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>An amount-range chip in the same filter row, with a From value, a To value, or both</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Narrow by amount, not just by date</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        The filter row is not only about time. Next to the date, type, and category chips there is an amount range: set a
                        From value to hunt down the large purchases, a To value to sweep up the small ones, or both to look at a band. The
                        chip shows the range you picked, and clearing it is one tap.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Combined with the date presets it turns &quot;where did the money go last month?&quot; into a two-chip question:
                        Last Month plus everything above a threshold, and the list in front of you is the answer.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Can I customize the week start?</Trans>}
                    answer={
                        <Trans>
                            No. This Week and Last Week always use a Monday-to-Sunday week, regardless of your locale — there is no
                            locale-based or manual override today.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Are the presets the same on every screen?</Trans>}
                    answer={
                        <Trans>
                            Yes. One picker component is reused across analytics tabs, the transaction list, and the recurring calendar.
                            Filters apply consistently.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I filter by amount too?</Trans>}
                    answer={
                        <Trans>
                            Yes — the filter row has an amount-range chip beside the date one. Give it a From value, a To value, or both,
                            and it stacks with every other active filter.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What does &ldquo;All Time&rdquo; cover?</Trans>}
                    answer={<Trans>Every transaction in your database. Useful for full-history analytics or one-off audits.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I save a custom range?</Trans>}
                    answer={
                        <Trans>Custom ranges are session-scoped today. Saved custom ranges are on the roadmap for a future release.</Trans>
                    }
                />
            </FeaturePageFaqSection>

            <FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
