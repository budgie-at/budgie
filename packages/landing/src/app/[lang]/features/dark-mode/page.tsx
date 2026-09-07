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

export default async function DarkModeFeaturePage(props: PageLangParam) {
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
                heading={<Trans>True Dark Mode (Not Just Dimmed)</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        System-adaptive dark theme that respects OLED displays and switches with your device — or lock to dark or light.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>What the transaction list actually shows</Trans>}>
                    <Trans>One real screen, rendered in whichever theme this page is in right now.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Point index={0}>
                    <Trans>The background is solid black, not a dimmed grey panel layered over a light design.</Trans>
                </FeatureStory.Point>

                <FeatureStory.Shot
                    alt={t(i18n)`Budgie transaction list in dark mode with a solid black background and bright red and green amounts`}
                    index={0}
                    locale={lang}
                    priority
                    scene="expense-tracking-2"
                    slug="expense-tracking"
                >
                    <FeatureStory.Callout index={0} y={0.09}>
                        <Trans>Solid black surface</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.422}>
                        <Trans>Brighter red and green</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Point index={1}>
                    <Trans>
                        Expense and income amounts shift to brighter red and green in dark mode, not the muted tones carried over from light
                        mode.
                    </Trans>
                </FeatureStory.Point>
                <FeatureStory.Point index={2}>
                    <Trans>
                        Switching modes is one tap on the Dark Mode toggle in Settings — a manual switch, not an automatic handoff.
                    </Trans>
                </FeatureStory.Point>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why a finance app at midnight matters</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        A finance app you check at midnight should not blast your retinas. Budgie&apos;s dark theme is OLED-friendly black,
                        not a dimmed gray, and respects the system preference by default.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Manual override is two taps in Settings. The theme switch is non-flickering on cold launch (no white-flash). Charts
                        and accents recolor for legibility.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>OLED-friendly true black canvas — saves battery on modern phones</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>System / Light / Dark — three-way switch in Settings</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Chart palettes auto-recompute for legibility on dark canvas</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>No white flash on cold launch — native splash respects the OS theme</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Persists across app relaunch and device restarts</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Is it true black or just dark gray?</Trans>}
                    answer={
                        <Trans>
                            OLED-friendly black for the background. Cards and surfaces are dark gray for hierarchy, but the canvas pixels
                            are off — saves battery on OLED screens.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does it switch automatically?</Trans>}
                    answer={<Trans>Yes — system theme by default. Override to Light or Dark in Settings if you prefer.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>Why no white flash on cold launch?</Trans>}
                    answer={
                        <Trans>
                            The native splash screen reads the OS theme directly so the transition into the React Native app stays in dark
                            mode without an intermediate light state.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Do charts recolor?</Trans>}
                    answer={
                        <Trans>
                            Yes. Chart palettes recompute for legibility — emerald accents shift slightly for contrast on a dark canvas.
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
