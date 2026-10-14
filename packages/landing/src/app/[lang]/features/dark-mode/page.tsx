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

export default async function DarkModeFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.title);

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>True Dark Mode (Not Just Dimmed)</Trans>}
                locale={lang}
                tagline={<Trans>A black dark theme that follows your device until you flip the Dark Mode switch in Settings.</Trans>}
            />

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>What the transaction list actually shows</Trans>}>
                    <Trans>One real screen, rendered in whichever theme this page is in right now.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Point index={0}>
                    <Trans>The background is solid black, not a dimmed grey panel layered over a light design.</Trans>
                </FeatureStory.Point>

                <FeatureStory.Shot
                    alt={t(i18n)`Budgie transaction list in dark mode with a solid black background and bright red and green amounts`}
                    index={0}
                    locale={lang}
                    priority
                    scene="expense-tracking-2"
                    slug="expense-tracking"
                >
                    <FeatureStory.Callout index={0} y={0.09}>
                        <Trans>Solid black surface</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout index={1} y={0.422}>
                        <Trans>Brighter red and green</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Point index={1}>
                    <Trans>
                        Expense and income amounts shift to brighter red and green in dark mode, not the muted tones carried over from light
                        mode.
                    </Trans>
                </FeatureStory.Point>
                <FeatureStory.Point index={2}>
                    <Trans>
                        Switching is one tap on the Dark Mode switch in Settings. It is a single on/off switch: once you use it, Budgie
                        stays on the theme you chose.
                    </Trans>
                </FeatureStory.Point>
            </FeatureStory>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>Why a finance app at midnight matters</Trans>
                </FeaturePageHeading>
                <FeaturePageProse>
                    <Trans>
                        A finance app you check at midnight should not blast your retinas. Budgie&apos;s dark theme uses a black background,
                        not a dimmed gray, and follows your device&apos;s setting until you switch it yourself.
                    </Trans>
                </FeaturePageProse>
                <FeaturePageProse>
                    <Trans>
                        Your choice is remembered the next time you open Budgie. The launch screen is black in dark mode, and green and red
                        amounts turn brighter so they stay easy to read.
                    </Trans>
                </FeaturePageProse>
            </FeaturePageSection>

            <FeaturePageSection>
                <FeaturePageHeading>
                    <Trans>What you get</Trans>
                </FeaturePageHeading>
                <FeaturePageBenefitGrid>
                    <FeaturePageBenefitGridItem index={0}>
                        <Trans>A true black background instead of a dimmed gray panel</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={1}>
                        <Trans>One Dark Mode switch in Settings — follows your device&apos;s theme until you switch it</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={2}>
                        <Trans>Brighter green and red amounts for legibility on black</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={3}>
                        <Trans>A black launch screen in dark mode</Trans>
                    </FeaturePageBenefitGridItem>
                    <FeaturePageBenefitGridItem index={4}>
                        <Trans>Your choice is remembered after you close and reopen Budgie</Trans>
                    </FeaturePageBenefitGridItem>
                </FeaturePageBenefitGrid>
            </FeaturePageSection>

            <FeaturePageFaqSection locale={lang}>
                <FeaturePageFaqItem
                    question={<Trans>Is it true black or just dark gray?</Trans>}
                    answer={<Trans>Black for the background. Cards and surfaces are dark gray for hierarchy.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>Does it switch automatically?</Trans>}
                    answer={
                        <Trans>
                            Yes, until you touch the switch. Budgie follows your device&apos;s theme by default. Once you flip the Dark Mode
                            switch in Settings, it stays on the theme you picked and does not go back to following the device.
                        </Trans>
                    }
                />
                <FeaturePageFaqItem
                    question={<Trans>What does the launch screen look like?</Trans>}
                    answer={<Trans>The launch screen is black when your device is in dark mode and white when it is in light mode.</Trans>}
                />
                <FeaturePageFaqItem
                    question={<Trans>Do the colors change?</Trans>}
                    answer={
                        <Trans>
                            Yes. Green income and red expense amounts turn brighter in dark mode so they stay easy to read on black.
                        </Trans>
                    }
                />
            </FeaturePageFaqSection>
        </FeaturePageShell>
    );
}
