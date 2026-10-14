/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { EyeOff, KeyRound, ScanFace } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
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
                        One glance past Budgie&apos;s lock screen. The four digits you chose stay the key your database is encrypted with.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="screenshot-protection-1" slug="screenshot-protection" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Face ID or Touch ID opens the lock, the PIN owns the key</Trans>}>
                    <Trans>
                        Biometric unlock is a shortcut past Budgie&apos;s lock screen. What encrypts the database underneath is still the
                        four-digit PIN.
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
                        <Trans>App Lock: PIN and Face ID or Touch ID</Trans>
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

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={ScanFace} title={<Trans>Unlock with Face ID or Touch ID</Trans>}>
                    <Trans>Face ID or Touch ID unlock on the lock screen, offered when the device has one enrolled</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={EyeOff} title={<Trans>Biometric data stays private</Trans>}>
                    <Trans>The operating system does the matching — Budgie never sees biometric data, only the result</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={KeyRound} title={<Trans>PIN is always your fallback</Trans>}>
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
                            No. The operating system manages biometric matching and hands Budgie nothing but the result. There is no key
                            fragment and no biometric material on Budgie&apos;s side — the encryption key is your PIN.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>What if biometrics fail?</Trans>}
                    answer={
                        <Trans>
                            Nothing dramatic: the PIN keypad is already on screen, so you simply type your PIN. Budgie turns the
                            device-passcode fallback off, and there is no attempt counter that locks you out of your own database.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Can I disable biometrics?</Trans>}
                    answer={
                        <Trans>
                            Yes — Settings → Security → App Lock, then the Face ID / Touch ID row inside the card. The PIN stays active.
                            Turning App Lock off switches biometrics off with it.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Is Face ID safer than a PIN?</Trans>}
                    answer={
                        <Trans>
                            They&apos;re complementary. Biometrics are convenient and prevent shoulder-surfing; the PIN is the actual
                            encryption key. Both raise the bar.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
