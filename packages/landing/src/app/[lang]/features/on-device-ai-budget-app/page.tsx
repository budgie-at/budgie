/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageCategoryComparison } from '../../../../feature/component/feature-page-category-comparison/feature-page-category-comparison';
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

const SLUG = 'on-device-ai-budget-app';

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

export default async function OnDeviceAiBudgetAppPage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);
    const entry = getFeatureBySlug(SLUG);
    if (!isDefined(entry)) {
        return null;
    }

    const related = getRelatedFeatures(SLUG);
    const [breadcrumbSchema, webPageSchema] = buildFeaturePageJsonLd({
        locale: lang,
        slug: SLUG,
        title: i18n._(entry.metaTitle),
        description: i18n._(entry.metaDescription),
        featureName: i18n._(entry.title),
        featuresLabel: t(i18n)`Features`,
        homeLabel: t(i18n)`Home`,
        publishedAt: entry.publishedAt,
        updatedAt: entry.updatedAt
    });
    const comparisonCategoryLabel = <Trans>Cloud AI budget assistants</Trans>;
    const comparisonRows = [
        {
            label: <Trans>Where AI runs</Trans>,
            budgieValue: <Trans>On your phone</Trans>,
            competitorValue: <Trans>Vendor&apos;s cloud / remote AI service</Trans>
        },
        {
            label: <Trans>What gets sent</Trans>,
            budgieValue: <Trans>Nothing</Trans>,
            competitorValue: <Trans>Every transaction title, often more</Trans>
        },
        {
            label: <Trans>Works offline</Trans>,
            budgieValue: <Trans>Yes</Trans>,
            competitorValue: <Trans>No</Trans>
        },
        {
            label: <Trans>AI subscription required</Trans>,
            budgieValue: <Trans>No</Trans>,
            competitorValue: <Trans>Often yes</Trans>
        },
        {
            label: <Trans>Privacy from AI provider</Trans>,
            budgieValue: <Trans>Total — no provider exists</Trans>,
            competitorValue: <Trans>Bound by their privacy policy</Trans>
        },
        {
            label: <Trans>Suggestion quality</Trans>,
            budgieValue: <Trans>Improves with your corrections</Trans>,
            competitorValue: <Trans>Static, plus your data trains their model</Trans>
        }
    ];

    return (
        <main className="flex-1">
            <JsonLd data={breadcrumbSchema} />
            <JsonLd data={webPageSchema} />
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={i18n._(entry.title)} locale={lang} />}
                heading={<Trans>On-Device AI Budget App — Local LLM, No Cloud Inference</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        Cloud AI assistants for budgeting send every transaction to a remote server for &ldquo;intelligence&rdquo;. Budgie
                        runs the LLM and embeddings on your phone — your data never leaves.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why this matters</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Cloud AI assistants for budgeting send every transaction to a remote server for &ldquo;intelligence&rdquo;. Budgie
                        runs the LLM and embeddings on your phone — your data never leaves.
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
                            Qwen3 1.7B for chat-style suggestions and a 768-dim embedding model for nearest-neighbor lookups. Both run via
                            ONNX Runtime on iOS and Android.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>
                            Roughly 1 GB combined. The download is one-time, opt-in, and only triggers if you turn on AI features.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>
                            A cloud assistant ships your transaction titles to a remote model and trusts the provider&apos;s privacy policy.
                            Budgie&apos;s models live on your device — there&apos;s no provider to trust.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>
                            Inference runs in milliseconds for embeddings and a few seconds for the LLM, only when you trigger it.
                            Background impact is negligible.
                        </Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Feature comparison</Trans>
                </FeaturePageHeading>
                <FeaturePageCategoryComparison categoryLabel={comparisonCategoryLabel} rows={comparisonRows} />
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Which models does Budgie run on-device?</Trans>}
                    answer={
                        <Trans>
                            Qwen3 1.7B for chat-style suggestions and a 768-dim embedding model for nearest-neighbor lookups. Both run via
                            ONNX Runtime on iOS and Android.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How big is the download?</Trans>}
                    answer={
                        <Trans>
                            Roughly 1 GB combined. The download is one-time, opt-in, and only triggers if you turn on AI features.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How is this different from a cloud AI assistant?</Trans>}
                    answer={
                        <Trans>
                            A cloud assistant ships your transaction titles to a remote model and trusts the provider&apos;s privacy policy.
                            Budgie&apos;s models live on your device — there&apos;s no provider to trust.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does on-device AI drain battery?</Trans>}
                    answer={
                        <Trans>
                            Inference runs in milliseconds for embeddings and a few seconds for the LLM, only when you trigger it.
                            Background impact is negligible.
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
