/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { EyeOff, ShieldCheck, ToggleOn } from 'reicon-react';

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

export default async function ScreenshotProtectionFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie Settings screen showing the Security section with the PIN-lock card above an enabled Screenshot Protection switch`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Keep balances out of screenshots</Trans>}
                tagline={
                    <Trans>
                        One switch in Settings → Security asks your phone to block screenshots and screen recordings, and hides amounts
                        whenever Budgie is not the active app.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="screenshot-protection-1" slug="screenshot-protection" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>What the switch does</Trans>}>
                    <Trans>
                        Screenshot Protection lives in Settings → Security, right under the PIN-lock card. Turned on, it does two things:
                        your phone is asked to block screen capture, and amounts are replaced with a placeholder while Budgie is not the
                        active app.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Point index={0}>
                    <Trans>One switch, off by default, sitting directly under the PIN-lock card in the Security section.</Trans>
                </FeatureStory.Point>

                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="screenshot-protection-1" slug="screenshot-protection">
                    <FeatureStory.Callout index={0} y={0.382}>
                        <Trans>PIN lock, right above</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.522}>
                        <Trans>Screenshot Protection switch</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Point index={1}>
                    <Trans>
                        Turn it on and Budgie asks the system to block screenshots and screen recordings of the app. Whether a capture is
                        blocked or comes out blank is up to your phone.
                    </Trans>
                </FeatureStory.Point>
                <FeatureStory.Point index={2}>
                    <Trans>
                        The moment Budgie stops being the active app, amounts swap to a placeholder — most visible in the app switcher. It
                        applies everywhere amounts appear, with no per-screen setup.
                    </Trans>
                </FeatureStory.Point>
            </FeatureStory>

            <FeatureSpecTiles heading={<Trans>Hidden before anyone looks</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>masking when the app leaves the screen</Trans>} value={<Trans>Instant</Trans>}>
                    <Trans>Amounts swap to a placeholder as soon as Budgie is not the active app.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>switch to turn it on</Trans>} value="1">
                    <Trans>It sits under App Lock in Settings, off until you enable it.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>protected amount, not just the home screen</Trans>} value={<Trans>Every</Trans>}>
                    <Trans>Amounts are masked wherever they appear, with no per-screen setup.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(i18n)`Budgie Settings Security section with the App Lock card above the Screenshot Protection switch`}
                        locale={lang}
                        scene="screenshot-protection-1"
                        slug="screenshot-protection"
                        y={0.3}
                    />
                }
                heading={<Trans>Try it, then switch apps</Trans>}
                lede={<Trans>Turn it on, open the app switcher, and look for your balances. They are gone.</Trans>}
            >
                <FeatureProof.Fact icon={ToggleOn}>
                    <Trans>One switch in Settings, under Security</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={EyeOff}>
                    <Trans>Amounts show a placeholder</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Source />
            </FeatureProof>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={EyeOff} title={<Trans>Amounts hidden instantly</Trans>}>
                    <Trans>Replaces amounts with a placeholder the instant the app stops being active</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ShieldCheck} title={<Trans>Screen capture blocked</Trans>}>
                    <Trans>Asks your phone to block screenshots and screen recordings while it is on</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ToggleOn} title={<Trans>One simple switch</Trans>}>
                    <Trans>One switch in Settings → Security, right under the PIN-lock card</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Off by default — nothing is hidden until you turn it on</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Home-screen widgets also hide amounts while the PIN lock is on</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why a glance at the app switcher is a real privacy leak</Trans>}>
                    <p>
                        <Trans>
                            Swipe up to switch apps and whatever was on screen a moment ago is still there in the preview — including
                            balances and amounts. Screenshot Protection replaces those numbers with a placeholder for as long as Budgie
                            isn&apos;t the active app, and asks your phone to block captures while it&apos;s on.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Off by default. Turn it on in Settings → Security and it applies immediately to the whole app. It is one global
                            switch, not a per-screen setting.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>What does Screenshot Protection actually hide?</Trans>}
                    answer={
                        <Trans>
                            Amounts, such as account balances and net worth, switch to a placeholder for as long as Budgie isn&apos;t the
                            active app — most visible when you open the app switcher.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Does it block screenshots and screen recordings?</Trans>}
                    answer={
                        <Trans>
                            Yes, while the switch is on Budgie asks your phone to block screen capture. Exactly how a blocked capture looks,
                            blank or refused, depends on your phone.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Where do I turn it on?</Trans>}
                    answer={
                        <Trans>
                            Settings → Security, directly below the PIN-lock card. It&apos;s a single switch for the whole app, off by
                            default, with no per-screen configuration.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Does it work alongside the PIN lock?</Trans>}
                    answer={
                        <Trans>
                            Yes — the two settings are independent. PIN lock controls who can open the app; Screenshot Protection controls
                            what others can capture or glimpse from it.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
