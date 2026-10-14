/* eslint-disable max-lines-per-function */
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { CalendarDays, Repeat, Search } from 'lucide-react';

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

export default async function RecurringPaymentsCalendarFeaturePage(props: PageLangParam) {
    const { lang } = await props.params;
    const i18n = initLingui(lang);

    const featureName = i18n._(FEATURE_METADATA.name);
    const firstShotAlt = t(
        i18n
    )`Budgie Recurring screen showing a September 2026 calendar with detected payment days marked and an upcoming charges list`;

    return (
        <FeaturePageShell lang={lang} meta={FEATURE_METADATA}>
            <FeaturePageHero
                breadcrumbs={<FeatureBreadcrumbs current={featureName} locale={lang} />}
                heading={<Trans>Spot subscriptions before they bill</Trans>}
                tagline={
                    <Trans>
                        Budgie spots subscription patterns and renewals, plots them on a month calendar, and forecasts what&apos;s coming.
                    </Trans>
                }
            >
                <FeaturePageHero.Shot
                    alt={firstShotAlt}
                    locale={lang}
                    scene="recurring-payments-calendar-1"
                    slug="recurring-payments-calendar"
                />
            </FeaturePageHero>

            <FeatureStory>
                <FeatureStory.Intro heading={<Trans>The slow leak in every budget</Trans>}>
                    <Trans>
                        Budgie scans your history for amount and cadence patterns and plots every recurring charge on a month calendar.
                    </Trans>
                </FeatureStory.Intro>

                <FeatureStory.Step index={0} title={<Trans>Detected, not declared</Trans>}>
                    <Trans>
                        Budgie finds the pattern itself — same merchant, similar amount, regular interval — and marks the days those charges
                        fall on.
                    </Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={firstShotAlt}
                    index={0}
                    locale={lang}
                    scene="recurring-payments-calendar-1"
                    slug="recurring-payments-calendar"
                >
                    <FeatureStory.Callout y={0.393}>
                        <Trans>Detected, not added</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={1} title={<Trans>A month grid of what bills</Trans>}>
                    <Trans>Every marked day is a real recurring charge. The upcoming list totals what is still to come this month.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(
                        i18n
                    )`Budgie Recurring screen showing a September 2026 calendar with detected payment days marked and an upcoming charges list`}
                    index={1}
                    locale={lang}
                    scene="recurring-payments-calendar-1"
                    slug="recurring-payments-calendar"
                >
                    <FeatureStory.Callout y={0.677}>
                        <Trans>Upcoming charges</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>

                <FeatureStory.Step index={2} title={<Trans>Bi-monthly and quarterly too</Trans>}>
                    <Trans>Tap any marked day to see exactly what bills — here Day 15 lists the gym, Netflix and Spotify.</Trans>
                </FeatureStory.Step>
                <FeatureStory.Shot
                    alt={t(i18n)`Budgie Recurring screen with Day 15 selected and a list of Gym Membership, Netflix and Spotify charges`}
                    index={2}
                    locale={lang}
                    scene="recurring-payments-calendar-2"
                    slug="recurring-payments-calendar"
                >
                    <FeatureStory.Callout y={0.611}>
                        <Trans>Charges for that day</Trans>
                    </FeatureStory.Callout>
                </FeatureStory.Shot>
            </FeatureStory>

            <FeatureSpecTiles heading={<Trans>Found in your history, not typed in</Trans>}>
                <FeatureSpecTiles.Tile title={<Trans>months of history checked for patterns</Trans>} value="24">
                    <Trans>A subscription is spotted from its rhythm, not just this month.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>billing rhythms recognised</Trans>} value="7">
                    <Trans>From weekly to yearly, so nothing is forced into a monthly slot.</Trans>
                </FeatureSpecTiles.Tile>
                <FeatureSpecTiles.Tile title={<Trans>to add by hand</Trans>} value={<Trans>Nothing</Trans>}>
                    <Trans>Charges are detected from what you already recorded.</Trans>
                </FeatureSpecTiles.Tile>
            </FeatureSpecTiles>

            <FeatureCropBand
                heading={<Trans>Tap a day, see the bills</Trans>}
                lede={<Trans>Each marked day opens the list of charges due, with a total.</Trans>}
                shot={
                    <FeatureCropBand.Shot
                        alt={t(
                            i18n
                        )`Budgie Recurring screen with Day 15 selected, its total and charges for Gym Membership, Netflix and Spotify`}
                        locale={lang}
                        scene="recurring-payments-calendar-2"
                        slug="recurring-payments-calendar"
                        y={0.5}
                    >
                        <FeatureCropBand.Pin x={0.74} y={0.553} />
                        <FeatureCropBand.Pin x={0.78} y={0.6} />
                        <FeatureCropBand.Pin x={0.78} y={0.7} />
                    </FeatureCropBand.Shot>
                }
            >
                <FeatureCropBand.Note>
                    <Trans>The day&apos;s total</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Every charge due that day</Trans>
                </FeatureCropBand.Note>
                <FeatureCropBand.Note>
                    <Trans>Its category beside each one</Trans>
                </FeatureCropBand.Note>
            </FeatureCropBand>

            <FeatureBenefits>
                <FeatureBenefits.Benefit icon={Search} title={<Trans>Found without setup</Trans>}>
                    <Trans>Auto-detection scans transaction history for amount + cadence patterns — no manual setup</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={CalendarDays} title={<Trans>See what bills when</Trans>}>
                    <Trans>Month-grid calendar plots upcoming renewals; tap a day to see what&apos;s billing</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Benefit icon={Repeat} title={<Trans>Real billing rhythm</Trans>}>
                    <Trans>Inferred cadence — monthly, bi-monthly, or quarterly — instead of forcing every bill into a monthly slot</Trans>
                </FeatureBenefits.Benefit>
                <FeatureBenefits.Included>
                    <FeatureBenefits.Item>
                        <Trans>Cross-currency recurring shows in your home currency; original amount on tap</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Fuzzy merchant matching keeps one series together even when a bank mangles the name</Trans>
                    </FeatureBenefits.Item>
                    <FeatureBenefits.Item>
                        <Trans>Scans 24 months of history to detect a pattern, not just the current month</Trans>
                    </FeatureBenefits.Item>
                </FeatureBenefits.Included>
            </FeatureBenefits>

            <FeatureDetails>
                <FeatureDetails.Item index={0} title={<Trans>Why subscriptions need their own view</Trans>}>
                    <p>
                        <Trans>
                            Subscriptions are the slow leak in every budget. Budgie scans your transaction history for amount + cadence
                            patterns (Netflix, gym, mortgage, ISA) and surfaces them on a dedicated calendar tab.
                        </Trans>
                    </p>
                    <p>
                        <Trans>
                            Tap a calendar day to see the transactions due. Past months show actuals, the current month shows actuals to
                            date plus what&apos;s projected for the rest of it, and future months show projections you reach by navigating
                            forward. Cross-currency recurring shows in your home currency; original amount on tap.
                        </Trans>
                    </p>
                </FeatureDetails.Item>
                <FeatureDetails.Guides index={1} locale={lang} slugs={FEATURE_METADATA.relatedArticleSlugs} />
            </FeatureDetails>

            <FeatureFaq locale={lang}>
                <FeatureFaq.Item
                    index={0}
                    question={<Trans>How does Budgie know what&apos;s recurring?</Trans>}
                    answer={
                        <Trans>
                            A background scan looks at your transaction history for amount + cadence patterns: same vendor, similar amount,
                            regular interval. Confidence scores filter out one-off matches.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={1}
                    question={<Trans>What about cross-currency subscriptions?</Trans>}
                    answer={
                        <Trans>
                            Recurring entries show in your home currency on the calendar; tap any entry to see the original amount and
                            currency.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={2}
                    question={<Trans>Can bi-monthly or quarterly bills show up correctly?</Trans>}
                    answer={
                        <Trans>
                            Yes. Budgie infers each pattern&apos;s real interval from the gaps between charges instead of assuming
                            everything is monthly, so a bi-monthly premium or a quarterly tax payment lands on the right day instead of
                            being forced into a monthly slot.
                        </Trans>
                    }
                />
                <FeatureFaq.Item
                    index={3}
                    question={<Trans>How far does the forecast go?</Trans>}
                    answer={
                        <Trans>
                            As far as the month you&apos;re viewing. Past months show what actually happened, the current month shows
                            actuals to date plus what&apos;s projected for the rest of it, and future months show projections — navigate
                            month to month to look further ahead.
                        </Trans>
                    }
                />
            </FeatureFaq>
        </FeaturePageShell>
    );
}
