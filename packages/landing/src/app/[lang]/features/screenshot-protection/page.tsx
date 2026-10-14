/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { EyeOff, ShieldCheck, ToggleRight } from 'lucide-react';

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
                        Account balances and net worth switch to a placeholder the instant Budgie leaves the foreground. One switch in
                        Settings → Security.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="screenshot-protection-1" slug="screenshot-protection" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>What the switch actually hides</Trans>}>
                    <Trans>
                        Screenshot Protection lives in Settings → Security, right under the PIN-lock card. It doesn&apos;t stop the device
                        from taking a screenshot — it changes what Budgie renders while the app isn&apos;t active.
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
                        Turn it on and account balances and net worth swap to a placeholder the moment Budgie stops being the active app —
                        most visible in the app switcher.
                    </Trans>
                </FeatureStory.Point>
                <FeatureStory.Point index={2}>
                    <Trans>
                        It doesn&apos;t intercept the screenshot itself — the masking is a rendering change, so it covers every protected
                        amount, not only the home screen.
                    </Trans>
                </FeatureStory.Point>
            </FeatureStory>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={EyeOff} title={<Trans>Balances hidden instantly</Trans>}>
                    <Trans>Masks account balances and net worth the instant the app stops being active</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ShieldCheck} title={<Trans>Every amount covered</Trans>}>
                    <Trans>Covers every protected amount Budgie renders, not just the home screen</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={ToggleRight} title={<Trans>One simple switch</Trans>}>
                    <Trans>One switch in Settings → Security, right under the PIN-lock card</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Off by default — nothing is hidden until you turn it on</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Pairs with the PIN lock for a fuller privacy seal</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why a glance at the app switcher is a real privacy leak</Trans>}>
                    <p>
                        <Trans>
                            Swipe up to switch apps and whatever was on screen a moment ago is still there in the preview — including
                            account balances and net worth. Screenshot Protection replaces those numbers with a placeholder for as long as
                            Budgie isn&apos;t the active app.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Off by default. Turn it on in Settings → Security and it applies immediately, with no per-screen setup.
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
                            Account balances and net worth switch to a placeholder wherever Budgie renders them, for as long as the app
                            isn&apos;t the active app — most visible when you open the app switcher.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Does it block screenshots or screen recordings?</Trans>}
                    answer={
                        <Trans>
                            No. The switch changes what Budgie renders while it isn&apos;t active; it doesn&apos;t intercept a screenshot or
                            recording taken of the device.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Where do I turn it on?</Trans>}
                    answer={
                        <Trans>
                            Settings → Security, directly below the PIN-lock card. It&apos;s a single switch, off by default, with no
                            per-screen configuration.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Does it work alongside the PIN lock?</Trans>}
                    answer={
                        <Trans>
                            Yes — the two settings are independent. PIN lock controls who can open the app; Screenshot Protection controls
                            what balances show while it&apos;s in the background.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
