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

export default async function MultiLanguageAppFeaturePage(props: PageLangParam) {
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
                heading={<Trans>Budgie in Five Languages</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Full UI in English, Ukrainian, French, German, and Spanish — auto-detected from device locale, switchable in-app.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>The same app, five languages deep</Trans>}>
                    <Trans>Two screens: the language sheet that lists all five, and the Settings page it hands you back to.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Five languages, all first-class</Trans>}>
                    <Trans>English, Ukrainian, French, German and Spanish.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie language selector sheet with a search box and English, French and Ukrainian rows, each with a flag and language code`}
                    index={0}
                    locale={lang}
                    priority
                    scene="multi-language-app-1"
                    slug="multi-language-app"
                >
                    <FeatureStory.Callout y={0.62}>
                        <Trans>Search bar above the list</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.69}>
                        <Trans>Flag, name and code per row</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Switches without a relaunch</Trans>}>
                    <Trans>Pick one and the whole UI re-renders in place — Settings included.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie settings screen with the General section showing the Language row set to the active language above Main Currency and Default Account`}
                    index={1}
                    locale={lang}
                    scene="offline-first-expense-tracker-2"
                    slug="offline-first-expense-tracker"
                >
                    <FeatureStory.Callout y={0.518}>
                        <Trans>Language row shows your pick</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why privacy-first finance shouldn&apos;t be English-only</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Privacy-first finance tools are usually English-only. Budgie ships full translations across five languages so
                        non-English-first speakers don&apos;t lose features in translation.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Language switching is in-app — no reinstall. Numbers and dates format using whichever language you have selected;
                        there is no separate locale setting to keep in sync.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Five languages: English, Ukrainian, French, German, Spanish — full UI</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Auto-detected from device locale on first launch</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>In-app switcher — no reinstall, no relaunch</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Number and date formatting follows the language you choose in Settings</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Open-source translations — community can contribute new locales</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Which languages are supported?</Trans>}
                    answer={
                        <Trans>
                            English (source), Ukrainian, French, German, Spanish. More on the roadmap as the community contributes
                            translations.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How does language detection work?</Trans>}
                    answer={<Trans>Auto-detected from device locale on first launch. Override anytime in Settings → Language.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>Does it require a relaunch?</Trans>}
                    answer={<Trans>No. Switching language re-renders the UI in-place, no reinstall or relaunch.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>What about number / date formats?</Trans>}
                    answer={
                        <Trans>
                            Numbers and dates format according to whichever language is active in Settings — there is no separate locale
                            setting to configure.
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
