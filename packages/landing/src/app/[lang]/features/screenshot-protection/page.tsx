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
                        One switch in Settings → Security asks your phone to block screenshots and screen recordings, and hides amounts
                        whenever Budgie is not the active app.
                    </Trans>
                }
            />

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

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why a glance at the app switcher is a real privacy leak</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        Swipe up to switch apps and whatever was on screen a moment ago is still there in the preview — including balances
                        and amounts. Screenshot Protection replaces those numbers with a placeholder for as long as Budgie isn&apos;t the
                        active app, and asks your phone to block captures while it&apos;s on.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Off by default. Turn it on in Settings → Security and it applies immediately to the whole app. It is one global
                        switch, not a per-screen setting.
                    </Trans>
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
                        <Trans>Asks your phone to block screenshots and screen recordings while it is on</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Replaces amounts with a placeholder the instant the app stops being active</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>Off by default — nothing is hidden until you turn it on</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Home-screen widgets also hide amounts while the PIN lock is on</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>What does Screenshot Protection actually hide?</Trans>}
                    answer={
                        <Trans>
                            Amounts, such as account balances and net worth, switch to a placeholder for as long as Budgie isn&apos;t the
                            active app — most visible when you open the app switcher.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does it block screenshots and screen recordings?</Trans>}
                    answer={
                        <Trans>
                            Yes, while the switch is on Budgie asks your phone to block screen capture. Exactly how a blocked capture looks,
                            blank or refused, depends on your phone.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Where do I turn it on?</Trans>}
                    answer={
                        <Trans>
                            Settings → Security, directly below the PIN-lock card. It&apos;s a single switch for the whole app, off by
                            default, with no per-screen configuration.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>Does it work alongside the PIN lock?</Trans>}
                    answer={
                        <Trans>
                            Yes — the two settings are independent. PIN lock controls who can open the app; Screenshot Protection controls
                            what others can capture or glimpse from it.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
