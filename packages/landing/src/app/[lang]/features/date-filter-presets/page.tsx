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
import { FeaturePageMedia } from '../../../../feature/component/feature-page-media/feature-page-media';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageRelatedArticles } from '../../../../feature/component/feature-page-related-articles/feature-page-related-articles';
import { FeaturePageRelated } from '../../../../feature/component/feature-page-related/feature-page-related';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { FeaturePageWebPageJsonLd } from '../../../../feature/component/feature-page-web-page-json-ld/feature-page-web-page-json-ld';
import { buildFeaturePageMetadata } from '../../../../feature/util/build-feature-page-metadata.util';
import { AppShot } from '../../../../generic/component/app-shot/app-shot';
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
                        Today, Yesterday, This Week, Last Week, This Month, Last Month, This Year, All Time — every screen with a list, two
                        taps to the right window.
                    </Trans>
                }
            />

            <FeaturePageMedia>
                <AppShot
                    alt={t(i18n)`Budgie transaction date filter with the month grid above the preset range buttons`}
                    locale={lang}
                    scene="date-filter-presets-1"
                    slug="date-filter-presets"
                />
            </FeaturePageMedia>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why a date picker should never be the bottleneck</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Manual date pickers are slow. Budgie wraps them with the eight presets you actually use, plus a custom-range
                        fallback. Every transaction list, every analytics tab, every recurring view shares the same picker.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The picker is locale-aware. Week-start day comes from your device locale. Last Week always means &quot;the most
                        recent completed Monday-to-Sunday&quot; (or Sunday-to-Saturday for en-US users).
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Eight presets cover the windows you actually use, from Today to All Time</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Custom range fallback for anything else</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Same picker across analytics, transactions, and recurring screens</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Locale-aware week start (Monday in EU, Sunday in en-US)</Trans>
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

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        One picker component, used across analytics, transactions, and recurring screens. Customize the start-of-week in
                        Settings if your locale default doesn&apos;t match.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Can I customize the week start?</Trans>}
                    answer={<Trans>Yes — Settings → Display → Start of Week. Override the locale default with Monday or Sunday.</Trans>}
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
