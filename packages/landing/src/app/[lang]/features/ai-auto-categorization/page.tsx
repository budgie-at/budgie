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

export default async function AiAutoCategorizationFeaturePage(props: PageLangParam) {
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
                        Two on-device models — Qwen3 1.7B for chat and a 768-dim Nomic embedding model — categorize transactions, suggest
                        tags, and learn from your corrections. Your statements never leave the phone.
                    </Trans>
                }
            />

            <FeaturePageMedia>
                <AppShot
                    alt={t(
                        i18n
                    )`Budgie settings screen with the offline-and-private notice above the automatic MCC category assignment toggle`}
                    locale={lang}
                    scene="ai-auto-categorization-2"
                    slug="ai-auto-categorization"
                />
            </FeaturePageMedia>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why on-device AI is the only AI that protects your statements</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Cloud &ldquo;AI&rdquo; budgeting apps stream every merchant string to a remote LLM, which often means OpenAI sees
                        your supermarket habits. Budgie keeps every inference on your own device — same accuracy, zero data exfiltration.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        The two-stage pipeline looks through your own history first and falls back to the language model only for
                        transactions it has not seen before. Every accepted or edited suggestion updates the index immediately — accuracy
                        compounds over time.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Two-stage categorization flow</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0} key="stage-0">
                        <Trans>
                            History lookup — Budgie finds the closest match among transactions you have already categorized, which is the
                            fast path once the models are loaded
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1} key="stage-1">
                        <Trans>
                            LLM fallback — Qwen3 1.7B Q4 handles novel transactions the embedding index has not seen, proposing category and
                            tags from context
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2} key="stage-2">
                        <Trans>
                            Correction loop — every accepted or edited suggestion updates the embedding index immediately so the next
                            similar transaction lands closer without re-training
                        </Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>Qwen3 1.7B Q4 model runs entirely on your phone after a one-time download</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>768-dim Nomic embedding model + sqlite-vec for SIMD-accelerated similarity search</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Two complementary signals: vector lookup over your history plus a generative LLM suggestion</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Every correction updates the index on the spot — accuracy improves as you use it</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Statements never leave the device — no OpenAI, no remote inference, ever</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Each model is fetched the first time you use the feature that needs it, and only after you have switched On-device
                        AI on in Settings. It is then held in memory just while that feature is working and released about half a minute
                        after you stop — so the first suggestion after a pause waits for a load, and the ones that follow do not. For each
                        new transaction Budgie looks through your own history first; if nothing close enough is there, the language model
                        writes a suggestion instead. Your response (accept, edit, or reject) feeds back into the index without any network
                        call.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Does the AI work offline?</Trans>}
                    answer={
                        <Trans>
                            Yes. Both models live on your device after the one-time download. Categorization runs whether you&apos;re online
                            or not.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>How big is the model download?</Trans>}
                    answer={
                        <Trans>
                            Three separate files, each fetched on first use of the feature that needs it: roughly 1.1 GB for the Qwen3 1.7B
                            Q4 language model, 0.5 GB for the 768-dim Nomic embedding model, and a further 0.9 GB for Whisper large-v3-turbo
                            if you turn on voice entry. Every one of them is optional — you can keep using Budgie without AI.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I correct the AI&apos;s suggestions?</Trans>}
                    answer={
                        <Trans>
                            Always. Every transaction lets you accept, edit, or reject the suggestion. Your corrections feed back into the
                            768-dim embedding index immediately so the next similar transaction lands closer to the right category.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I turn AI off?</Trans>}
                    answer={
                        <Trans>
                            Yes. Settings has an AI section with a single On-device AI switch. Turn it off and nothing downloads, nothing
                            loads into memory, and no suggestion runs — categorization falls back to your rules and the bank&apos;s own
                            merchant codes. New installs start with the switch off; if you were already using AI before the switch existed,
                            it stays on.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does Budgie use OpenAI or any cloud LLM?</Trans>}
                    answer={
                        <Trans>
                            No. Every inference runs on your own device. There is no fallback to a cloud model and no telemetry about your
                            transactions.
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
