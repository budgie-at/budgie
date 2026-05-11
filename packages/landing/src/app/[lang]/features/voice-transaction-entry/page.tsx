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

const SLUG = 'voice-transaction-entry';

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

export default async function VoiceTransactionEntryFeaturePage(props: PageLangParam) {
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
                        The result is a pre-filled transaction form: amount, category, account, and merchant — with the same AI category
                        suggestion pill you get for typed entries. Confirm, edit if needed, save.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>whisper.rn (whisper.cpp backend) runs Whisper-small locally for accurate, multilingual transcription</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>On-device LLM extracts amount, merchant, date, and category from natural speech</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Audio never leaves the device — no Siri-style cloud round-trip</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Pre-fills the same quick-entry form you would use by typing — confirm or correct</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
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
                        extracts amount, merchant, and date hints from the transcription and applies the same on-device category suggestion
                        pipeline used for typed transactions.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Three steps from speech to saved</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0} key="step-0">
                        <Trans>Tap the mic in the quick-entry sheet</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1} key="step-1">
                        <Trans>Speak naturally — &ldquo;twelve dollars coffee at the airport&rdquo;</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2} key="step-2">
                        <Trans>Confirm or correct the pre-filled form, then save</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection>
                <FeaturePageFaqItem
                    question={<Trans>Which languages does voice entry support?</Trans>}
                    answer={
                        <Trans>
                            whisper.rn ships the Whisper-small model, which covers English, Ukrainian, German, French, and Spanish as
                            primary languages, plus dozens more. Transcription quality scales with language coverage in the model.
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
                            The transcription appears in the form before you save. Edit any field manually, or tap the mic again to retry.
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

            <FeaturePageRelated features={related} locale={lang} />
            <FeaturePageRelatedArticles locale={lang} slugs={entry.relatedArticleSlugs} />

            <FeaturePageCta locale={lang} />
        </main>
    );
}
