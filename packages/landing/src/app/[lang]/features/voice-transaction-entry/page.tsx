/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { ListChecks, Mic, Smartphone } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { FeatureHeroFocusEnum } from '../../../../feature/enum/feature-hero-focus.enum';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function VoiceTransactionEntryFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie home screen dimmed behind the quick-entry sheet, with a ringed microphone button in the centre of the bottom bar and a close button on the right`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Say it, Budgie logs it</Trans>}
                tagline={
                    <Trans>
                        Say &ldquo;twelve for coffee, forty for the taxi, and eight euros for parking&rdquo; and Budgie logs all three.
                        Transcription and parsing both happen on your phone. The audio never leaves it.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot
                    alt={firstShotAlt}
                    focus={FeatureHeroFocusEnum.BOTTOM}
                    locale={lang}
                    scene="voice-transaction-entry-1"
                    slug="voice-transaction-entry"
                />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Speak it, review it, save it</Trans>}>
                    <Trans>
                        Two screens: the mic in the quick-entry sheet, and the Settings switch that keeps transcription on your phone.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>One tap on the mic</Trans>}>
                    <Trans>
                        The quick-entry sheet opens over your accounts with a mic button in the middle of the bottom bar. Tap it and talk —
                        one sentence can hold several expenses, and a review sheet shows every extracted row before anything is saved.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={firstShotAlt}
                    index={0}
                    locale={lang}
                    scene="voice-transaction-entry-1"
                    slug="voice-transaction-entry"
                >
                    <FeatureStory.Callout index={0} x={0.5} y={0.878}>
                        <Trans>Tap the mic and speak</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Transcribed on the phone, never uploaded</Trans>}>
                    <Trans>
                        Voice entry runs on the On-device AI switch in Settings. Its description says it transcribes voice notes on this
                        device and downloads the models once, best on Wi-Fi. Your audio becomes text on the phone and is never sent to a
                        server.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Settings screen with the On-device AI switch described as categorizing transactions, suggesting tags and transcribing voice notes on this device, above Translation and Learning progress rows`}
                    index={1}
                    locale={lang}
                    scene="on-device-ai-budget-app-1"
                    slug="on-device-ai-budget-app"
                >
                    <FeatureStory.Callout index={0} y={0.62}>
                        <Trans>On-device AI switch</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.68}>
                        <Trans>Models download once</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Mic} title={<Trans>Several expenses, one sentence</Trans>}>
                    <Trans>Natural speech is split into multiple transactions, each with its own amount and category</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Smartphone} title={<Trans>Audio stays on your phone</Trans>}>
                    <Trans>Audio never leaves the device — no Siri-style cloud round-trip</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ListChecks} title={<Trans>Review before saving</Trans>}>
                    <Trans>
                        A review sheet lists every row before saving — &ldquo;Select all categories&rdquo; and &ldquo;Enter all
                        amounts&rdquo; fix a whole batch at once
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Accurate, multilingual transcription that happens on your phone</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>
                            Nothing is written until you tap Save — the whole batch commits in one database transaction, so you never end up
                            with half a sentence logged
                        </Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>The spoken currency picks the matching account automatically</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>The record button shows a progress ring while the one-time download finishes</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why every voice budgeting app today is a privacy hole</Trans>}>
                    <p>
                        <Trans>
                            Voice is the fastest input mode for an expense — but every voice budgeting app today streams microphone data to
                            a vendor server. Budgie keeps the audio entirely on the device: it becomes text there, and the amounts and
                            categories are pulled out there too.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            One sentence can log several transactions at once — &ldquo;twelve for coffee, forty for the taxi, and eight
                            euros for parking&rdquo; comes back as three separate rows, not one merged entry. A review sheet shows every
                            extracted row with its amount, category, and account before anything is written to the database.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Which languages does voice entry support?</Trans>}
                    answer={
                        <Trans>
                            Voice entry downloads what it needs once and keeps it on the device — only after you switch On-device AI on in
                            Settings, and only the first time you record. It covers English, Ukrainian, German, French, and Spanish as
                            primary languages, plus dozens more, and follows your phone&apos;s language automatically.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Is my voice recorded anywhere?</Trans>}
                    answer={
                        <Trans>
                            No. The microphone feeds transcription directly on the device, and the audio is discarded once it has become
                            text. Nothing is saved, sent, or logged.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>What if it mishears me?</Trans>}
                    answer={
                        <Trans>
                            Every extracted row appears in the review sheet before you save. Edit any row manually, or tap re-record to
                            replace the whole batch and try again.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Does it work offline?</Trans>}
                    answer={<Trans>Yes — after the one-time download, voice entry works without any internet connection.</Trans>}
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
