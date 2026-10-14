/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { KeyRound, Lock, ScanFace } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureProof } from '../../../../feature/component/feature-proof/feature-proof';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function PinAppLockFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(i18n)`Budgie lock screen on launch, showing Enter your PIN above four empty dots and a number keypad`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Lock the app and your data</Trans>}
                tagline={
                    <Trans>
                        A 4-digit PIN unlocks the app and unlocks your data. Without the PIN, the database file is unreadable, even with
                        full filesystem access.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="pin-app-lock-2" slug="pin-app-lock" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>Nothing opens before the PIN</Trans>}>
                    <Trans>
                        Three frames: the keypad the app opens on, the four digits that open the encrypted database, and the Settings group
                        where you switch the lock on.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>The app opens on the lock screen</Trans>}>
                    <Trans>
                        With App Lock on, every route in the app redirects to this keypad until the PIN checks out — on every cold launch,
                        and again the moment the app goes to the background. There is nothing behind it to read: no balances, no transaction
                        list, no skip.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="pin-app-lock-2" slug="pin-app-lock">
                    <FeatureStory.Callout x={0.72} y={0.409}>
                        <Trans>Four slots, nothing typed</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout x={0.8} y={0.566}>
                        <Trans>No skip, no PIN reset</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>The four digits are the key</Trans>}>
                    <Trans>
                        The PIN is what the app opens the database with. Budgie keeps it in the device keychain, marked this-device-only,
                        and hands it to the database as the encryption key; changing the PIN re-encrypts the whole file under the new one.
                        The fourth digit submits on its own — a wrong PIN clears the dots and says so, and there is no reset that hands the
                        data back.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie lock screen with two of the four PIN dots filled in while the PIN is typed`}
                    index={1}
                    locale={lang}
                    scene="pin-app-lock-1"
                    slug="pin-app-lock"
                >
                    <FeatureStory.Callout x={0.72} y={0.409}>
                        <Trans>Two of four digits in</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout x={0.8} y={0.566}>
                        <Trans>The fourth digit submits</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>You switch it on in Settings</Trans>}>
                    <Trans>
                        App Lock sits in the Security group. Tap Enable, pick the four digits, and if your device has Face ID or Touch ID
                        enrolled Budgie offers to unlock with it — the keypad stays as the fallback. Screenshot Protection is its own switch
                        directly underneath.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Settings screen with the Security group showing the App Lock card and the Screenshot Protection switch turned on`}
                    index={2}
                    locale={lang}
                    scene="screenshot-protection-1"
                    slug="screenshot-protection"
                >
                    <FeatureStory.Callout y={0.42}>
                        <Trans>App Lock: PIN and Face ID or Touch ID</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.527}>
                        <Trans>Balances hidden from screenshots</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureSpecTiles heading={<Trans>What stands between you and your data</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>digits open the app and your data</Trans>} value="4">
                    <Trans>The same four digits are the key your data is locked with.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>wrong PINs before any wait</Trans>} value="4">
                    <Trans>The fifth wrong PIN starts a 30-second wait, and each one after that waits longer.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>re-lock when you leave the app</Trans>} value={<Trans>Instant</Trans>}>
                    <Trans>Switch away and the keypad is back when you return.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

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
                heading={<Trans>See the lock for yourself</Trans>}
                lede={<Trans>Leave Budgie and come back. The keypad is the first thing you see.</Trans>}
            >
                <FeatureProof.Fact icon={Lock}>
                    <Trans>Leaving the app brings the keypad back</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={KeyRound}>
                    <Trans>A wrong PIN clears the dots and says so</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Source />
            </FeatureProof>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={KeyRound} title={<Trans>A lock that encrypts</Trans>}>
                    <Trans>PIN is the database encryption key — not just a screen guard</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ScanFace} title={<Trans>Unlock with your face</Trans>}>
                    <Trans>Optional Face ID or Touch ID unlock, with the PIN as fallback</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Lock} title={<Trans>Locks when you leave</Trans>}>
                    <Trans>Re-locks the moment the app goes to background</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>A 4-digit PIN, set from Settings → Security</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>No &ldquo;forgot PIN&rdquo; recovery — that&apos;s the privacy guarantee</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why most app locks are decoration</Trans>}>
                    <p>
                        <Trans>
                            Most app locks are decoration — a screen you can bypass by reading the storage layer. Budgie&apos;s PIN is wired
                            to the database encryption itself, so the same digits that pass the lock screen are the encryption key.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            App goes to background → lock kicks in. A wrong PIN doesn&apos;t lock you out forever, but there is no reset
                            that hands the data back (your call: keep the PIN safe).
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>What if I forget my PIN?</Trans>}
                    answer={
                        <Trans>
                            The PIN is the encryption key — there&apos;s no recovery mechanism, by design. Keep your PIN somewhere safe (a
                            password manager works) or use the database backup feature to restore from a known-good state.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>How quickly does the app re-lock?</Trans>}
                    answer={
                        <Trans>
                            The moment the app goes to the background. There is no grace period and no inactivity setting to get wrong — the
                            next time you come back, the keypad is there.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Is biometric the same as PIN security?</Trans>}
                    answer={
                        <Trans>
                            Biometric unlock is the platform&apos;s Face ID / Touch ID check standing in for typing the PIN. The PIN itself
                            stays in the device keychain, marked this-device-only, and remains the database key — biometrics are a faster
                            path to the same lock, not a second one.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Does the lock work if my phone is jailbroken?</Trans>}
                    answer={
                        <Trans>
                            Encryption with a strong PIN protects against filesystem-level access, but a jailbroken device with active
                            malware can capture the PIN at entry time. Don&apos;t unlock Budgie on a compromised device.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
