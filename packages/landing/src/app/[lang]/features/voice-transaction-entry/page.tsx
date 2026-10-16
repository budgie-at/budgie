/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Download, ListCheck, Mic, Mobile, ToggleOn } from 'reicon-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureProof } from '../../../../feature/component/feature-proof/feature-proof';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
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
                        Voice entry runs on the On-device AI switch in Settings, which is off until you turn it on. Turning it on starts a
                        one-time download of about 2.5 GB, best on Wi-Fi. After that, your audio becomes text on the phone and is never sent
                        to a server.
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

            <FeatureSpecTiles heading={<Trans>Talk once, get every expense</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>expenses from one sentence</Trans>} value={<Trans>3 in 1</Trans>}>
                    <Trans>Coffee, taxi and parking come back as three separate rows, each with its own amount and category.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>audio uploaded</Trans>} value="0">
                    <Trans>Your voice is turned into text on the phone.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>languages tuned for amounts</Trans>} value="2">
                    <Trans>Amounts and currencies are picked out best in English and Ukrainian, including mixed sentences.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(i18n)`Budgie Settings showing the On-device AI switch that transcribes voice notes on this device`}
                        locale={lang}
                        scene="on-device-ai-budget-app-1"
                        slug="on-device-ai-budget-app"
                        y={0.52}
                    />
                }
                heading={<Trans>Try it in airplane mode</Trans>}
                lede={
                    <Trans>
                        Once the voice models are on your phone, entry keeps working with no connection at all. That&apos;s how you know
                        nothing is sent.
                    </Trans>
                }
            >
                <FeatureProof.Fact icon={ToggleOn}>
                    <Trans>One switch in Settings turns on-device AI on or off</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={Download}>
                    <Trans>Models download once, best on Wi-Fi</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Action href={`/${lang}/offline-first`}>
                    <Trans>See how offline works</Trans>
                </FeatureProof.Action>
            </FeatureProof>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Mic} title={<Trans>Several expenses, one sentence</Trans>}>
                    <Trans>Natural speech is split into multiple transactions, each with its own amount and category</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Mobile} title={<Trans>Audio stays on your phone</Trans>}>
                    <Trans>Audio never leaves the device</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ListCheck} title={<Trans>Review before saving</Trans>}>
                    <Trans>
                        A review sheet lists every row before saving — the Save button reads &ldquo;Select all categories&rdquo; or
                        &ldquo;Enter all amounts&rdquo; until nothing is missing
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Transcription that happens on your phone, in your phone&apos;s language</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Nothing is saved until you tap Save, and Save stays off until every row has an amount and a category</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Say hryvnia, dollars or euros and the row lands on your account in that currency</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>The record button shows a progress ring while the one-time download finishes</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Voice entry without sending your audio anywhere</Trans>}>
                    <p>
                        <Trans>
                            Voice is the fastest input mode for an expense. Budgie keeps the audio entirely on the device: it becomes text
                            there, and the amounts and categories are pulled out there too.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            One sentence can log several transactions at once — &ldquo;twelve for coffee, forty for the taxi, and eight
                            euros for parking&rdquo; comes back as three separate rows, not one merged entry. A review sheet shows every
                            extracted row with its amount, category, and account before anything is saved.
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
                            Voice entry downloads what it needs once (about 2.5 GB) and keeps it on the device — only after you switch
                            On-device AI on in Settings. Transcription follows your phone&apos;s language when it is supported and detects
                            the language otherwise. Picking out amounts and currencies is tuned for English and Ukrainian, including mixed
                            sentences.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Is my voice recorded anywhere?</Trans>}
                    answer={
                        <Trans>
                            No. The microphone feeds transcription directly on the device, and your audio is never sent to a server.
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
