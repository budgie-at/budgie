/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Moon, Palette, Rocket, SunMoon } from 'lucide-react';

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

export default async function DarkModeFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(i18n)`Budgie transaction list in dark mode with a solid black background and bright red and green amounts`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Truly dark, easy on the eyes</Trans>}
                tagline={<Trans>A black dark theme that follows your device until you flip the Dark Mode switch in Settings.</Trans>}
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="expense-tracking-2" slug="expense-tracking" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>What the transaction list actually shows</Trans>}>
                    <Trans>One real screen, rendered in whichever theme this page is in right now.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Point index={0}>
                    <Trans>The background is solid black, not a dimmed grey panel layered over a light design.</Trans>
                </FeatureStory.Point>

                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="expense-tracking-2" slug="expense-tracking">
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

            <FeatureSpecTiles heading={<Trans>Light or dark, your call</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>to switch between light and dark</Trans>} value={<Trans>One tap</Trans>}>
                    <Trans>The Dark Mode switch lives in Settings, under Appearance.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>launch screens, one for each theme</Trans>} value="2">
                    <Trans>The splash screen has a white version and a black one.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>between launches</Trans>} value={<Trans>Saved</Trans>}>
                    <Trans>The theme you pick is still there next time.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureProof
                crop={
                    <FeatureProof.Crop
                        alt={t(i18n)`Budgie transaction list showing red expense amounts and a green income amount on expense cards`}
                        locale={lang}
                        scene="expense-tracking-2"
                        slug="expense-tracking"
                        y={0.55}
                    />
                }
                heading={<Trans>Compare it on this page</Trans>}
                lede={<Trans>This screenshot follows the theme of the page, so switch the site to dark and look again.</Trans>}
            >
                <FeatureProof.Fact icon={Palette}>
                    <Trans>Red and green get brighter versions in dark mode</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Fact icon={Moon}>
                    <Trans>The dark surface is pure black</Trans>
                </FeatureProof.Fact>
                <FeatureProof.Source />
            </FeatureProof>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Moon} title={<Trans>True black background</Trans>}>
                    <Trans>A true black background instead of a dimmed gray panel</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={SunMoon} title={<Trans>Follows your system theme</Trans>}>
                    <Trans>One Dark Mode switch in Settings — follows your device&apos;s theme until you switch it</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Rocket} title={<Trans>A black launch screen</Trans>}>
                    <Trans>A black launch screen in dark mode</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Brighter green and red amounts for legibility on black</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Your choice is remembered after you close and reopen Budgie</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why a finance app at midnight matters</Trans>}>
                    <p>
                        <Trans>
                            A finance app you check at midnight should not blast your retinas. Budgie&apos;s dark theme uses a black
                            background, not a dimmed gray, and follows your device&apos;s setting until you switch it yourself.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Your choice is remembered the next time you open Budgie. The launch screen is black in dark mode, and green and
                            red amounts turn brighter so they stay easy to read.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Is it true black or just dark gray?</Trans>}
                    answer={<Trans>Black for the background. Cards and surfaces are dark gray for hierarchy.</Trans>}
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Does it switch automatically?</Trans>}
                    answer={
                        <Trans>
                            Yes, until you touch the switch. Budgie follows your device&apos;s theme by default. Once you flip the Dark Mode
                            switch in Settings, it stays on the theme you picked and does not go back to following the device.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>What does the launch screen look like?</Trans>}
                    answer={<Trans>The launch screen is black when your device is in dark mode and white when it is in light mode.</Trans>}
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Do the colors change?</Trans>}
                    answer={
                        <Trans>
                            Yes. Green income and red expense amounts turn brighter in dark mode so they stay easy to read on black.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
