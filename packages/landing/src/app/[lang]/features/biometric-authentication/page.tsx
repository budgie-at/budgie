/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeaturePageBenefitGridItem } from '../../../../feature/component/feature-page-benefit-grid-item/feature-page-benefit-grid-item';
import { FeaturePageBenefitGrid } from '../../../../feature/component/feature-page-benefit-grid/feature-page-benefit-grid';
import { FeaturePageFaqItem } from '../../../../feature/component/feature-page-faq-item/feature-page-faq-item';
import { FeaturePageFaqSection } from '../../../../feature/component/feature-page-faq-section/feature-page-faq-section';
import { FeaturePageHeading } from '../../../../feature/component/feature-page-heading/feature-page-heading';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageProse } from '../../../../feature/component/feature-page-prose/feature-page-prose';
import { FeaturePageSection } from '../../../../feature/component/feature-page-section/feature-page-section';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function BiometricAuthenticationFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Face ID, Touch ID and Fingerprint Unlock</Trans>}
                locale={lang}
                tagline={
                    <Trans>
                        One glance past Budgie&apos;s lock screen. The four digits you chose stay the fallback and the lock behind it.
                    </Trans>
                }
            />

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

                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Settings screen with the Security section showing an App Lock card that reads Secure your app with PIN and Face ID or Touch ID`}
                    index={0}
                    locale={lang}
                    priority
                    scene="screenshot-protection-1"
                    slug="screenshot-protection"
                >
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

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why biometrics belong on a finance app you check ten times a day</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Biometrics are the right balance for an expense app you open ten times a day. Budgie calls the system authentication
                        API, so the matching happens in the operating system and Budgie only ever learns whether it succeeded.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Turned off, unavailable, cancelled or refused — every one of those paths lands on the PIN keypad, because the keypad
                        is what the lock screen renders in the first place. Budgie asks the system not to offer the device passcode as a
                        fallback, so your Budgie PIN is the only alternative.
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
                            Face ID, Touch ID or Android fingerprint and face unlock on the lock screen, offered when the device has one
                            enrolled
                        </Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>The operating system does the matching — Budgie never sees biometric data, only the result</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Falls back to PIN if biometrics are disabled or unavailable</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>The device-passcode fallback is switched off on purpose — your PIN is the only alternative</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>The prompt fires by itself as the lock screen appears — no extra tap at app open</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Does Budgie store my biometric data?</Trans>}
                    answer={
                        <Trans>
                            No. The operating system manages biometric matching and hands Budgie nothing but the result. Budgie keeps no
                            biometric material — your PIN is what protects your data.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What if biometrics fail?</Trans>}
                    answer={
                        <Trans>
                            Nothing dramatic: the PIN keypad is already on screen, so you simply type your PIN. Budgie turns the
                            device-passcode fallback off. Wrong PINs add a growing wait from the fifth wrong try on, and a successful scan
                            clears that wait.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Can I disable biometrics?</Trans>}
                    answer={
                        <Trans>
                            Yes — Settings → Security → App Lock, then the biometric row inside the card. The PIN stays active. Turning App
                            Lock off switches biometrics off with it.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Is biometric unlock safer than a PIN?</Trans>}
                    answer={
                        <Trans>
                            They&apos;re complementary. Biometrics are convenient and prevent shoulder-surfing; the PIN is what actually
                            protects your data. Both raise the bar.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
