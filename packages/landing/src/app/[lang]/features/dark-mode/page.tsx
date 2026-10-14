/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Moon, Rocket, SunMoon } from 'lucide-react';

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
                tagline={
                    <Trans>
                        System-adaptive dark theme that respects OLED displays and switches with your device, or lock to dark or light.
                    </Trans>
                }
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
                        Switching modes is one tap on the Dark Mode toggle in Settings — a manual switch, not an automatic handoff.
                    </Trans>
                </FeatureStory.Point>
            </FeatureStory>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Moon} title={<Trans>True black for OLED</Trans>}>
                    <Trans>OLED-friendly true black canvas — saves battery on modern phones</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={SunMoon} title={<Trans>Follows your system theme</Trans>}>
                    <Trans>A single Dark Mode toggle in Settings — defaults to your system theme, switch it manually anytime</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Rocket} title={<Trans>No white flash at launch</Trans>}>
                    <Trans>No white flash on cold launch — native splash respects the OS theme</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Chart palettes auto-recompute for legibility on dark canvas</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Persists across app relaunch and device restarts</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why a finance app at midnight matters</Trans>}>
                    <p>
                        <Trans>
                            A finance app you check at midnight should not blast your retinas. Budgie&apos;s dark theme is OLED-friendly
                            black, not a dimmed gray, and respects the system preference by default.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Manual override is two taps in Settings. The theme switch is non-flickering on cold launch (no white-flash).
                            Charts and accents recolor for legibility.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Is it true black or just dark gray?</Trans>}
                    answer={
                        <Trans>
                            OLED-friendly black for the background. Cards and surfaces are dark gray for hierarchy, but the canvas pixels
                            are off — saves battery on OLED screens.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>Does it switch automatically?</Trans>}
                    answer={<Trans>Yes — system theme by default. Override to Light or Dark in Settings if you prefer.</Trans>}
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Why no white flash on cold launch?</Trans>}
                    answer={
                        <Trans>
                            The native splash screen reads the OS theme directly so the transition into the app stays in dark mode without
                            an intermediate light state.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>Do charts recolor?</Trans>}
                    answer={
                        <Trans>
                            Yes. Chart palettes recompute for legibility — emerald accents shift slightly for contrast on a dark canvas.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
