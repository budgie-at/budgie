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
import { createFeatureGenerateMetadata } from '../../../../feature/util/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function ScreenshotProtectionFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={featureName}
                locale={lang}
                tagline={
                    <Trans>
                        Account balances and net worth switch to a placeholder the instant Budgie leaves the foreground — one switch in
                        Settings → Security.
                    </Trans>
                }
            />

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

                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Settings screen showing the Security section with the PIN-lock card above an enabled Screenshot Protection switch`}
                    index={0}
                    locale={lang}
                    priority
                    scene="screenshot-protection-1"
                    slug="screenshot-protection"
                >
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

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why a glance at the app switcher is a real privacy leak</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Swipe up to switch apps and whatever was on screen a moment ago is still there in the preview — including account
                        balances and net worth. Screenshot Protection replaces those numbers with a placeholder for as long as Budgie
                        isn&apos;t the active app.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>Off by default. Turn it on in Settings → Security and it applies immediately, with no per-screen setup.</Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>One switch in Settings → Security, right under the PIN-lock card</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>Masks account balances and net worth the instant the app stops being active</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Covers every protected amount Budgie renders, not just the home screen</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Off by default — nothing is hidden until you turn it on</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Pairs with the PIN lock for a fuller privacy seal</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>What does Screenshot Protection actually hide?</Trans>}
                    answer={
                        <Trans>
                            Account balances and net worth switch to a placeholder wherever Budgie renders them, for as long as the app
                            isn&apos;t the active app — most visible when you open the app switcher.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does it block screenshots or screen recordings?</Trans>}
                    answer={
                        <Trans>
                            No. The switch changes what Budgie renders while it isn&apos;t active; it doesn&apos;t intercept a screenshot or
                            recording taken of the device.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Where do I turn it on?</Trans>}
                    answer={
                        <Trans>
                            Settings → Security, directly below the PIN-lock card. It&apos;s a single switch, off by default, with no
                            per-screen configuration.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does it work alongside the PIN lock?</Trans>}
                    answer={
                        <Trans>
                            Yes — the two settings are independent. PIN lock controls who can open the app; Screenshot Protection controls
                            what balances show while it&apos;s in the background.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
