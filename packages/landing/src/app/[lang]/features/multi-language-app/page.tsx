/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Languages, RefreshCw, Smartphone } from 'lucide-react';

import { FeatureBenefits } from '../../../../feature/component/feature-benefits/feature-benefits';
import { FeatureBreadcrumbs } from '../../../../feature/component/feature-breadcrumbs/feature-breadcrumbs';
import { FeatureCropBand } from '../../../../feature/component/feature-crop-band/feature-crop-band';
import { FeatureDetails } from '../../../../feature/component/feature-details/feature-details';
import { FeatureFaq } from '../../../../feature/component/feature-faq/feature-faq';
import { FeaturePageHero } from '../../../../feature/component/feature-page-hero/feature-page-hero';
import { FeaturePageShell } from '../../../../feature/component/feature-page-shell/feature-page-shell';
import { FeatureSpecTiles } from '../../../../feature/component/feature-spec-tiles/feature-spec-tiles';
import { FeatureStory } from '../../../../feature/component/feature-story/feature-story';
import { createFeatureGenerateMetadata } from '../../../../feature/utils/create-feature-generate-metadata.util';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';

import { FEATURE_METADATA } from './metadata';

export const generateMetadata = createFeatureGenerateMetadata(FEATURE_METADATA);

export default async function MultiLanguageAppFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie language selector sheet with a search box and English, French and Ukrainian rows, each with a flag and language code`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Budgie speaks your language</Trans>}
                tagline={
                    <Trans>
                        Full UI in English, Ukrainian, French, German, and Spanish. Auto-detected from device locale, switchable in-app.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot alt={firstShotAlt} locale={lang} scene="multi-language-app-1" slug="multi-language-app" />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>The same app, five languages deep</Trans>}>
                    <Trans>Two screens: the language sheet that lists all five, and the Settings page it hands you back to.</Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Five languages, all first-class</Trans>}>
                    <Trans>English, Ukrainian, French, German and Spanish.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot alt={firstShotAlt} index={0} locale={lang} scene="multi-language-app-1" slug="multi-language-app">
                    <FeatureStory.Callout y={0.62}>
                        <Trans>Search bar above the list</Trans>
                    </FeatureStory.Callout>
                    <FeatureStory.Callout y={0.69}>
                        <Trans>Flag, name and code per row</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>Switches without a relaunch</Trans>}>
                    <Trans>Pick one and the whole UI re-renders in place — Settings included.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie settings screen with the General section showing the Language row set to the active language above Main Currency and Default Account`}
                    index={1}
                    locale={lang}
                    scene="offline-first-expense-tracker-2"
                    slug="offline-first-expense-tracker"
                >
                    <FeatureStory.Callout y={0.518}>
                        <Trans>Language row shows your pick</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureSpecTiles heading={<Trans>Switch in a moment</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>languages in the app</Trans>} value="5">
                    <Trans>English, Ukrainian, French, German and Spanish.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>relaunches to change language</Trans>} value="0">
                    <Trans>Pick a language and the screen updates in place.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>language from your device at first launch</Trans>} value={<Trans>Auto</Trans>}>
                    <Trans>Change it anytime in Settings.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureCropBand
                heading={<Trans>Find your language fast</Trans>}
                lede={<Trans>One sheet lists every language with a flag and a code.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(
                            i18n
                        )`Budgie language selector sheet with a search box and English, French and Ukrainian rows, English ticked as the active language`}
                        locale={lang}
                        scene="multi-language-app-1"
                        slug="multi-language-app"
                        y={0.55}
                    >
                        <FeatureCropBand.Pin x={0.75} y={0.628} />
                        <FeatureCropBand.Pin x={0.7} y={0.715} />
                        <FeatureCropBand.Pin x={0.7} y={0.79} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>Search by name or code</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>A tick marks the active language</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Flag, name and code per row</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Languages} title={<Trans>Five full languages</Trans>}>
                    <Trans>Five languages: English, Ukrainian, French, German, Spanish — full UI</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Smartphone} title={<Trans>Set up in your language</Trans>}>
                    <Trans>Auto-detected from device locale on first launch</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={RefreshCw} title={<Trans>Switch without relaunching</Trans>}>
                    <Trans>In-app switcher — no reinstall, no relaunch</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Number and date formatting follows the language you choose in Settings</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why privacy-first finance shouldn&apos;t be English-only</Trans>}>
                    <p>
                        <Trans>
                            Privacy-first finance tools are usually English-only. Budgie ships full translations across five languages so
                            non-English-first speakers don&apos;t lose features in translation.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Language switching is in-app — no reinstall. Numbers and dates format using whichever language you have
                            selected; there is no separate locale setting to keep in sync.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>Which languages are supported?</Trans>}
                    answer={
                        <Trans>
                            English (source), Ukrainian, French, German, Spanish. More on the roadmap as the community contributes
                            translations.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>How does language detection work?</Trans>}
                    answer={<Trans>Auto-detected from device locale on first launch. Override anytime in Settings → Language.</Trans>}
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Does it require a relaunch?</Trans>}
                    answer={<Trans>No. Switching language re-renders the UI in-place, no reinstall or relaunch.</Trans>}
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>What about number / date formats?</Trans>}
                    answer={
                        <Trans>
                            Numbers and dates format according to whichever language is active in Settings — there is no separate locale
                            setting to configure.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
