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

export default async function VoiceTransactionEntryFeaturePage(props: PageLangParam) {
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
                        Say &ldquo;twelve dollars coffee this morning&rdquo; and Budgie logs it. whisper.rn (whisper.cpp backend) and the
                        on-device LLM both run locally — no audio leaves your phone.
                    </Trans>
                }
            />

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why every voice budgeting app today is a privacy hole</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Voice is the fastest input mode for an expense — but every voice budgeting app today streams microphone data to a
                        vendor server. Budgie keeps the audio stream entirely on the device, then runs whisper.rn (a whisper.cpp-backed
                        React Native library) for transcription and a local LLM for entity extraction.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        One sentence can log several transactions at once — &ldquo;twelve for coffee, forty for the taxi, and eight euros
                        for parking&rdquo; comes back as three separate rows, not one merged entry. A review sheet shows every extracted row
                        with its amount, category, and account before anything is written to the database.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>
                            whisper.rn (whisper.cpp backend) runs Whisper large-v3-turbo locally for accurate, multilingual transcription
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>On-device LLM splits natural speech into multiple transactions, each with its own amount and category</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Audio never leaves the device — no Siri-style cloud round-trip</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>
                            A review sheet lists every row before saving — &ldquo;Select all categories&rdquo; and &ldquo;Enter all
                            amounts&rdquo; fix a whole batch at once
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>
                            Nothing is written until you tap Save — the whole batch commits in one database transaction, so you never end up
                            with half a sentence logged
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={5}>
                        <Trans>The spoken currency picks the matching account automatically</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={6}>
                        <Trans>Works during the AI model loading phase too — visual progress indicator built-in</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>How it works</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Tap the mic in the quick-entry sheet. whisper.rn transcribes locally using the whisper.cpp engine. The local LLM
                        extracts one or more transactions from the transcription — each with its own amount, category, and account — and
                        opens a review sheet before anything is saved. Editing a row, or tapping re-record, replaces the whole batch if the
                        transcription went wrong.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>From speech to a saved batch</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0} key="step-0">
                        <Trans>Tap the mic in the quick-entry sheet</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1} key="step-1">
                        <Trans>Speak naturally — &ldquo;twelve for coffee, forty for the taxi, and eight euros for parking&rdquo;</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2} key="step-2">
                        <Trans>Review the table of three extracted rows, each with its own amount and category</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3} key="step-3">
                        <Trans>Fix a row, or use &ldquo;Select all categories&rdquo; to fix the whole batch at once</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4} key="step-4">
                        <Trans>Tap Save 3 — all three transactions commit together in one database transaction</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Which languages does voice entry support?</Trans>}
                    answer={
                        <Trans>
                            Budgie downloads the Whisper large-v3-turbo model once and caches it on the device. It covers English,
                            Ukrainian, German, French, and Spanish as primary languages, plus dozens more. Transcription quality scales with
                            language coverage in the model.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is my voice recorded anywhere?</Trans>}
                    answer={
                        <Trans>
                            No. The microphone stream feeds whisper.rn directly in-process; the audio buffer is discarded after
                            transcription. Nothing is saved, sent, or logged.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if Whisper mishears me?</Trans>}
                    answer={
                        <Trans>
                            Every extracted row appears in the review sheet before you save. Edit any row manually, or tap re-record to
                            replace the whole batch and try again.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does it work offline?</Trans>}
                    answer={
                        <Trans>Yes — once the Whisper model is cached on-device, voice entry works without any internet connection.</Trans>
                    }
                />
            </FeaturePageFaqSection>

            <FeaturePageRelated locale={lang} slugs={FEATURE_METADATA.relatedFeatureSlugs} />
            <FeaturePageRelatedArticles locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
