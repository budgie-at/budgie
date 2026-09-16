/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBreadcrumbsJsonLd } from '../../../../feature/component/feature-page-breadcrumbs-json-ld/feature-page-breadcrumbs-json-ld';
import { FeaturePageCategoryComparison } from '../../../../feature/component/feature-page-category-comparison/feature-page-category-comparison';
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

export default async function OnDeviceAiBudgetAppPage(props: PageLangParam) {
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
                heading={<Trans>On-Device AI Budget App — AI That Never Leaves Your Phone</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Cloud AI assistants for budgeting send every transaction to a remote server for &ldquo;intelligence&rdquo;.
                        Budgie&apos;s AI runs on your phone — your data never leaves.
                    </Trans>
                }
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>It all happens on your phone</Trans>}>
                    <Trans>
                        One switch in Settings, and categories, tags, translation and voice entry all run where your data already is.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>One switch, one download</Trans>}>
                    <Trans>
                        New installs start with the On-device AI card off; if you were already using AI, it stays on. Either way the switch
                        controls it, and about 2.5 GB downloads once.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie settings screen with the AI section, the On-device AI toggle switched on and two AI status cards below it`}
                    index={0}
                    locale={lang}
                    priority
                    scene="on-device-ai-budget-app-1"
                    slug="on-device-ai-budget-app"
                >
                    <FeatureStory.Callout y={0.622}>
                        <Trans>One switch for every AI feature</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.748}>
                        <Trans>Translation and learning progress</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Nothing goes out to be processed</Trans>}>
                    <Trans>Budgie writes the English name and the search keywords for a foreign category right on the phone.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie edit category screen showing an AI-generated metadata block with an English translation and search keywords`}
                    index={1}
                    locale={lang}
                    scene="ai-merchant-translation-1"
                    slug="ai-merchant-translation"
                >
                    <FeatureStory.Callout y={0.4}>
                        <Trans>Written on your phone</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.505}>
                        <Trans>Keywords you can search by</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Nothing to send, nothing sent</Trans>}>
                    <Trans>Past that one download, no AI feature opens a connection. There is no provider in the loop to trust.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie settings screen with the offline-and-private notice above the automatic MCC category assignment toggle`}
                    index={2}
                    locale={lang}
                    scene="ai-auto-categorization-2"
                    slug="ai-auto-categorization"
                >
                    <FeatureStory.Callout y={0.23}>
                        <Trans>No cloud sync, no tracking</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why this matters</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Cloud AI assistants for budgeting send every transaction to a remote server for &ldquo;intelligence&rdquo;.
                        Budgie&apos;s AI runs on your phone — your data never leaves.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Budgie vs. the category</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>
                            Category suggestions, tag suggestions, merchant clean-up, and voice entry all run on your phone, on both iOS and
                            Android — nothing leaves the device.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>
                            Roughly 1.6 GB for categorization and suggestions, or 2.5 GB with voice entry. The download is one-time, opt-in,
                            and only starts if you turn on AI features.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>
                            A cloud assistant ships your transaction titles to a remote service and trusts the provider&apos;s privacy
                            policy. Budgie does the work on your device — there&apos;s no provider to trust.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>
                            Nothing runs until you trigger it. Budgie gets ready when the feature that needs it starts, stays ready for
                            about half a minute after you finish, and lets go when the app goes to the background — so the first request
                            after a pause waits a moment and the ones after it do not.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Feature comparison</Trans>
                </FeaturePageHeading>
                <FeaturePageCategoryComparison categoryLabel={<Trans>Cloud AI budget assistants</Trans>}>
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>On your phone</Trans>}
                        competitorValue={<Trans>Vendor&apos;s cloud / remote AI service</Trans>}
                        label={<Trans>Where AI runs</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Nothing</Trans>}
                        competitorValue={<Trans>Every transaction title, often more</Trans>}
                        label={<Trans>What gets sent</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Yes</Trans>}
                        competitorValue={<Trans>No</Trans>}
                        label={<Trans>Works offline</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>No</Trans>}
                        competitorValue={<Trans>Often yes</Trans>}
                        label={<Trans>AI subscription required</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Total — no provider exists</Trans>}
                        competitorValue={<Trans>Bound by their privacy policy</Trans>}
                        label={<Trans>Privacy from AI provider</Trans>}
                    />
                    <FeaturePageCategoryComparison.Row
                        budgieValue={<Trans>Improves with your corrections</Trans>}
                        competitorValue={<Trans>Static, plus your data trains their model</Trans>}
                        label={<Trans>Suggestion quality</Trans>}
                    />
                </FeaturePageCategoryComparison>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Which AI features run on my phone?</Trans>}
                    answer={
                        <Trans>
                            Category suggestions, tag suggestions, merchant clean-up, and voice entry all run on your phone, on both iOS and
                            Android — nothing leaves the device.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How big is the download?</Trans>}
                    answer={
                        <Trans>
                            Roughly 1.6 GB for categorization and suggestions, or 2.5 GB with voice entry. The download is one-time, opt-in,
                            and only starts if you turn on AI features.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How is this different from a cloud AI assistant?</Trans>}
                    answer={
                        <Trans>
                            A cloud assistant ships your transaction titles to a remote service and trusts the provider&apos;s privacy
                            policy. Budgie does the work on your device — there&apos;s no provider to trust.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does on-device AI drain battery?</Trans>}
                    answer={
                        <Trans>
                            Nothing runs until you trigger it. Budgie gets ready when the feature that needs it starts, stays ready for
                            about half a minute after you finish, and lets go when the app goes to the background — so the first request
                            after a pause waits a moment and the ones after it do not.
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
