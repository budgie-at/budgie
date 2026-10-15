/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { EyeOff, FaceScanSquare, Key } from 'reicon-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureCropBand } from '../../../../feature/component/feature-crop-band/feature-crop-band';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureProof } from '../../../../feature/component/feature-proof/feature-proof';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function BiometricAuthenticationFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie Settings screen with the Security section showing an App Lock card that reads Secure your app with PIN and Face ID or Touch ID`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Unlock with a glance</Trans>}
                tagline={
                    <Trans>
                        One glance past Budgie&apos;s lock screen. The four digits you chose stay the fallback and the lock behind it.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="screenshot-protection-1" slug="screenshot-protection" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Biometrics open the lock, the PIN stays the fallback</Trans>}>
                    <Trans>
                        Biometric unlock is a shortcut past Budgie&apos;s lock screen. Face ID, Touch ID and Android fingerprint or face
                        unlock all work this way. Underneath, the four-digit PIN is still what protects your data.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Point index={0}>
                    <Trans>
                        The switch lives inside the App Lock card in Settings, under Security. It only appears once you have set a PIN and
                        the device has a biometric enrolled — there is no biometric-only mode.
                    </Trans>
                </FeatureStory.Point>

                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="screenshot-protection-1" slug="screenshot-protection">
                    <FeatureStory.Callout y={0.42}>
                        <Trans>App Lock: PIN and biometric unlock</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Point index={1}>
                    <Trans>
                        On a cold launch Budgie asks the system to authenticate you the moment the lock screen appears, and a successful
                        scan takes you straight in. The keypad also keeps a scan button, so you can ask for it again.
                    </Trans>
                </FeatureStory.Point>
                <FeatureStory.Point index={2}>
                    <Trans>
                        Cancel or fail and nothing is lost: the keypad was already there. Budgie switches the device-passcode fallback off
                        on purpose, so your PIN is the only other way in.
                    </Trans>
                </FeatureStory.Point>
            </FeatureStory>

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(i18n)`Budgie lock screen with the title Enter your PIN, four empty PIN dots and a number keypad`}
                        locale={lang}
                        scene="pin-app-lock-2"
                        slug="pin-app-lock"
                        y={0.25}
                    />
                }
                heading={<Trans>Cancel a scan, the keypad waits</Trans>}
                lede={<Trans>The keypad is the lock screen itself, so a cancelled or failed scan costs you nothing.</Trans>}
            >
                <FeatureProof.Fact icon={Key}>
                    <Trans>Your PIN is the only other way in</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={EyeOff}>
                    <Trans>The phone does the matching, Budgie sees only the result</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Source />
            </FeatureProof>

            <FeatureCropBand
                heading={<Trans>Start from the App Lock card</Trans>}
                lede={<Trans>Settings, under Security, is where App Lock and your PIN begin.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(i18n)`Budgie Settings Security section with the App Lock card reading Secure your app with PIN and Face ID`}
                        locale={lang}
                        scene="screenshot-protection-1"
                        slug="screenshot-protection"
                        y={0.33}
                    >
                        <FeatureCropBand.Pin x={0.55} y={0.392} />
                        <FeatureCropBand.Pin x={0.55} y={0.445} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>App Lock card, under Security</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>PIN and Face ID, set up together</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={FaceScanSquare} title={<Trans>Unlock with biometrics</Trans>}>
                    <Trans>
                        Face ID, Touch ID or Android fingerprint and face unlock on the lock screen, offered when the device has one
                        enrolled
                    </Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={EyeOff} title={<Trans>Biometric data stays private</Trans>}>
                    <Trans>The operating system does the matching — Budgie never sees biometric data, only the result</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Key} title={<Trans>PIN is always your fallback</Trans>}>
                    <Trans>Falls back to PIN if biometrics are disabled or unavailable</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>The device-passcode fallback is switched off on purpose — your PIN is the only alternative</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>The prompt fires by itself as the lock screen appears — no extra tap at app open</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why biometrics belong on a finance app you check ten times a day</Trans>}>
                    <p>
                        <Trans>
                            Biometrics are the right balance for an expense app you open ten times a day. Budgie calls the system
                            authentication API, so the matching happens in the operating system and Budgie only ever learns whether it
                            succeeded.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Turned off, unavailable, cancelled or refused — every one of those paths lands on the PIN keypad, because the
                            keypad is what the lock screen renders in the first place. Budgie asks the system not to offer the device
                            passcode as a fallback, so your Budgie PIN is the only alternative.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Does Budgie store my biometric data?</Trans>}
                    answer={
                        <Trans>
                            No. The operating system manages biometric matching and hands Budgie nothing but the result. Budgie keeps no
                            biometric material — your PIN is what protects your data.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>What if biometrics fail?</Trans>}
                    answer={
                        <Trans>
                            Nothing dramatic: the PIN keypad is already on screen, so you simply type your PIN. Budgie turns the
                            device-passcode fallback off. Wrong PINs add a growing wait from the fifth wrong try on, and a successful scan
                            clears that wait.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Can I disable biometrics?</Trans>}
                    answer={
                        <Trans>
                            Yes — Settings → Security → App Lock, then the biometric row inside the card. The PIN stays active. Turning App
                            Lock off switches biometrics off with it.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Is biometric unlock safer than a PIN?</Trans>}
                    answer={
                        <Trans>
                            They&apos;re complementary. Biometrics are convenient and prevent shoulder-surfing; the PIN is what actually
                            protects your data. Both raise the bar.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
